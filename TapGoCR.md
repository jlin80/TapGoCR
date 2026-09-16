# PROMPT MAESTRO — TAPGOCR

## Plataforma SaaS NFC + QR + Analytics para negocios

Quiero que construyas un MVP funcional de una plataforma SaaS para nuestra empresa **TapGoCR**.

TapGoCR venderá soluciones físicas y digitales para negocios mediante:

* NFC
* QR
* landing pages dinámicas
* analytics
* gestión de negocios
* gestión de tags NFC/QR
* dashboard administrativo
* dashboard limitado para clientes
* gestión de dominios como servicio
* servicios de desarrollo web para clientes

---

# 1. IDENTIDAD DEL PROYECTO

Nombre de la empresa:

**TapGoCR**

La marca debe aparecer en:

* dashboard;
* login;
* landing pública cuando corresponda;
* emails del sistema;
* documentación;
* metadata;
* títulos de página;
* favicon/logo cuando exista;
* mensajes administrativos.

No utilizar nombres genéricos como:

```text
TUDOMINIO
NuestraEmpresa
MiEmpresa
```

cuando se esté haciendo referencia a la marca.

Utilizar:

```text
TapGoCR
```

---

# 2. DOMINIO DE TAPGOCR

IMPORTANTE:

Todavía NO asumir que el dominio definitivo será `tapgocr.com`.

El dominio de la plataforma debe ser configurable mediante variables de entorno.

Por ejemplo:

```env
NEXT_PUBLIC_TAPGO_DOMAIN=tapgocr.com
```

Pero el código debe funcionar también con:

```env
NEXT_PUBLIC_TAPGO_DOMAIN=otro-dominio.com
```

La URL pública de los tags debe generarse dinámicamente:

```text
https://{NEXT_PUBLIC_TAPGO_DOMAIN}/t/{code}
```

Ejemplo futuro:

```text
https://tapgocr.com/t/A8F3K29X
```

No hardcodear `tapgocr.com` en múltiples archivos.

Centralizar esta configuración.

---

# 3. CONCEPTO DEL PRODUCTO

TapGoCR venderá placas, stickers o soportes físicos que contienen:

* NFC
* QR

El NFC y el QR apuntan a una URL dinámica de TapGoCR.

Ejemplo:

```text
https://tapgocr.com/t/A8F3K29X
```

Cuando una persona:

1. acerca su teléfono al NFC; o
2. escanea el QR;

se abre la landing digital correspondiente al negocio.

Ejemplo:

```text
BURGER LAB

Hamburguesas artesanales

[ VER MENÚ ]

[ WHATSAPP ]

[ INSTAGRAM ]

[ TIKTOK ]

[ FACEBOOK ]

[ GOOGLE REVIEWS ]

[ CÓMO LLEGAR ]

[ SITIO WEB ]
```

La información mostrada debe provenir de nuestra base de datos.

El NFC NO debe almacenar el menú completo, redes sociales ni información del negocio.

El NFC debe almacenar únicamente la URL dinámica.

Esto permite cambiar el contenido posteriormente sin reprogramar físicamente el NFC.

---

# 4. ALCANCE DEL PRODUCTO

NO quiero construir un Wix, WordPress, Shopify ni un website builder.

La plataforma NO debe permitir que los clientes construyan páginas web completas mediante drag-and-drop.

La creación de páginas web será un **servicio profesional que TapGoCR ofrece manualmente**.

El SaaS solamente debe permitir registrar y administrar ese servicio.

El núcleo del producto es:

```text
NFC / QR físico
        ↓
URL dinámica de TapGoCR
        ↓
Landing del negocio
        ↓
Menú / WhatsApp / Instagram / TikTok /
Facebook / Google Reviews / Google Maps /
Website / otros enlaces
        ↓
Analytics
```

---

# 5. ROLES

Implementar dos roles principales.

## ADMIN

Equipo de TapGoCR.

Puede:

* crear negocios;
* editar negocios;
* eliminar/desactivar negocios;
* crear tags;
* asignar tags;
* activar/desactivar tags;
* ver todos los analytics;
* administrar servicios;
* administrar dominios;
* administrar solicitudes;
* crear usuarios clientes;
* asignar usuarios a negocios;
* ver información de todos los negocios.

---

## CLIENT

Cliente de TapGoCR.

Puede:

