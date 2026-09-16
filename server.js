/**
 * Punto de entrada para Phusion Passenger (cPanel Node.js Selector).
 *
 * Passenger no ejecuta scripts de npm: requiere directamente un archivo que
 * levante un servidor HTTP escuchando en `process.env.PORT`. Next.js no trae
 * eso "de fábrica" (su CLI es lo que hace `next start`), así que se arma acá
 * con la API programática de Next.
 *
 * `app.tapgocr.com/app.js` y `go.tapgocr.com/app.js` no tienen una copia de
 * este archivo: hacen `require()` directo a este mismo archivo, para que los
 * tres dominios sirvan exactamente el mismo build sin duplicar nada.
 */
const { createServer } = require("node:http");
const next = require("next");

const port = Number(process.env.PORT) || 3000;
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`TapGoCR listo en el puerto ${port}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo levantar TapGoCR:", error);
    process.exit(1);
  });
