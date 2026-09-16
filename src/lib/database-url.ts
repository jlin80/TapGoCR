/**
 * El driver `mariadb` solo reconoce cadenas de conexión con esquema
 * `mariadb://`, no `mysql://`, y tampoco acepta una cadena de conexión junto
 * con opciones de pool en el mismo objeto de configuración. Por eso
 * `DATABASE_URL` (formato estándar `mysql://usuario:clave@host:puerto/db`) se
 * parsea a mano en vez de pasarla tal cual al adaptador.
 */
export function parseConnectionString(connectionString: string) {
  const url = new URL(connectionString);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
  };
}