* iniciar sesión;
* ver solamente su negocio;
* ver sus tags;
* ver estado de sus tags;
* ver scans;
* ver clicks;
* ver estadísticas;
* ver información básica de su negocio;
* administrar los enlaces permitidos de su negocio.

NO puede:

* ver otros negocios;
* ver datos de otros clientes;
* crear negocios;
* administrar dominios globalmente;
* administrar otros clientes;
* modificar configuraciones internas;
* acceder al panel administrativo.

Implementar autorización server-side.

No confiar solamente en ocultar elementos del frontend.

---

# 6. ARQUITECTURA

La arquitectura debe separar claramente:

```text
                         TAPGOCR
                           │
              ┌────────────┴────────────┐
              │                         │
        ADMIN PANEL               CLIENT PANEL
              │                         │
       Todos los negocios         Solo su negocio
              │                         │
              └────────────┬────────────┘
                           │
                      PostgreSQL
                           │
                ┌──────────┴──────────┐
                │                     │
             NFC / QR              Analytics
                │
                ▼
          Landing pública
                │
        ┌───────┼────────┬────────┐
        ▼       ▼        ▼        ▼
      Menú   Redes   WhatsApp   Google
```

---

# 7. STACK

Usar preferiblemente:

* Next.js
* TypeScript
* React
* Tailwind CSS
* PostgreSQL
* Prisma ORM

Autenticación:

* Auth.js / NextAuth
* o alternativa madura compatible con Next.js.

Prioridades:

1. seguridad;
2. simplicidad;
3. mantenibilidad;
4. tipado fuerte;
5. arquitectura multi-tenant;
6. facilidad de despliegue.

No agregar dependencias innecesarias.

---

# 8. MULTI-TENANCY

Cada negocio debe estar aislado.

Ejemplo:

```text
TapGoCR ADMIN
 ├── Burger Lab
 ├── Barber Shop
 ├── Hotel X
 └── Café Y

CLIENT BURGER LAB
 └── Solo Burger Lab
```

Un cliente jamás debe poder acceder a:

```text
/businesses/otro-negocio
/tags/otro-tag
/analytics/otro-negocio
```

ni aunque manipule manualmente las URLs.

Todas las consultas deben verificar ownership/authorization en backend.

---

# 9. MODELO DE DATOS

## User

```text
id
email
passwordHash / auth provider
name
role
createdAt
updatedAt
```

Roles:

```text
ADMIN
CLIENT
```

---

## Business

```text
id
ownerId
name
slug
description
logoUrl
phone
whatsapp
address
latitude
longitude
websiteUrl
active
createdAt
updatedAt
```

---

# 10. BUSINESS USER

Preparar relación para múltiples usuarios:

```text
BusinessUser

id
businessId
userId
role
createdAt
```

Roles:

```text
OWNER
MANAGER
VIEWER
```

Para el MVP puede utilizarse OWNER/CLIENT, pero la arquitectura debe permitir varios usuarios posteriormente.

---

# 11. BUSINESS LINKS

Crear:

```text
BusinessLink

id
businessId
type
label
url
icon
position
active
createdAt
updatedAt
```

Tipos:

```text
MENU
WHATSAPP
INSTAGRAM
TIKTOK
FACEBOOK
GOOGLE_REVIEWS
GOOGLE_MAPS
WEBSITE
CUSTOM
```

Debe ser posible:

* crear;
* editar;
* eliminar;
* activar/desactivar;
* cambiar orden.

---

# 12. TAG NFC / QR

Crear:

```text
Tag

id
businessId
code
name
locationLabel
active
createdAt
updatedAt
```

Ejemplo:

```text
code:
A8F3K29X

name:
Mesa 1
```

El `code` debe:

* ser único;
* ser aleatorio;
* ser suficientemente largo;
* ser difícil de adivinar.

NO utilizar IDs incrementales expuestos públicamente.

---

# 13. URL DEL TAG

Cada tag debe generar:

```text
https://{NEXT_PUBLIC_TAPGO_DOMAIN}/t/{code}
```

Ejemplo:

```text
https://tapgocr.com/t/A8F3K29X
```

Esta URL será utilizada tanto por:

* NFC;
* QR.

---

# 14. LANDING PÚBLICA

Crear:

```text
/t/[code]
```

Esta ruta es pública.

No requiere:

