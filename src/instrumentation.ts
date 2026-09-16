/**
 * Hook de arranque de Next.js: corre una sola vez, antes de aceptar tráfico.
 * Sirve para fallar rápido si falta una variable de entorno crítica, en vez de
 * que el primer request que la necesite sea quien lo descubra.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}
