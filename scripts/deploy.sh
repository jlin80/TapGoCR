#!/usr/bin/env bash
#
# Despliegue de TapGoCR en un VPS.
#
#   ./scripts/deploy.sh
#
# Se ejecuta EN el servidor, desde la carpeta del proyecto. Es idempotente:
# sirve igual para la primera instalación que para cada actualización.
#
# Lo que hace:
#   1. Comprueba que el entorno esté completo antes de tocar nada.
#   2. Instala dependencias exactas.
#   3. Aplica las migraciones pendientes.
#   4. Compila.
#   5. Reinicia el servicio, si existe.
#
# Lo que NO hace, a propósito:
#   - No carga datos de demostración.
#   - No crea la cuenta ROOT: eso es `npm run root:set`, que pide la contraseña
#     por teclado para no dejarla en el historial del shell.
#   - No instala PostgreSQL, nginx ni certificados.

set -euo pipefail

readonly SERVICE_NAME="${TAPGOCR_SERVICE:-tapgocr}"
readonly MIN_NODE_MAJOR=20

cd "$(dirname "$0")/.."

# --- Salida ----------------------------------------------------------------

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }
die()  { printf '\n  \033[31m✗ %s\033[0m\n\n' "$1" >&2; exit 1; }

# --- 1. Comprobaciones previas ---------------------------------------------

bold "Comprobando el entorno"

command -v node >/dev/null || die "Node.js no está instalado."
command -v npm  >/dev/null || die "npm no está instalado."

node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$node_major" -lt "$MIN_NODE_MAJOR" ]; then
  die "Node $node_major es muy viejo. Hace falta $MIN_NODE_MAJOR o superior."
fi
ok "Node $(node -v)"

[ -f .env ] || die "Falta el archivo .env. Copiá .env.example y completalo."

# Se leen las variables sin volcarlas al log: solo interesa si están definidas.
set -a
# shellcheck disable=SC1091
. ./.env
set +a

[ -n "${DATABASE_URL:-}" ] || die "Falta DATABASE_URL en .env"
[ -n "${AUTH_SECRET:-}" ]  || die "Falta AUTH_SECRET en .env. Generalo con: npx auth secret"
[ -n "${NEXT_PUBLIC_TAPGO_DOMAIN:-}" ] || die "Falta NEXT_PUBLIC_TAPGO_DOMAIN en .env"

# La aplicación confía en la cabecera Host para funcionar detrás del proxy. Sin
# AUTH_URL fija, un Host falsificado podría desviar las URLs de autenticación.
[ -n "${AUTH_URL:-}" ] || die "Falta AUTH_URL en .env. Debe ser la URL canónica, por ejemplo https://tudominio.com"

case "$AUTH_URL" in
  https://*) ;;
  *) die "AUTH_URL debe empezar por https:// en producción. Valor actual: $AUTH_URL" ;;
esac
ok "AUTH_URL: $AUTH_URL"

case "$NEXT_PUBLIC_TAPGO_DOMAIN" in
  localhost*|127.0.0.1*)
    die "NEXT_PUBLIC_TAPGO_DOMAIN sigue apuntando a localhost. Ese valor queda
     grabado en el build: los QR y las URLs de los tags apuntarían a tu máquina."
    ;;
esac
ok "Dominio público: ${NEXT_PUBLIC_TAPGO_PROTOCOL:-https}://$NEXT_PUBLIC_TAPGO_DOMAIN"

if [ -z "${ANALYTICS_IP_SALT:-}" ]; then
  warn "Sin ANALYTICS_IP_SALT no se guarda ningún dato de origen en analytics."
fi

if [ -z "${TZ:-}" ]; then
  warn "TZ no está definida. Conviene TZ=America/Costa_Rica para los cortes diarios."
fi

# Sin UPLOADS_DIR, los archivos que suban los negocios caen en ./uploads: el
# próximo despliegue los borra, porque reemplaza todo este directorio con un
# rsync --delete desde el paquete que se sube.
project_dir="$(pwd)"
if [ -z "${UPLOADS_DIR:-}" ]; then
  warn "UPLOADS_DIR no está definida: los archivos subidos viven en ./uploads y el próximo despliegue los borra."
elif [ "${UPLOADS_DIR#"$project_dir"}" != "$UPLOADS_DIR" ]; then
  warn "UPLOADS_DIR ($UPLOADS_DIR) está dentro de este proyecto: el próximo despliegue borraría los archivos subidos."
fi

# Copiar node_modules desde otra máquina trae binarios de otra plataforma.
if [ -d node_modules ] && [ ! -f node_modules/.tapgocr-installed-here ]; then
  warn "node_modules viene de otra máquina o de una instalación previa incompleta."
  warn "Se reinstala desde cero para evitar binarios de otra plataforma."
  rm -rf node_modules
fi

# --- 2. Dependencias --------------------------------------------------------

bold "Instalando dependencias"

# Con todas las dependencias, no solo las de producción: el build necesita
# TypeScript y Tailwind, y las migraciones necesitan Prisma.
npm ci
touch node_modules/.tapgocr-installed-here
ok "Dependencias instaladas"

# --- 3. Base de datos -------------------------------------------------------

bold "Aplicando migraciones"

# `migrate deploy` solo aplica lo ya creado: nunca genera migraciones nuevas ni
# borra datos.
npx prisma migrate deploy
ok "Base de datos al día"

# --- 4. Compilación ---------------------------------------------------------

bold "Compilando"

# Las variables NEXT_PUBLIC_* se incrustan acá: por eso el build va después de
# validar el dominio.
NODE_ENV=production npm run build
ok "Build listo"

# --- 5. Servicio ------------------------------------------------------------

bold "Servicio"

# `systemctl cat` devuelve 0 solo si la unidad existe, y no usa tuberia.
#
# Antes esto era `systemctl list-unit-files | grep -q "^${SERVICE_NAME}.service"`,
# que fallaba siempre que la unidad SI existia: grep -q cierra la tuberia en
# cuanto encuentra la coincidencia, systemctl muere con SIGPIPE (141) y
# `set -o pipefail` propaga ese fallo. El resultado era que el servicio no se
# reiniciaba nunca y tras cada despliegue seguia corriendo el build anterior.
if command -v systemctl >/dev/null && systemctl cat "${SERVICE_NAME}.service" >/dev/null 2>&1; then
  sudo systemctl restart "$SERVICE_NAME"
  sleep 2
  if systemctl is-active --quiet "$SERVICE_NAME"; then
    ok "Servicio $SERVICE_NAME reiniciado"
  else
    die "El servicio $SERVICE_NAME no levantó. Revisá: journalctl -u $SERVICE_NAME -n 50"
  fi
else
  warn "No hay un servicio systemd llamado '$SERVICE_NAME'."
  warn "Arrancalo a mano con 'npm start' o creá la unidad (ver el README)."
fi

# --- Cierre -----------------------------------------------------------------

printf '\n'
bold "Despliegue terminado"
printf '\n'
printf '  Si es la primera instalación, creá tu cuenta:\n\n'
printf '      npm run root:set\n\n'
printf '  Y comprobá que el sitio responda por HTTPS antes de repartir placas.\n\n'
