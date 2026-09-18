import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Evita que dos corridas del mismo cron se pisen.
 *
 * Esto es lo que de verdad tumbó la cuenta el 2026-09-16: un cron cada 2-5
 * minutos cuya corrida anterior tardó de más (por lo que fuera — el propio
 * servidor bajo carga pesada ese día) siguió disparando una nueva encima de
 * la que no había terminado, sin límite, hasta agotar el cupo de procesos de
 * CloudLinux LVE de la cuenta. `tsx`/`esbuild` nunca estuvieron rotos: el
 * problema era la falta de este guard.
 *
 * El candado vive en el mismo directorio que el estado del healthcheck
 * (`HEALTHCHECK_STATE_DIR`/`UPLOADS_DIR`/`./tmp`), no en base de datos: es un
 * dato operativo de un script standalone, igual que `healthcheck-state.json`.
 */
function lockPath(name: string): string {
  const dir = process.env.HEALTHCHECK_STATE_DIR ?? process.env.UPLOADS_DIR ?? "./tmp";
  return join(dir, `${name}.lock`);
}

/**
 * Intenta tomar el candado de `name`. Devuelve `false` si ya hay una corrida
 * en curso más reciente que `maxAgeMs` — en ese caso el script debe salir sin
 * hacer nada, no esperar ni reintentar. `maxAgeMs` conviene fijarlo bastante
 * por debajo del intervalo del cron: así, si una corrida de verdad se cuelga,
 * la siguiente ventana del cron la da por muerta y sigue (el candado se
 * "autocura"), en vez de bloquear el script para siempre.
 */
export function acquireCronLock(name: string, maxAgeMs: number): boolean {
  const file = lockPath(name);
  mkdirSync(dirname(file), { recursive: true });

  if (existsSync(file)) {
    const startedAt = Number(readFileSync(file, "utf8").trim());
    if (Number.isFinite(startedAt) && Date.now() - startedAt < maxAgeMs) {
      return false;
    }
  }

  writeFileSync(file, String(Date.now()));
  return true;
}

/** Libera el candado. Se llama siempre en un `finally`, corrida exitosa o no. */
export function releaseCronLock(name: string): void {
  try {
    unlinkSync(lockPath(name));
  } catch {
    // Sin candado que borrar (ya se autocuró, o nunca se llegó a tomar): no es un error.
  }
}