* login;
* cuenta;
* email;
* registro.

Debe:

1. recibir el `code`;
2. buscar el Tag;
3. verificar que está activo;
4. identificar el Business;
5. registrar el scan;
6. cargar la landing;
7. mostrar los links activos.

Diseñar la landing como una experiencia mobile-first.

La marca de TapGoCR puede aparecer discretamente en el footer, por ejemplo:

```text
Powered by TapGoCR
```

si esto está habilitado.

---

# 15. SCAN EVENT

Crear:

```text
ScanEvent

id
tagId
businessId
eventType
target
timestamp
userAgent
referer
ipHash
country
deviceType
```

Eventos:

```text
SCAN
CLICK
```

Cuando se abre:

```text
/t/A8F3K29X
```

registrar:

```text
SCAN
```

Cuando el usuario presiona:

```text
MENU
WHATSAPP
INSTAGRAM
TIKTOK
FACEBOOK
GOOGLE_REVIEWS
GOOGLE_MAPS
WEBSITE
```

registrar:

```text
CLICK
```

El tracking nunca debe impedir que la página cargue si falla.

---

# 16. PRIVACIDAD

Minimizar datos.

No crear perfiles personales.

No almacenar información personal innecesaria.

Para analytics puede utilizarse:

* user agent;
* device type;
* referer;
* timestamp;
* IP hasheada/truncada;
* país si puede determinarse razonablemente.

No almacenar IP completa innecesariamente.

---

# 17. DASHBOARD ADMINISTRATIVO DE TAPGOCR

Crear:

```text
/app
/app/dashboard
/app/businesses
/app/businesses/[id]
/app/businesses/[id]/tags
/app/businesses/[id]/analytics
/app/businesses/[id]/services
/app/businesses/[id]/domains
/app/requests
/app/users
```

Sidebar:

```text
TapGoCR

Dashboard

Negocios
Tags
Analytics
Servicios
Dominios
Solicitudes
Usuarios
Configuración
```

---

# 18. ADMIN DASHBOARD

Mostrar:

```text
Total negocios
Total tags
Tags activos
Tags inactivos
Total scans
Total clicks
Solicitudes pendientes
Servicios activos
```

También mostrar actividad reciente.

Ejemplo:

```text
Burger Lab — 183 scans hoy
Café Central — 94 scans hoy
Barber Shop — 72 scans hoy
```

---

# 19. ADMIN BUSINESS MANAGEMENT

El administrador debe poder:

* crear Business;
* editar Business;
* activar/desactivar Business;
* crear usuario cliente;
* asignar usuario al Business;
* administrar links;
* crear tags;
* asignar tags;
* ver analytics;
* registrar servicios;
* registrar dominio;
* crear Service Requests.

---

# 20. PANEL DEL CLIENTE

Crear:

```text
/client
/client/dashboard
/client/tags
/client/analytics
/client/business
/client/settings
```

El cliente debe tener una interfaz mucho más sencilla.

Ejemplo:

```text
BURGER LAB

Scans hoy:
183

Scans este mes:
4,821

Clicks:
3,412
```

Y:

```text
Mis tags

Mesa 1       ACTIVO
Mesa 2       ACTIVO
Mesa 3       ACTIVO
Barra        ACTIVO
Entrada      ACTIVO
```

---

# 21. CLIENT ANALYTICS

El cliente puede visualizar solamente estadísticas de su Business.

Mostrar:

### Scans

```text
Hoy
7 días
30 días
```

### Clicks

```text
Menú
WhatsApp
Instagram
TikTok
Facebook
Google Reviews
Google Maps
Website
```

### Scans por tag

```text
Mesa 1
Mesa 2
Mesa 3
Barra
Entrada
```

### Dispositivo

```text
iPhone
Android
Desktop
Unknown
```

Mostrar gráficas simples.

No crear analytics excesivamente complejos para el MVP.

---

# 22. CLIENT LINK MANAGEMENT

Permitir que el cliente modifique sus enlaces.

Ejemplo:

```text
Menú
https://burgerlab.com/menu.pdf

Instagram
https://instagram.com/burgerlab

WhatsApp
https://wa.me/506XXXXXXXX

Google Reviews
https://g.page/...
```

Debe poder:

* cambiar URL;
* cambiar nombre;
* activar/desactivar;
* cambiar orden.

Validar URLs.

