/**
 * Compatibilidad al ajustar `PLAN_TAG_LIMITS` (ver `src/lib/plans.ts`).
 *
 *   npm run plans:grandfather            aplica
 *   npm run plans:grandfather -- --dry   solo muestra qué haría
 *
 * El modelo público pasó de Local/Business/Chain (3/10/sin tope) a
 * Starter/Business/Pro (1/3/8). Un negocio que ya tenía más placas activas
 * que el nuevo tope de su plan no debe aparecer de golpe como "excedido"
 * por un cambio de precios, no por algo que él hizo: este script les fija
 * `includedTagsOverride` a su cantidad de placas activas actual (nunca
 * menos), así su cuota sigue viéndose "OK" exactamente como antes del
 * cambio. No toca negocios que ya están dentro del nuevo tope, ni pisa un
 * override que ROOT ya haya puesto a mano.
 *
 * Pensado para correr una sola vez por entorno (dev y producción) al
 * desplegar este cambio. Es idempotente: si se corre de nuevo, no encuentra
 * nada para ajustar.
 */
import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../src/generated/prisma/client.ts";
import { parseConnectionString } from "../src/lib/database-url.ts";
import { PLAN_TAG_LIMITS } from "../src/lib/plans.ts";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(parseConnectionString(process.env.DATABASE_URL!)),
});

const dryRun = process.argv.includes("--dry") || process.argv.includes("--dry-run");

async function main() {
  console.log(`\nCompatibilidad de cuotas de placas — ${new Date().toISOString()}`);
  if (dryRun) console.log("  MODO PRUEBA: no se guarda nada.\n");

  const businesses = await prisma.business.findMany({
    where: { includedTagsOverride: null },
    select: {
      id: true,
      name: true,
      plan: true,
      tags: { where: { active: true }, select: { id: true } },
    },
  });

  let ajustados = 0;

  for (const business of businesses) {
    const activeTags = business.tags.length;
    const newLimit = PLAN_TAG_LIMITS[business.plan];

    if (activeTags <= newLimit) continue;

    console.log(
      `  · ${business.name} (${business.plan}): ${activeTags} placas activas > tope nuevo ${newLimit}. ` +
        `Fijando includedTagsOverride=${activeTags}.`,
    );

    if (!dryRun) {
      await prisma.business.update({
        where: { id: business.id },
        data: { includedTagsOverride: activeTags },
      });
    }
    ajustados += 1;
  }

  console.log(`\n  ${businesses.length} negocios revisados · ${ajustados} ajustados\n`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
