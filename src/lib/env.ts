/**
 * Validación de variables de entorno al arrancar el proceso, no en el primer
 * request que las necesite.
 *
 * Sin esto, una `AUTH_SECRET` faltante recién se nota cuando alguien intenta
 * iniciar sesión — en producción, eso puede ser minutos u horas después del
 * despliegue. `ANALYTICS_IP_SALT` no es obligatoria (el sistema sigue
 * funcionando sin ella, solo deja de deduplicar por IP), pero su ausencia
 * conviene que quede en el log de arranque, no solo en un comentario del
 * código que nadie relee.
 */
function requireEnv(name: string): void {
  if (!process.env[name]?.trim()) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copiá .env.example a .env y completala.`,
    );
  }
}

export function validateEnv(): void {
  requireEnv("DATABASE_URL");
  requireEnv("AUTH_SECRET");
  requireEnv("NEXT_PUBLIC_TAPGO_DOMAIN");

  if (process.env.NODE_ENV === "production" && !process.env.AUTH_URL?.trim()) {
    throw new Error(
      "Falta AUTH_URL en producción. Debe ser la URL canónica, por ejemplo https://tudominio.com",
    );
  }

  if (!process.env.ANALYTICS_IP_SALT?.trim()) {
    console.warn(
      "[env] Sin ANALYTICS_IP_SALT: analytics no guardará ningún dato derivado de la IP de origen.",
    );
  }
}