Rechazar esquemas peligrosos como:

```text
javascript:
data:
```

cuando no sean necesarios.

---

# 23. TAG MANAGEMENT

Admin:

Puede crear/modificar/desactivar tags.

Cliente:

Puede ver sus tags y estadísticas.

El cliente NO debería poder reasignar un tag a otro negocio.

Vista:

```text
Tag

Mesa 1

Code:
A8F3K29X

Status:
ACTIVE

URL:
https://tapgocr.com/t/A8F3K29X

Scans:
1,284

[ COPIAR URL ]
[ GENERAR QR ]
```

---

# 24. QR

Cada tag debe tener:

```text
Generate QR
```

Debe generar QR usando:

```text
https://{NEXT_PUBLIC_TAPGO_DOMAIN}/t/{code}
```

Permitir:

* descargar;
* visualizar;
* copiar URL.

---

# 25. DOMINIOS

El dominio es un servicio administrativo de TapGoCR.

No implementar compra automática de dominios en el MVP.

Crear:

```text
Domain

id
businessId
domain
status
registrar
expiresAt
autoRenew
notes
createdAt
updatedAt
```

Estados:

```text
NONE
REQUESTED
PURCHASE_PENDING
REGISTERED
CONFIGURING
ACTIVE
EXPIRED
CANCELLED
```

TapGoCR puede ayudar al cliente a:

1. elegir dominio;
2. realizar el trámite;
3. configurar DNS;
4. conectar dominio;
5. configurar website.

NO almacenar:

* contraseñas;
* credenciales del registrador;
* información sensible innecesaria.

---

# 26. SERVICIOS DE TAPGOCR

Crear:

```text
BusinessService

id
businessId
type
status
notes
startDate
renewalDate
createdAt
updatedAt
```

Tipos:

```text
NFC
QR
LANDING
DOMAIN
WEBSITE
HOSTING
MAINTENANCE
CUSTOM
```

Estados:

```text
LEAD
QUOTED
PENDING
ACTIVE
PAUSED
CANCELLED
```

---

# 27. DESARROLLO DE PÁGINAS WEB

IMPORTANTE:

NO construir:

* website builder;
* editor drag-and-drop;
* CMS completo;
* constructor de páginas.

TapGoCR ofrecerá el desarrollo de páginas web como **servicio profesional adicional**.

La plataforma solamente debe registrar:

```text
Website Service

Business:
Burger Lab

Status:
ACTIVE

Website URL:
https://burgerlab.com

Domain:
burgerlab.com
```

También debe existir:

```text
ServiceRequest
```

para solicitar desarrollo web.

---

# 28. SERVICE REQUEST

Crear:

```text
ServiceRequest

id
businessId
type
title
description
status
priority
createdAt
updatedAt
```

Tipos:

```text
DOMAIN
WEBSITE
HOSTING
NFC
QR
MAINTENANCE
OTHER
```

Estados:

```text
NEW
IN_PROGRESS
WAITING_CLIENT
COMPLETED
CANCELLED
```

Ejemplo:

```text
Business:
Burger Lab

Type:
WEBSITE

Title:
Crear página web

Description:
Cliente necesita página web
con menú, WhatsApp, Instagram,
ubicación y formulario de contacto.

Status:
IN_PROGRESS
```

---

# 29. WEBSITE INTEGRATION

El Business debe poder tener:

```text
websiteUrl
```

Ejemplo:

```text
https://burgerlab.com
```

Si existe:

```text
[ SITIO WEB ]
```

debe aparecer automáticamente en la landing NFC.

La web puede estar desarrollada fuera de TapGoCR.

Ejemplos:

* Next.js;
* WordPress;
* Webflow;
* otro hosting;
* VPS propio.

La plataforma solamente debe almacenar y mostrar la URL.

---

# 30. HOSTING

El hosting también es un servicio separado.

Registrar:

```text
Hosting

provider
status
renewalDate
notes
```

No implementar infraestructura de hosting dentro del MVP.

La plataforma solamente administra la información del servicio.

---

# 31. MANTENIMIENTO

Registrar:

```text
Maintenance

status
lastUpdate
nextReview
notes
```

Esto permitirá posteriormente vender mantenimiento recurrente.

---

# 32. HARDWARE

No desarrollar hardware personalizado.

Los tags NFC serán comprados externamente.

