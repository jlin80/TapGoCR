/**
 * Monitor de uptime real.
 *
 *   npm run healthcheck
 *
 * Pensado para correr cada 1-2 minutos desde un temporizador del sistema,
 * igual que `notify-domains.ts` y `check-inbound-email.ts`. Pega contra la
 * landing pública (`tapgoOrigin`, ver `src/lib/config.ts`) y avisa a
 * #uptime SOLO cuando cambia el estado (caído → arriba o arriba → caído),
 * nunca en cada corrida: si no, un cron cada 2 minutos saturaría el canal.
 *
 * El estado entre corridas se guarda en un archivo, no en la base de datos:
 * es un dato operativo de este script, no algo que el negocio necesite
 * consultar. Vive en `HEALTHCHECK_STATE_DIR` (o `UPLOADS_DIR`, o `./tmp` en
 * desarrollo) a propósito — un despliegue reemplaza el código pero no esa
 * carpeta, así que el estado sobrevive de un despliegue al siguiente en vez
 * de "recuperarse" en el primer chequeo después de cada deploy.
 *
 * Sin DISCORD_WEBHOOK_UPTIME no falla: revisa igual, solo no avisa. Un
 * healthcheck sin Discord configurado sigue sirviendo para correrlo a mano y
 * ver el estado por consola.
 */
import "dotenv/config";

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { tapgoOrigin } from "../src/lib/config.ts";
import { notifyServiceDown, notifyServiceRecovered } from "../src/lib/discord/events.ts";

type HealthState = {
  status: "up" | "down";
  since: string; // ISO
};

const STATE_DIR = process.env.HEALTHCHECK_STATE_DIR ?? process.env.UPLOADS_DIR ?? "./tmp";
const STATE_FILE = join(STATE_DIR, "healthcheck-state.json");

// El código de tag más viejo no sirve como healthcheck estable (puede
// desactivarse); la home pública siempre existe y siempre debe responder.
const CHECK_URL = tapgoOrigin;
const TIMEOUT_MS = 10_000;

function readState(): HealthState | null {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}

function writeState(state: HealthState): void {
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/** Downtime legible: "3 min", "1 h 12 min". */
function downtimeLabel(since: Date, until: Date): string {
  const minutes = Math.round((until.getTime() - since.getTime()) / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
}

async function checkOnce(): Promise<{ up: boolean; detail: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(CHECK_URL, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "TapGoCR-Healthcheck/1.0" },
    });
    // 2xx y 3xx cuentan como arriba: un 301/302 en la home sigue siendo un
    // servidor que responde. Solo 5xx (o sin respuesta) es una caída real.
    const up = response.status < 500;
    return { up, detail: `HTTP ${response.status}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { up: false, detail: message };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const now = new Date();
  const result = await checkOnce();
  const previous = readState();

  console.log(
    `[${now.toISOString()}] ${CHECK_URL} → ${result.up ? "UP" : "DOWN"} (${result.detail})`,
  );

  if (!result.up) {
    if (previous?.status !== "down") {
      // Transición arriba → caído: primera vez que se detecta, se avisa.
      writeState({ status: "down", since: now.toISOString() });
      await notifyServiceDown({
        eventId: `healthcheck-down:${now.toISOString()}`,
        service: `${CHECK_URL} (${result.detail})`,
        at: now,
      });
      console.log("  → aviso SERVICE DOWN enviado");
    }
    // Ya estaba caído: no se repite el aviso en cada corrida.
    return;
  }

  if (previous?.status === "down") {
    // Transición caído → arriba: se recuperó, se avisa con el downtime real.
    const since = new Date(previous.since);
    await notifyServiceRecovered({
      eventId: `healthcheck-down:${previous.since}`,
      service: CHECK_URL,
      downtimeLabel: downtimeLabel(since, now),
    });
    console.log("  → aviso SERVICE RECOVERED enviado");
  }

  writeState({ status: "up", since: previous?.status === "up" ? previous.since : now.toISOString() });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
