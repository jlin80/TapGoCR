/**
 * Resumen diario de actividad para Discord (#actividad).
 *
 *   npm run discord:activity
 *
 * Pensado para correr una vez al día desde un timer del sistema, igual que
 * `scripts/notify-domains.ts`. Nunca manda un mensaje por tap/scan individual
 * — agrega las últimas 24 horas y manda un solo resumen.
 *
 * Usa su propio PrismaClient (no el de `src/lib/prisma.ts`), mismo criterio
 * que el resto de los scripts standalone de este proyecto.
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { ScanEventType } from "../src/generated/prisma/enums.ts";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { notifyActivitySummary } from "../src/lib/discord/events.ts";
import { parseConnectionString } from "../src/lib/database-url.ts";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(parseConnectionString(process.env.DATABASE_URL!)),
});

async function main() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const events = await prisma.scanEvent.findMany({
    where: { timestamp: { gte: since } },
    select: { eventType: true, businessId: true, business: { select: { name: true } } },
  });

  const totalTaps = events.filter((e) => e.eventType === ScanEventType.SCAN).length;
  const totalScans = events.length - totalTaps;

  const byBusiness = new Map<string, { name: string; count: number }>();
  for (const event of events) {
    const entry = byBusiness.get(event.businessId) ?? { name: event.business.name, count: 0 };
    entry.count += 1;
    byBusiness.set(event.businessId, entry);
  }

  const top = [...byBusiness.values()].sort((a, b) => b.count - a.count)[0] ?? null;

  console.log(
    `Actividad de las últimas 24h: ${totalTaps} taps, ${totalScans} scans, ${byBusiness.size} negocios activos.`,
  );

  await notifyActivitySummary({
    eventId: `activity-summary:${new Date().toISOString().slice(0, 10)}`,
    periodLabel: "Últimas 24 horas",
    totalTaps,
    totalScans,
    activeBusinesses: byBusiness.size,
    topBusiness: top ? { name: top.name, interactions: top.count } : null,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