La plataforma debe funcionar independientemente del modelo exacto de NFC.

Debe ser compatible conceptualmente con:

* NTAG213;
* NTAG215;
* NTAG216.

El sistema solamente necesita generar la URL:

```text
https://{NEXT_PUBLIC_TAPGO_DOMAIN}/t/{code}
```

El operador posteriormente programa esa URL físicamente en el NFC.

---

# 33. PRODUCCIÓN DE TAGS

Cada Tag debe tener una pantalla de producción:

```text
TAPGOCR

BUSINESS:
Burger Lab

TAG:
Mesa 1

NFC URL:
https://tapgocr.com/t/A8F3K29X

QR:
[ QR ]

[ COPIAR URL ]
[ DESCARGAR QR ]
```

Esto permitirá:

1. crear tag;
2. copiar URL;
3. programar NFC;
4. imprimir QR;
5. instalar placa;
6. probar tag.

---

# 34. VALIDACIÓN DE NFC

Crear una forma sencilla de probar el tag.

Después de programar:

```text
Abrir:
https://tapgocr.com/t/A8F3K29X
```

Comprobar:

```text
Tag activo
Business correcto
Landing correcta
Scan registrado
```

---

# 35. DESACTIVACIÓN

Si un tag se pierde o es retirado:

```text
ACTIVE → INACTIVE
```

Cuando alguien intente abrir:

```text
/t/A8F3K29X
```

mostrar:

```text
Este tag está temporalmente inactivo.
```

Esto permite a TapGoCR administrar tags físicamente sin tener que reprogramarlos inmediatamente.

---

# 36. REUTILIZACIÓN DE TAG

Un tag físico no debe quedar permanentemente ligado al contenido.

La relación es:

```text
NFC
 ↓
Tag Code
 ↓
Business
 ↓
Contenido actual
```

La URL física permanece.

El backend determina qué Business corresponde actualmente al Tag.

Para el MVP, no permitir reasignación sin confirmación administrativa.

---

# 37. SEGURIDAD

Implementar:

* autenticación;
* autorización server-side;
* RBAC;
* aislamiento multi-tenant;
* validación de inputs;
* sanitización;
* protección XSS;
* rate limiting;
* códigos impredecibles;
* protección contra IDOR;
* validación de URLs;
* manejo correcto de errores.

Especial atención a:

```text
/businesses/[id]
/tags/[id]
/analytics/[businessId]
```

Un CLIENT no debe poder cambiar el ID y acceder a otro Business.

---

# 38. UI ADMIN DE TAPGOCR

Diseño:

* profesional;
* SaaS;
* limpio;
* responsive;
* desktop-first;
* mobile-friendly.

Branding:

```text
TapGoCR
```

No utilizar branding genérico.

Preparar estructura para posteriormente agregar:

* logo;
* favicon;
* colores de marca;
* tipografía.

No inventar un logo complejo si no se proporciona uno.

---

# 39. UI CLIENTE

Debe ser más simple que la administrativa.

El cliente no necesita saber:

* IDs internos;
* estructura de base de datos;
* configuración técnica;
* información de otros clientes.

Debe ver:

```text
Mi negocio
Mis tags
Mis estadísticas
Mis enlaces
Mi información
```

---

# 40. LANDING PÚBLICA

Debe ser:

* mobile-first;
* rápida;
* responsive;
* accesible;
* visualmente profesional;
* fácil de usar con una mano.

No requerir login.

No mostrar elementos administrativos.

Branding discreto de TapGoCR.

---

# 41. DEMO DATA

Crear seed:

```text
ADMIN

admin@tapgocr.com
```

y:

```text
CLIENT

burgerlab@tapgocr.com
```

Business:

```text
Burger Lab
```

Tags:

```text
Mesa 1
Mesa 2
Mesa 3
Barra
Entrada
```

Links:

```text
Menu
WhatsApp
Instagram
TikTok
Facebook
Google Reviews
Google Maps
Website
```

Crear eventos ficticios.

Crear:

```text
Domain
burgerlab.example
```

Crear servicios:

```text
NFC
QR
LANDING
DOMAIN
WEBSITE
```

Crear una:

```text
ServiceRequest
WEBSITE
```

IMPORTANTE:

Las credenciales de demo deben quedar documentadas claramente en README y nunca utilizar contraseñas reales.

