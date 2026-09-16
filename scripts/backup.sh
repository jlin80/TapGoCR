#!/usr/bin/env bash
#
# Backup diario de TapGoCR: base de datos + archivos subidos por los negocios.
#
#   ./scripts/backup.sh
#
# Se corre por cron en el contenedor de base de datos (ver README, sección
# "Base de datos" — el cron de producción vive en el propio homelab, no en el
# hosting de la app).
#
# Guarda dos archivos por corrida en BACKUP_DIR:
#   - tapgocr-db-<fecha>.sql.gz       (mysqldump comprimido: restaura con
#                                       `gunzip -c archivo.sql.gz | mysql ...`)
#   - tapgocr-uploads-<fecha>.tar.gz  (todo /srv/tapgocr-uploads o UPLOADS_DIR)
#
# Y borra lo que sea más viejo que BACKUP_RETENTION_DAYS (14 por defecto): un
# backup que crece para siempre no es una política de retención, es un
# problema de disco a plazo.
#
# Esto vive en el mismo servidor que respalda: es la primera línea de defensa
# (borrado accidental, migración que sale mal), no la única. Sigue pendiente
# una copia fuera del homelab (pull por SSH de comando forzado hacia otra
# máquina), documentado en Notion como pendiente aparte.

set -euo pipefail

cd "$(dirname "$0")/.."

readonly BACKUP_DIR="${BACKUP_DIR:-/srv/tapgocr-backups}"
readonly RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
readonly STAMP="$(date +%Y%m%d-%H%M%S)"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
die()  { printf '\n  \033[31m✗ %s\033[0m\n\n' "$1" >&2; exit 1; }

[ -f .env ] || die "Falta el archivo .env."

set -a
# shellcheck disable=SC1091
. ./.env
set +a

[ -n "${DATABASE_URL:-}" ] || die "Falta DATABASE_URL en .env"

mkdir -p "$BACKUP_DIR"
# Los dumps contienen hashes de contraseña y datos de clientes: la carpeta y
# cada archivo que se genere abajo quedan restringidos al dueño del proceso,
# nunca legibles por otro usuario del mismo servidor.
chmod 700 "$BACKUP_DIR"

bold "Backup de TapGoCR — $STAMP"

# --- Base de datos -----------------------------------------------------------

# `mysql://usuario:clave@host:puerto/base` -> variables sueltas, porque
# mysqldump no acepta una URL de conexión como la de Prisma.
db_no_scheme="${DATABASE_URL#mysql://}"
db_creds="${db_no_scheme%%@*}"
db_hostpart="${db_no_scheme#*@}"
db_user="${db_creds%%:*}"
db_pass="${db_creds#*:}"
db_hostport="${db_hostpart%%/*}"
db_host="${db_hostport%%:*}"
db_port="${db_hostport#*:}"
[ "$db_port" = "$db_hostport" ] && db_port=3306
db_name="${db_hostpart#*/}"
db_name="${db_name%%\?*}"

db_file="$BACKUP_DIR/tapgocr-db-$STAMP.sql.gz"
MYSQL_PWD="$db_pass" mysqldump \
  --host="$db_host" --port="$db_port" --user="$db_user" \
  --single-transaction --routines --triggers \
  "$db_name" | gzip > "$db_file"
chmod 600 "$db_file"
ok "Base de datos: $db_file ($(du -h "$db_file" | cut -f1))"

# --- Archivos subidos ---------------------------------------------------------

uploads_dir="${UPLOADS_DIR:-./uploads}"
if [ -d "$uploads_dir" ]; then
  uploads_file="$BACKUP_DIR/tapgocr-uploads-$STAMP.tar.gz"
  tar -czf "$uploads_file" -C "$(dirname "$uploads_dir")" "$(basename "$uploads_dir")"
  chmod 600 "$uploads_file"
  ok "Archivos subidos: $uploads_file ($(du -h "$uploads_file" | cut -f1))"
else
  printf '  ! No existe %s, no hay nada que respaldar ahí.\n' "$uploads_dir"
fi

# --- Retención -----------------------------------------------------------------

deleted=0
while IFS= read -r -d '' old; do
  rm -f "$old"
  deleted=$((deleted + 1))
done < <(find "$BACKUP_DIR" -maxdepth 1 -name 'tapgocr-*' -mtime "+$RETENTION_DAYS" -print0)

if [ "$deleted" -gt 0 ]; then
  ok "Se borraron $deleted backups de más de $RETENTION_DAYS días."
fi

printf '\n'
bold "Backup terminado"
