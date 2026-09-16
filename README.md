# TapGoCR

Plataforma SaaS de NFC + QR, landing dinámica y analytics para negocios.

Un negocio recibe placas o stickers con NFC y QR. Ambos apuntan a una URL de
TapGoCR; al acercar el teléfono o escanear el código se abre la landing del
negocio, con los enlaces que el negocio administra desde su panel. El contenido
vive en la base de datos, así que se puede cambiar cuando sea sin reprogramar
ningún tag físico.

```
NFC / QR físico
      ↓
https://{dominio}/t/{code}
      ↓
Landing del negocio
      ↓
Menú · WhatsApp · Instagram · TikTok · Facebook · Google Reviews · Maps · Web
      ↓
Analytics (scans y clicks)
```

---

## Índice

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos](#base-de-datos)
- [Credenciales de demostración](#credenciales-de-demostración)
- [Verificación](#verificación)
- [Cómo funciona](#cómo-funciona)
  - [Página pública](#página-pública)
  - [Registro público](#registro-público)
  - [Roles y permisos](#roles-y-permisos)
  - [Crear un negocio](#crear-un-negocio)
  - [Crear un tag y programar el NFC](#crear-un-tag-y-programar-el-nfc)
  - [Generar y descargar el QR](#generar-y-descargar-el-qr)
  - [Desactivar y reasignar tags](#desactivar-y-reasignar-tags)
  - [Enlaces de la landing](#enlaces-de-la-landing)
  - [Chips y cuota de taps](#chips-y-cuota-de-taps)
  - [Taps y escaneos de QR](#taps-y-escaneos-de-qr)
  - [Consola ROOT](#consola-root)
  - [Analytics](#analytics)
  - [Panel del cliente](#panel-del-cliente)
  - [Dominios](#dominios)
  - [Servicios y sitios web](#servicios-y-sitios-web)
  - [Solicitudes de servicio](#solicitudes-de-servicio)
- [Seguridad](#seguridad)
- [Privacidad](#privacidad)
- [Despliegue en un VPS](#despliegue-en-un-vps)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Decisiones de diseño](#decisiones-de-diseño)
- [Fuera de alcance](#fuera-de-alcance)

---

## Requisitos

| Herramienta | Versión                                              |
| ----------- | ---------------------------------------------------- |
| Node.js     | 20 o superior (desarrollado y probado con Node 26)   |
| MySQL/MariaDB | MySQL 8+ o MariaDB 10.6+                            |
| npm         | 10 o superior                                         |

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4,
Prisma 7 y Auth.js 5.

---

## Instalación

```bash
npm install
```

`npm install` ejecuta `prisma generate` automáticamente. Si npm pide aprobar
scripts de instalación, autorizá los de Prisma:

```bash
npm approve-scripts prisma @prisma/engines
```

Copiá el archivo de entorno y completalo:

```bash
cp .env.example .env
```

Generá el secreto de sesión:

```bash
npx auth secret
```

---

## Variables de entorno

| Variable                          | Obligatoria | Descripción                                                                             |
| --------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`                    | Sí          | Cadena de conexión de MySQL/MariaDB.                                                     |
| `AUTH_SECRET`                     | Sí          | Secreto de firma de sesiones. Generar con `npx auth secret`.                             |
| `AUTH_URL`                        | En producción | URL canónica de la aplicación, por ejemplo `https://tapgocr.com`.                      |
| `NEXT_PUBLIC_TAPGO_DOMAIN`        | Sí          | Dominio público sin protocolo. Es la base de todas las URLs de tag.                      |
| `NEXT_PUBLIC_TAPGO_PROTOCOL`      | No          | `http` o `https`. Por defecto `https`; usar `http` solo en desarrollo local.             |
| `NEXT_PUBLIC_APP_NAME`            | No          | Nombre de marca mostrado en la interfaz. Por defecto `TapGoCR`.                          |
| `NEXT_PUBLIC_TAPGO_SHOW_BRANDING` | No          | `false` oculta el "Powered by TapGoCR" del pie de la landing.                            |
| `NEXT_PUBLIC_CONTACT_EMAIL`       | No          | Correo comercial mostrado en la página pública.                                          |
| `NEXT_PUBLIC_CONTACT_WHATSAPP`    | No          | WhatsApp comercial, solo dígitos en formato internacional (`50688887777`).               |
| `NEXT_PUBLIC_DEMO_TAG_CODE`       | No          | Código de un tag real para el botón "Ver un ejemplo real".                                |
| `CONTACT_RATE_LIMIT`              | No          | Envíos del formulario de contacto por IP y por hora. Por defecto 3.                       |
| `REGISTRATION_RATE_LIMIT`         | No          | Altas por IP y por hora desde el registro público. Por defecto 3.                          |
| `DATABASE_POOL_MAX`               | No          | Conexiones simultáneas a MySQL/MariaDB. Por defecto 5.                                    |
| `ROOT_EMAIL` / `ROOT_PASSWORD`    | No          | Solo para crear la cuenta ROOT sin interacción en un despliegue automatizado.              |
| `ANALYTICS_IP_SALT`               | Recomendada | Sal del hash de IP. Sin ella no se guarda ningún dato derivado de la IP.                 |
| `TAPGO_TIMEZONE`                  | No          | Zona horaria de los cortes diarios de analytics. Por defecto `America/Costa_Rica`.       |
| `SEED_ADMIN_PASSWORD`             | No          | Contraseña del admin de demostración.                                                    |
| `SEED_CLIENT_PASSWORD`            | No          | Contraseña del cliente de demostración.                                                  |

### El dominio no está en el código

El dominio definitivo de TapGoCR todavía no está decidido, así que no aparece
escrito en ningún archivo de la aplicación. Toda URL pública se construye en
[`src/lib/config.ts`](src/lib/config.ts):

```
{NEXT_PUBLIC_TAPGO_PROTOCOL}://{NEXT_PUBLIC_TAPGO_DOMAIN}/t/{code}
```

Cambiar de dominio es cambiar una variable de entorno y reconstruir. Los tags ya
fabricados siguen apuntando al dominio anterior, así que en una migración real
hay que mantener una redirección desde el dominio viejo.

> Las variables `NEXT_PUBLIC_*` se incrustan en el bundle **en tiempo de
> compilación**. Si cambiás el dominio, hay que volver a ejecutar `npm run build`.

---

## Base de datos

TapGoCR usa MySQL/MariaDB. Creá la base y el usuario, y apuntá `DATABASE_URL`
a ellos:

```bash
mysql -e "CREATE DATABASE tapgocr; CREATE USER 'tapgocr'@'%' IDENTIFIED BY 'contrasena'; GRANT ALL ON tapgocr.* TO 'tapgocr'@'%';"
```

Cualquier servidor MySQL 8+ o MariaDB 10.6+ sirve, tanto para desarrollo local
como para producción — no hace falta Docker, alcanza con `apt install
mariadb-server` (o el paquete equivalente) y crear la base de arriba.

### Migraciones y datos

```bash
npm run db:migrate
npm run db:seed
```

| Comando              | Qué hace                                                    |
| -------------------- | ----------------------------------------------------------- |
| `npm run db:migrate` | Crea y aplica migraciones en desarrollo (ver aviso abajo).   |
| `npm run db:deploy`  | Aplica migraciones existentes en producción.                 |
| `npm run db:seed`    | Carga los datos de demostración.                             |
| `npm run db:generate`| Regenera el cliente de Prisma.                               |
| `npm run db:studio`  | Abre Prisma Studio.                                          |

El seed es idempotente: se puede correr varias veces. Regenera los eventos de
analytics en cada corrida para que las gráficas muestren siempre los últimos
30 días.

`prisma migrate dev` necesita crear una base "sombra" temporal para detectar
cambios: el usuario de `DATABASE_URL` necesita permiso para crear bases en el
servidor de desarrollo (no hace falta en producción, donde solo se usa
`db:deploy`).

### Desarrollo local

```bash
npm run dev
```

- Landing pública: `http://localhost:3000/t/A8F3K29X`
- Login: `http://localhost:3000/login`

---

## Credenciales de demostración

Las crea `npm run db:seed`. **Son contraseñas de demostración: no las uses en
producción.** Cambialas con `SEED_ADMIN_PASSWORD` y `SEED_CLIENT_PASSWORD`, o
desde Configuración una vez dentro.

| Rol    | Correo                  | Contraseña             | Acceso                        |
| ------ | ----------------------- | ---------------------- | ----------------------------- |
| ROOT   | `admin@tapgocr.com`     | `TapGoCR-demo-admin`   | Todo, incluidos chips y cuotas |
| CLIENT | `burgerlab@tapgocr.com` | `TapGoCR-demo-client`  | Solo Burger Lab               |

El seed crea dos negocios —Burger Lab y Café Central— justamente para poder
comprobar que el cliente de Burger Lab no alcanza los datos del otro.

Tags de demostración: `A8F3K29X` (Mesa 1), `B4M7P52T`, `C9R2H86V`, `D5T8N34Q`,
`E2W6J71Z` y `F7Y4X93M` (de Café Central).

---

## Verificación

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Las pruebas de aislamiento multi-tenant necesitan la aplicación corriendo y los
datos de demostración cargados:

```bash
npm run dev      # en otra terminal
npm run db:seed
npm run test:e2e
```

Comprueban, entre otras cosas, que un CLIENT recibe **403** al pedir por URL un
recurso de otro negocio, que una server action con el identificador de otro
negocio no modifica nada, y que la landing pública responde sin sesión.

---

## Cómo funciona

### Página pública

La raíz `/` es el sitio comercial de TapGoCR: qué hace la plataforma, cómo
funciona, los cinco paquetes de la sección 45 y el contacto. Es la **única
página indexable** del proyecto; los paneles y las landings de tag llevan
`noindex`.

Es estática a propósito —no lee la sesión— para que cargue rápido y sea
cacheable. El enlace **Ingresar** apunta a `/login`, que ya redirige a cada
persona a su panel si tiene sesión abierta.

Los botones de WhatsApp y correo aparecen solo si `NEXT_PUBLIC_CONTACT_EMAIL` o
`NEXT_PUBLIC_CONTACT_WHATSAPP` están definidos, y el botón "Ver un ejemplo real"
solo si `NEXT_PUBLIC_DEMO_TAG_CODE` apunta a un tag existente. Sin esas
variables la página se muestra igual, sin esas llamadas a la acción.

No se publican precios: los paquetes llevan a una cotización. Los pagos no
forman parte del MVP.

#### Formulario de contacto

Es la **única escritura de la aplicación que no exige sesión**, así que lleva
tres capas de defensa:

1. Validación con Zod y límites de longitud.
2. Campo trampa (`website`): está oculto en el formulario, así que una persona
   nunca lo completa. Si viene con algo, se responde como si todo hubiera salido
   bien pero no se guarda nada — así el robot no aprende que fue detectado.
3. Límite de envíos por IP y por hora (`CONTACT_RATE_LIMIT`, 3 por defecto).

Las consultas llegan a `/app/leads`, con estado (`Nueva`, `Contactada`,
`Cotizada`, `Cerrada`, `Perdida`), notas internas y enlaces para responder por
correo o llamar. El total sin atender aparece en el dashboard.

A diferencia de los analytics, acá **sí** se guardan datos personales: la
persona los entrega voluntariamente para que la contacten. Se conserva solo lo
mínimo para responder.

#### Movimiento y animación

Los efectos funcionan en **todos los navegadores**, por dos caminos:

1. **Chrome y Edge** los resuelven en CSS puro, con `animation-timeline: view()`
   y `scroll()`. No se ejecuta nada de JavaScript.
2. **Firefox y Safari** usan el respaldo de
   [`src/components/scroll-effects.tsx`](src/components/scroll-effects.tsx):
   IntersectionObserver para las apariciones y un listener de scroll, limitado a
   una lectura por cuadro con `requestAnimationFrame`.

El componente se activa solo si `CSS.supports("animation-timeline: view()")`
devuelve `false`, así que los dos caminos nunca se pisan.

Detalle que evita el parpadeo: el respaldo marca como visible lo que ya está en
pantalla **antes** de aplicar la clase que oculta, y todo ocurre en
`useLayoutEffect`, es decir antes del pintado.

| Efecto | CSS nativo | Respaldo |
| --- | --- | --- |
| Barra de progreso de lectura | `animation-timeline: scroll(root)` | variable `--scroll-progress` |
| Aparición al scrollear, escalonada | `animation-timeline: view()` | IntersectionObserver + `animation-delay` |
| Parallax de los fondos | `animation-timeline: scroll(root)` | variable `--scroll-y` |
| Cintas infinitas | Animación CSS con la lista duplicada; la copia va `aria-hidden` | igual |
| Teléfono rotando entre rubros | Componente de cliente | igual |

Todo respeta `prefers-reduced-motion`, y **ningún contenido depende de
JavaScript para ser visible**: sin JS no se agrega la clase que oculta, y la
página queda completa y quieta.

#### Tamaños de pantalla

Se verificó que no haya desbordamiento horizontal en 320, 375, 768, 1024 y
1440 px, tanto en el sitio comercial como en la landing de un tag, el panel
administrativo y el del cliente.

Decisiones para pantallas angostas:

- El botón "Contactanos" del encabezado se oculta bajo 640 px: el botón del hero
  queda justo debajo y cumple la misma función. Se prioriza "Ingresar".
- Las tablas del panel scrollean **dentro de su contenedor**, nunca empujan la
  página.
- La navegación lateral pasa a ser una tira horizontal deslizable.
- Los botones de la landing miden 56 px de alto, por encima del mínimo
  recomendado para tocar con el dedo.

#### Secciones oscuras

Las bandas oscuras no usan colores fijos: la clase `.on-dark` **redefine los
tokens** (`--surface`, `--foreground`, `--muted`, `--border`, `--brand`) dentro
del bloque. Todo lo que ya usa `bg-surface` o `text-muted` se adapta solo, y el
resultado es el mismo en tema claro y oscuro. Para agregar otra sección oscura
basta con poner la clase; no hay que tocar ningún color.

### Registro público

Desde `/registro` un negocio pide el alta con un formulario en dos pasos: sus
datos y los del negocio. Estilo HostBill, con cédula jurídica, provincia, cantón
y código postal para poder facturar después.

**Registrarse no da acceso.** Crea una solicitud pendiente que aparece en
`/app/registrations`. Recién al aprobarla el sistema crea la cuenta y el
negocio, los vincula y asigna el código de cliente.

| Quién | Qué hace |
| --- | --- |
| La persona | Completa sus datos y **elige su contraseña** |
| El sistema | Asigna el identificador (`TGC-0001`); nadie elige usuario |
| ROOT | Aprueba o rechaza; al aprobar se crean cuenta y negocio |

La contraseña se guarda hasheada desde el registro y se reutiliza al aprobar, así
que **no hay ninguna credencial que generar ni comunicar**. Es lo que permite que
el flujo funcione sin envío de correos.

El correo no se puede repetir, ni entre solicitudes ni contra cuentas existentes.
El formulario tiene campo trampa contra robots y límite por IP.

#### Iniciar sesión

Se puede entrar con el **correo o con el código de cliente**, indistintamente.
El código lo asigna el sistema, así que quien solo recuerda uno de los dos igual
entra.

### Roles y permisos

| | ROOT | CLIENT |
| --- | --- | --- |
| Panel | `/app` | `/client` |
| Negocios que ve | Todos | Solo el suyo |
| Crear/editar negocios | Sí | No |
| Crear/editar/desactivar tags | Sí | No |
| Ver sus tags y estadísticas | Sí | Sí |
| Administrar enlaces de la landing | Sí | Sí (los suyos) |
| Inventario de chips y cuotas | Sí | Solo lectura de lo suyo |
| Reiniciar la cuota de taps | Sí | No |
| Cortar el servicio de un cliente | Sí | No |
| Dominios y servicios | Sí | Solo lectura indirecta |
| Solicitudes | Crear y resolver | Crear las suyas |
| Usuarios | Crear, asignar y restablecer contraseñas | No |

Hay **dos niveles y ninguno intermedio**: `ROOT` es el equipo de TapGoCR y
`CLIENT` es el negocio. Si más adelante hace falta personal con permisos
acotados, se agrega un tercer valor al enum `UserRole` y una función
`requireStaff` junto a `requireRoot`; el resto de la autorización no cambia.

No existe registro público: las cuentas las crea el equipo de TapGoCR desde
**Usuarios**.

### La cuenta ROOT

La crea y la recupera un comando, con la contraseña que vos elijas:

```bash
npm run root:set
```

Pide el correo y la contraseña por teclado —oculta al escribirla, dos veces para
confirmar— y crea la cuenta o le cambia la contraseña si ya existe. Sirve
igual para el alta inicial que para recuperar el acceso.

Rechaza dos cosas a propósito: contraseñas de menos de 12 caracteres, y correos
que ya pertenecen a una cuenta de cliente, porque convertir un cliente en ROOT
sería una escalada de privilegios silenciosa.

Para un despliegue automatizado existen `ROOT_EMAIL` y `ROOT_PASSWORD`, que
evitan la interacción.

> **El seed no corre en producción.** Crea cuentas con contraseñas publicadas en
> este README, así que se niega a ejecutarse con `NODE_ENV=production` salvo que
> se defina `SEED_ALLOW_PRODUCTION=true`.

### Cuentas de acceso

Desde `/app/users` el equipo crea cuentas de cliente, las asigna a un negocio,
las suspende y reactiva, y **restablece la contraseña** de un cliente que perdió
la suya. Entregá siempre la contraseña por un canal seguro y pedile a la persona
que la cambie desde Configuración.

El restablecimiento solo alcanza a cuentas `CLIENT`: un administrador no puede
tomar la cuenta de otro administrador, y para la propia existe el cambio con
contraseña actual. Tampoco puede suspenderse a sí mismo.

### Personalizar la marca

| Qué                     | Dónde                                            |
| ----------------------- | ------------------------------------------------ |
| Nombre                  | `NEXT_PUBLIC_APP_NAME`                           |
| Colores y tipografía    | [`src/app/globals.css`](src/app/globals.css)     |
| Logotipo en la interfaz | [`src/components/brand.tsx`](src/components/brand.tsx) |
| Favicon                 | [`src/app/icon.svg`](src/app/icon.svg)           |

No hay colores sueltos en los componentes: todos salen de los tokens definidos
en `globals.css`, en variantes clara y oscura.

### Crear un negocio

1. `/app/businesses` → **Nuevo negocio**.
2. Completá nombre e identificador (`burger-lab`). El resto es opcional.
3. Al guardar se abre la ficha, donde se agregan enlaces, tags y usuarios.

### Crear un tag y programar el NFC

1. En la ficha del negocio, pestaña **Tags** → **Nuevo tag** (por ejemplo `Mesa 1`).
2. El código se genera solo: 10 caracteres aleatorios de un alfabeto de 30
   símbolos sin letras ambiguas. No se puede elegir ni deriva de ningún
   contador, así que no se puede adivinar a partir de otro tag.
3. Abrí el tag para ver su **pantalla de producción**, con la URL, el QR y los pasos.
4. **Copiar URL** y grabarla en el NFC como registro URL, con cualquier
   aplicación de escritura NFC.
5. Probá abriendo la URL: debe cargar la landing y sumar un scan.

Compatible con NTAG213, NTAG215 y NTAG216. El chip solo guarda la URL: nunca el
menú, las redes ni datos del negocio. Por eso el contenido se puede cambiar
después sin volver a tocar el tag.

### Generar y descargar el QR

En la pantalla de producción del tag, **Descargar QR** entrega un PNG de
1024 px listo para imprimir. El cliente también puede descargar los QR de sus
propios tags desde **Mis tags**.

El QR codifica exactamente la misma URL que el NFC.

### Desactivar y reasignar tags

- **Desactivar** un tag hace que su landing muestre "Este tag está temporalmente
  inactivo." Sirve para una placa perdida o retirada, sin reprogramar nada.
- **Reasignar** mueve el tag físico a otro negocio conservando su URL. Exige una
  confirmación explícita. Los eventos ya registrados se quedan con el negocio
  anterior: son sus datos y moverlos falsearía las estadísticas de ambos.

### Enlaces de la landing

Cada enlace tiene tipo, texto, URL, orden y visibilidad. Se pueden crear,
editar, ocultar, reordenar y eliminar, desde el panel de administración o desde
el panel del cliente.

Solo se aceptan URLs `https:`, `http:`, `mailto:` y `tel:`. Cualquier otro
esquema —`javascript:`, `data:`, `vbscript:`, `file:`— se rechaza, igual que las
URLs con espacios o caracteres de control.

Si el negocio tiene un sitio web registrado y todavía no existe un enlace de
tipo WEBSITE, el botón **Sitio web** aparece igual en la landing.

### Chips y cuota de taps

Un **Tag** es la identidad lógica —el código y la URL—; un **Chip** es la pieza
de hardware que la lleva programada. Están separados a propósito: un chip puede
estar en stock sin tag asignado, y una placa dañada se reemplaza por otro chip
conservando el mismo tag, su URL y todo su historial.

Desde `/app/chips` el equipo registra cada chip con su UID y modelo, lo asocia
al tag que tiene programado, le fija un tope de taps y reinicia el contador.

> **El tope de taps es una cuota comercial, no una limitación del hardware.**
> Un NTAG213/215/216 admite lecturas ilimitadas; lo único acotado son las
> escrituras, y cada chip se escribe una sola vez al programarlo. Reiniciar la
> cuota **no le hace nada al chip**: mueve `tapsResetAt`, la fecha desde la
> cual se cuentan los taps. No se borra ningún evento, así que el historial de
> analytics queda intacto y la operación es auditable.

Un chip sin tope no genera avisos. Con tope:

| Consumo | Estado | Qué pasa |
| --- | --- | --- |
| menos del 80 % | Al día | Nada |
| 80 % o más | Cerca del tope | Aviso al cliente y en el dashboard ROOT |
| 100 % o más | Tope superado | Aviso más marcado en ambos lados |

**Nunca se corta el servicio automáticamente.** Las landings siguen
funcionando; cortar es una decisión manual desde la ficha del cliente. La razón
es que quien sufriría el corte es el cliente final del negocio —alguien que
escanea en una mesa— y no el titular de la cuenta.

### Taps y escaneos de QR

El QR impreso codifica la URL con `?s=qr`; el NFC lleva la URL limpia. Eso
permite separar en analytics un tap del chip de un escaneo del código impreso, y
que el QR **no consuma la cuota del chip**, porque no pasa por él.

Es una aproximación honesta, no una medición exacta: quien abra la URL limpia a
mano, o la reciba compartida, cuenta como tap.

### Consola ROOT

- `/app/clients` compara todos los negocios entre sí —scans, clics, tags,
  chips, taps, servicios, solicitudes y última actividad— ordenados por
  actividad de los últimos 30 días.
- `/app/clients/[id]` es la ficha completa de un cliente: métricas, chips con
  su cuota, tags, analytics, enlaces, usuarios con acceso, servicios, dominios y
  últimas solicitudes, todo en una página. Es de solo lectura salvo el
  interruptor de corte; para editar cada cosa enlaza a su pantalla, de modo que
  no haya dos formularios distintos para lo mismo.

### Analytics

Se registran dos eventos:

- **SCAN**: alguien abrió `/t/{code}`.
- **CLICK**: alguien pulsó uno de los botones de la landing.

El click pasa por `/t/{code}/go/{linkId}`, que resuelve el destino en la base de
datos comprobando que el enlace pertenece al negocio del tag y luego redirige.
El destino nunca viaja en la URL, así que este endpoint no puede usarse como
redirector abierto.

Si el registro del evento falla, la landing carga igual: el tracking nunca
bloquea la página.

Se muestran scans por día, clicks por destino, scans por tag y reparto de
dispositivos. Los cortes diarios se calculan en la zona horaria del negocio
(`TAPGO_TIMEZONE`), no en UTC.

### Panel del cliente

`/client` es deliberadamente más simple: scans de hoy y del mes, clicks, sus
tags con estado y URL, sus estadísticas, sus enlaces y sus solicitudes. No
muestra identificadores internos, ni configuración técnica, ni nada de otros
clientes.

El panel del cliente **nunca acepta un identificador de negocio por la URL**: el
negocio se deriva siempre de la sesión, así que no hay ningún parámetro que
manipular.

### Dominios

El dominio es un servicio administrado. La plataforma no compra dominios: deja
constancia del trámite con estados `NONE`, `REQUESTED`, `PURCHASE_PENDING`,
`REGISTERED`, `CONFIGURING`, `ACTIVE`, `EXPIRED` y `CANCELLED`, además de
registrador, vencimiento, renovación automática y notas.

**Nunca guardes credenciales del registrador en las notas.**

### Servicios y sitios web

`BusinessService` registra lo que TapGoCR presta: NFC, QR, landing, dominio,
sitio web, hosting, mantenimiento u otros, con estado, fechas y proveedor.

El desarrollo de sitios web es un **servicio profesional que TapGoCR ejecuta
manualmente**. La plataforma solo lo registra: guarda el `websiteUrl` del
negocio y el estado del servicio. El sitio puede estar hecho en cualquier
tecnología y alojado donde sea.

### Solicitudes de servicio

El cliente abre una solicitud desde `/client/requests`; entra siempre como
`NEW` con prioridad normal. El equipo la mueve por `IN_PROGRESS`,
`WAITING_CLIENT`, `COMPLETED` o `CANCELLED` desde `/app/requests`.

Flujo completo del servicio web:

1. El cliente solicita un sitio web.
2. El admin pasa la solicitud a `IN_PROGRESS` y luego a `COMPLETED`.
3. El admin registra el `websiteUrl` del negocio y un servicio `WEBSITE` en `ACTIVE`.
4. El botón **Sitio web** aparece automáticamente en la landing.

---

## Seguridad

- **Autorización en el servidor.** Toda página, server action y route handler
  pasa por [`src/lib/authz.ts`](src/lib/authz.ts). Ocultar botones no es una
  medida de seguridad, y no se usa como tal en ninguna parte.
- **Aislamiento multi-tenant.** El acceso de un usuario a un negocio se resuelve
  siempre contra la tabla `BusinessUser`. Un negocio inexistente y uno ajeno
  producen la misma respuesta 403, para no filtrar qué identificadores existen.
- **Protección contra IDOR.** Las rutas que reciben un identificador
  (`/app/businesses/[id]`, `/api/tags/[id]/qr`, todas las acciones) resuelven el
  propietario antes de leer o escribir. Hay pruebas automatizadas para esto.
- **`proxy.ts` es solo enrutado optimista.** Redirige a quien está en el panel
  equivocado, pero no es la capa de autorización; los layouts y las acciones
  vuelven a comprobar todo.
- **Códigos impredecibles.** 10 caracteres sobre un alfabeto de 30, generados
  con `crypto.randomBytes` y sin sesgo de módulo. Nada de identificadores
  secuenciales expuestos.
- **Validación de entrada.** Todos los formularios se validan con Zod en el
  servidor, con límites de longitud explícitos.
- **URLs restringidas por lista de permitidos**, no de bloqueados.
- **`AUTH_URL` es obligatoria en producción.** La aplicación corre con
  `trustHost`, necesario detrás de un reverse proxy. Sin una URL canónica fija,
  un `Host` falsificado podría desviar las URLs de autenticación. El script de
  despliegue se niega a continuar si falta o si no empieza por `https://`.
- **Los formularios públicos limitan por IP real**, no por su hash. El hash es
  `null` cuando no hay sal configurada, y usarlo como clave metía a todos los
  visitantes en el mismo cupo: tras tres envíos el formulario quedaba inservible
  para el sitio entero. Si el proxy no reenvía la IP, se aplica un cupo global
  amplio en lugar de bloquear a todos, y queda un aviso en el log.
- **Rate limiting** en el login, por correo. Ver la nota de despliegue si vas a
  correr más de una instancia. La landing pública **no** está limitada a
  propósito: un local lleno comparte una sola IP de salida, y bloquear a clientes
  reales es peor que un contador de scans inflado.
- **Content-Security-Policy** con `object-src 'none'`, `base-uri 'self'`,
  `form-action 'self'` y `frame-ancestors 'none'`. No usa nonces: Next.js
  inyecta el payload de hidratación en línea, así que `script-src` necesita
  `'unsafe-inline'`. Endurecerla con nonces es trabajo pendiente.
- **Contraseñas** con bcrypt y coste 12. El login gasta el mismo tiempo aunque
  la cuenta no exista, para no revelar qué correos están registrados.
- **Cabeceras** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
  y `Permissions-Policy` en todas las respuestas.
- **Sin redirecciones abiertas.** El `callbackUrl` del login se restringe a
  rutas internas, y el redirector de clicks resuelve el destino en la base de datos.

---

## Privacidad

Analytics con datos mínimos, sin perfiles personales:

| Se guarda                        | No se guarda                      |
| -------------------------------- | --------------------------------- |
| Tipo de evento y destino          | IP completa                       |
| Fecha y hora                      | Identificadores de usuario        |
| User agent (recortado)            | Cookies de seguimiento            |
| Tipo de dispositivo               | Historial entre negocios          |
| Referer (recortado)               | Datos personales del visitante    |
| Hash truncado y con sal de la IP  |                                   |
| País, si el proxy lo aporta       |                                   |

Sin `ANALYTICS_IP_SALT` no se guarda **ningún** dato derivado de la IP: es
preferible perder el dato a guardar un hash que se puede revertir por fuerza
bruta recorriendo el espacio de direcciones IPv4. Rotar la sal invalida la
correlación histórica, que es el comportamiento deseado.

La landing pública no requiere login, cuenta, correo ni registro, y se marca
como `noindex`: las URLs de tag se reparten por NFC y QR, no por buscadores.

---

## Despliegue

Producción corre en **hosting compartido cPanel** (Node.js Selector /
Phusion Passenger), con la base de datos MySQL en un servidor aparte (un LXC
del homelab), conectada por un túnel SSH inverso — no un VPS propio con
nginx/systemd.

### Arquitectura

- **App:** tres "Node.js Applications" en cPanel (una por dominio:
  `tapgocr.com`, `app.tapgocr.com`, `go.tapgocr.com`), todas sirviendo el
  mismo código. Solo `tapgocr.com` tiene el build real en su carpeta; las
  otras dos tienen un `app.js` de una línea que hace `require()` al
  `server.js` de la primera, para no duplicar el código tres veces.
- **Passenger** no ejecuta scripts de npm: [`server.js`](server.js) es un
  wrapper mínimo que levanta Next.js con su API programática y escucha en
  `process.env.PORT`, que es como Passenger espera un punto de entrada Node.
- **Base de datos:** MySQL/MariaDB fuera del hosting, alcanzada por un túnel
  SSH inverso (`autossh` con systemd) que un contenedor del homelab abre
  hacia la cuenta del hosting — así `DATABASE_URL` en el hosting apunta a
  `127.0.0.1:<puerto>` como si la base estuviera local, sin exponer MySQL a
  internet.

### Desplegar un cambio de código

1. Compilar localmente con las variables de producción (`NEXT_PUBLIC_*`
   apuntando al dominio real, no a `localhost`) — el hosting compartido no
   tiene memoria suficiente para compilar Next.js con confiabilidad, así que
   el build se hace afuera y se sube ya armado:
   ```bash
   npm run build   # usa --webpack: el hosting no soporta los bindings nativos de Turbopack (glibc vieja)
   ```
2. Empaquetar y subir el código fuente (sin `node_modules`/`.next`) más el
   `.next`/`public` ya compilados, por `scp`, a la carpeta de la app
   (`~/tapgocr` en el hosting).
3. Sobre el hosting, dentro del virtualenv que crea el Node.js Selector:
   ```bash
   source ~/nodevenv/tapgocr/<version>/bin/activate
   cd ~/tapgocr
   npm ci
   npx prisma migrate deploy
   ```
4. Restart de las tres apps desde **cPanel → Setup Node.js App**.

`scripts/deploy.sh` todavía asume un servidor con systemd (`systemctl restart
tapgocr`) del setup anterior — no sirve tal cual para el hosting cPanel
actual. El paso 4 (reiniciar) se hace a mano desde la interfaz de Node.js
Selector hasta que se actualice el script.

### Notas de operación

- **Zona horaria.** `TAPGO_TIMEZONE` define qué significa "hoy" en analytics,
  independiente del huso horario del servidor.
- **Varias instancias.** El rate limiting del login vive en memoria del
  proceso. Como hay tres procesos Node corriendo (uno por dominio), el límite
  es por proceso, no global — aceptable para el volumen actual, pero si hace
  falta un límite estricto compartido, reemplazar
  [`src/lib/rate-limit.ts`](src/lib/rate-limit.ts) por un almacén externo
  (Redis).
- **Copias de seguridad.** [`scripts/backup.sh`](scripts/backup.sh)
  (`mysqldump` de la base + `tar` de `UPLOADS_DIR`, con retención de 14
  días) corre por cron en el mismo servidor que aloja la base — no en el
  hosting de la app. Falta todavía una copia fuera del homelab.

---

## Estructura del proyecto

```
prisma/
  schema.prisma          Modelo de datos
  seed.ts                Datos de demostración
src/
  app/
    page.tsx             Sitio comercial (la única página indexable)
    t/[code]/            Landing pública y redirector de clicks
    app/                 Panel administrativo
    client/              Panel del cliente
    login/               Autenticación
    api/                 Auth.js y descarga de QR
  components/            Interfaz compartida
  lib/
    config.ts            Marca y dominio (única fuente de las URLs)
    authz.ts             Autorización del servidor
    analytics.ts         Consultas de estadísticas
    chips.ts             Cuota de taps de los chips
    client-code.ts       Código de cliente e identificador de login
    clients-overview.ts  Datos consolidados de la consola ROOT
    url.ts               Validación de URLs
    codes.ts             Generación de códigos de tag
    request-info.ts      Datos de analytics minimizados
    timezone.ts          Cortes de día por zona horaria
  server/                Server actions, agrupadas por dominio
  proxy.ts               Enrutado optimista por rol
server.js                Punto de entrada para Phusion Passenger (cPanel)
scripts/
  deploy.sh              Pasos de despliegue que corren en el servidor
  backup.sh              Backup de base de datos + archivos subidos
  set-root.ts            Alta y recuperación de la cuenta ROOT
tests/                   Pruebas unitarias, de aislamiento y de registro
```

---

## Decisiones de diseño

Cosas que se apartan de una lectura literal de la especificación, y por qué:

- **`Hosting` y `Maintenance` no son tablas propias.** `ServiceType` ya incluye
  `HOSTING` y `MAINTENANCE`; sus campos específicos (`provider`, `lastUpdate`,
  `nextReview`) están en `BusinessService`. Dos tablas casi vacías no aportaban
  nada.
- **`Business.ownerId` no decide permisos.** Existe como puntero al propietario
  principal, pero el acceso se resuelve siempre contra `BusinessUser`, que es la
  tabla que admite varios usuarios por negocio.
- **`/client/requests` no está en la lista de rutas de la especificación**, pero
  el criterio de aceptación del servicio web exige que el cliente pueda pedirlo.
- **Sin librería de gráficas.** Las barras se dibujan con CSS y SVG. Una
  librería de charting añadía cientos de kilobytes al bundle para dibujar barras.
- **Sin librería de iconos.** Glifos genéricos dibujados a mano, que además
  evitan reproducir logotipos de marcas registradas.
- **`forbidden()` con `experimental.authInterrupts`.** Es la vía soportada por
  Next.js para devolver un 403 real, que es el criterio de aceptación del panel
  del cliente.
- **El sitio comercial vive dentro de la aplicación.** No estaba en la
  especificación, que solo describe paneles y landings; se agregó a pedido. Al
  ser una página estática sin acceso a datos, no toca la superficie de seguridad
  del resto del proyecto.
- **Sin precios en la página pública.** Los paquetes llevan a una cotización.
  Publicar cifras sería inventarlas, y los pagos no forman parte del MVP.

---

## Fuera de alcance

Esto **no** es un constructor de sitios web. No hay editor drag-and-drop, ni CMS,
ni generador de páginas. El desarrollo web es un servicio profesional que
TapGoCR ejecuta manualmente; la plataforma solo lo administra.

La arquitectura queda preparada para agregar más adelante pagos, suscripciones,
facturación, dominios propios por cliente, marca blanca, varias sucursales, más
roles, API pública, webhooks, campañas, SMS, correo, fidelización, reservas,
integración con POS e inventario, sin rehacer lo existente. Nada de eso está
implementado.