---

# 42. ESTRUCTURA DE URLS

Public:

```text
/t/[code]
```

Admin:

```text
/app
/app/dashboard
/app/businesses
/app/businesses/[id]
/app/businesses/[id]/tags
/app/businesses/[id]/analytics
/app/businesses/[id]/services
/app/businesses/[id]/domains
/app/requests
/app/users
```

Client:

```text
/client
/client/dashboard
/client/tags
/client/analytics
/client/business
/client/settings
```

---

# 43. ANALYTICS

Implementar como mínimo:

### Scans por día

```text
L
M
X
J
V
S
D
```

### Clicks por destino

```text
Menu
WhatsApp
Instagram
TikTok
Google
Website
```

### Scans por tag

```text
Mesa 1
Mesa 2
Mesa 3
Barra
Entrada
```

### Dispositivo

```text
iPhone
Android
Desktop
Unknown
```

---

# 44. FUTURO — NO IMPLEMENTAR TODAVÍA

La arquitectura debe permitir posteriormente:

* pagos;
* Stripe;
* suscripciones;
* facturación;
* custom domains;
* white label;
* múltiples sucursales;
* más roles;
* API pública;
* webhooks;
* campañas;
* SMS;
* email;
* loyalty;
* reservas;
* POS integration;
* inventario;
* website builder.

Pero NO implementarlos ahora.

---

# 45. MODELO COMERCIAL DE TAPGOCR

La plataforma debe soportar conceptualmente:

### Producto 1

```text
NFC + QR
```

### Producto 2

```text
NFC + QR
+
Analytics
```

### Producto 3

```text
NFC + QR
+
Analytics
+
Dominio
```

### Producto 4

```text
NFC + QR
+
Analytics
+
Dominio
+
Website desarrollado por TapGoCR
```

### Producto 5

```text
NFC + QR
+
Analytics
+
Dominio
+
Website
+
Hosting
+
Maintenance
```

Los pagos NO forman parte del MVP.

---

# 46. CRITERIO DE ACEPTACIÓN PRINCIPAL

Debe funcionar este flujo:

```text
TAPGOCR ADMIN
 ↓
Crear Business
 ↓
Burger Lab
 ↓
Crear Tag
 ↓
Mesa 1
 ↓
Code:
A8F3K29X
 ↓
Generar URL
 ↓
https://tapgocr.com/t/A8F3K29X
 ↓
Generar QR
 ↓
Programar NFC
 ↓
Cliente toca NFC
 ↓
Landing pública
 ↓
Usuario presiona MENU
 ↓
Menu externo
 ↓
Analytics registra:
SCAN + CLICK MENU
```

---

# 47. CRITERIO DE ACEPTACIÓN DEL CLIENT PANEL

Debe funcionar:

```text
CLIENT
 ↓
Login
 ↓
Burger Lab
 ↓
Dashboard
 ↓
Ver:
4,821 scans
3,412 clicks
24 tags
```

El cliente NO debe poder ver otro negocio.

Intentar acceder manualmente a:

```text
/app/businesses/otro-id
```

debe devolver:

```text
403
```

o redirigir apropiadamente.

---

# 48. CRITERIO DE ACEPTACIÓN DEL SERVICIO WEB

Debe funcionar:

```text
Burger Lab
 ↓
Solicita website
 ↓
ServiceRequest
 ↓
ADMIN recibe solicitud
 ↓
ADMIN cambia:
NEW
→ IN_PROGRESS
→ COMPLETED
 ↓
ADMIN registra:

websiteUrl:
https://burgerlab.com

service:
WEBSITE

status:
ACTIVE
```

La landing NFC debe entonces mostrar:

```text
[ SITIO WEB ]
```

---

# 49. DOMINIO Y WEBSITE

El dominio y website NO deben estar acoplados obligatoriamente.

Puede existir:

```text
Business
 ├── NFC
 ├── QR
 ├── Landing
 ├── Domain
 └── Website
```

pero también:

```text
Business
 ├── NFC
 ├── QR
 └── Landing
```

sin dominio propio.

Y:

```text
Business
 ├── NFC
 ├── QR
 ├── Domain
 └── Website
```

aunque el website haya sido desarrollado externamente.

---

# 50. DOCUMENTACIÓN

Crear:

```text
README.md
.env.example
```

README debe documentar:

* requisitos;
* instalación;
* PostgreSQL;
* variables de entorno;
* Prisma;
* migraciones;
* seed;
* desarrollo local;
* build;
* deployment;
* autenticación;
* roles;
* creación de Business;
* creación de Tag;
* generación QR;
* programación NFC;
* analytics;
* client dashboard;
* domain management;
* website service;
* service requests.

---

# 51. VARIABLES DE ENTORNO

Crear `.env.example`.

Como mínimo:

```env
DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_TAPGO_DOMAIN=
NEXT_PUBLIC_APP_NAME=TapGoCR
```

No hardcodear:

```text
tapgocr.com
```

en la aplicación.

El dominio debe provenir de:

```text
NEXT_PUBLIC_TAPGO_DOMAIN
```

---

# 52. DEPLOYMENT

Preparar para VPS.

Documentar:

```text
Git
Node.js
PostgreSQL
Environment Variables
Prisma migrations
Build
Process Manager
Reverse Proxy
HTTPS
DNS
```

No asumir proveedor específico.

---

# 53. FASES DE IMPLEMENTACIÓN

## FASE 1

Setup:

* Next.js
* TypeScript
* Tailwind
* PostgreSQL
* Prisma
* Auth

## FASE 2

Database:

* User
* Business
* BusinessUser
* BusinessLink
* Tag
* ScanEvent
* Domain
* BusinessService
* ServiceRequest

## FASE 3

RBAC:

* ADMIN
* CLIENT

## FASE 4

TapGoCR Admin Dashboard.

## FASE 5

Client Dashboard.

## FASE 6

Public NFC Landing.

## FASE 7

Tracking.

## FASE 8

Analytics.

## FASE 9

QR.

## FASE 10

Services / Domains / Website Requests.

## FASE 11

Security hardening.

## FASE 12

Testing.

## FASE 13

Deployment documentation.

---

# 54. REGLAS DE DESARROLLO

Antes de escribir código:

1. Inspecciona el repositorio.
2. Determina el stack actual.
3. Identifica código reutilizable.
4. Identifica qué ya existe.
5. Propón arquitectura.
6. Implementa por fases.
7. Prueba cada fase.
8. Corrige errores.
9. Ejecuta lint.
10. Ejecuta typecheck.
11. Ejecuta tests.
12. Ejecuta build.

No sobrescribas código existente sin necesidad.

No inventes funcionalidades fuera del alcance.

No afirmes que algo funciona si no fue probado.

---

# 55. RESULTADO FINAL ESPERADO

Quiero terminar con una plataforma llamada:

# TapGoCR

donde:

```text
                    TAPGOCR
                       │
           ┌───────────┴───────────┐
           │                       │
     ADMIN PANEL              CLIENT PANEL
           │                       │
    Todos los negocios        Su negocio
           │                       │
           └───────────┬───────────┘
                       │
                    NFC / QR
                       │
                       ▼
                    LANDING
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
        MENU        WHATSAPP      REDES
          │
          └──────────────┐
                         ▼
                     ANALYTICS
```

Y adicionalmente:

```text
BUSINESS
   │
   ├── NFC
   ├── QR
   ├── Landing
   ├── Analytics
   │
   ├── Domain
   │
   └── Services
          ├── Website
          ├── Hosting
          └── Maintenance
```

TapGoCR vende el hardware NFC/QR y ofrece servicios digitales adicionales.

La creación de páginas web es realizada por TapGoCR como servicio profesional independiente.

**NO construir un website builder dentro de este proyecto.**

---

# 56. INSTRUCCIÓN FINAL PARA CLAUDE CODE

Construye primero el núcleo:

```text
Business
→ Tag
→ NFC/QR URL
→ Public Landing
→ Scan
→ Click
→ Analytics
```

Después:

```text
Admin
→ administra todos los negocios
```

Después:

```text
Client
→ administra/monitorea únicamente su negocio
```

Finalmente:

```text
Services
→ Domain
→ Website
→ Hosting
→ Maintenance
```

Mantén el sistema modular para que TapGoCR pueda agregar posteriormente facturación, suscripciones, pagos, múltiples sucursales y nuevos servicios sin tener que reconstruir la arquitectura.

Antes de implementar, inspecciona el repositorio actual y adapta la implementación a lo que ya existe. No asumas que el repositorio está vacío.
