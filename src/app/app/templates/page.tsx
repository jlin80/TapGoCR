import type { Metadata } from "next";
import Link from "next/link";

import { Badge, Card, PageHeader } from "@/components/ui";
import { LandingTheme } from "@/generated/prisma/enums";
import { tagUrl } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { THEME_LABELS, THEME_SWATCHES, THEME_TAGLINES } from "@/lib/theme";

export const metadata: Metadata = { title: "Templates" };

/**
 * Catálogo de temas (`LandingTheme`), no un constructor visual.
 *
 * Un Template Builder real —crear temas nuevos sin tocar código, definir
 * campos editables por template— es un proyecto aparte, con su propio motor
 * de renderizado dinámico; no existe hoy y no se inventa acá. Esto es lo que
 * SÍ se puede dar con lo que ya existe: ver los 5 presets, sus tokens reales
 * y qué negocios usa cada uno, con un link a la landing real de un cliente en
 * ese tema para revisarlo tal cual lo ve el público.
 */
export default async function TemplatesPage() {
  const counts = await prisma.business.groupBy({
    by: ["landingTheme"],
    _count: { _all: true },
  });

  const countByTheme = new Map(counts.map((row) => [row.landingTheme, row._count._all]));

  const sampleByTheme = await prisma.business.findMany({
    where: { active: true, tags: { some: { active: true } } },
    select: {
      landingTheme: true,
      name: true,
      tags: { where: { active: true }, take: 1, select: { code: true } },
    },
    distinct: ["landingTheme"],
  });

  const sampleMap = new Map(
    sampleByTheme
      .filter((row) => row.tags[0])
      .map((row) => [row.landingTheme, { name: row.name, code: row.tags[0].code }]),
  );

  return (
    <>
      <PageHeader
        title="Templates"
        description="Los 5 presets visuales que puede elegir un negocio desde 'Mi página pública'. Cambiar un tono acá (src/lib/theme.ts) actualiza a todos los negocios que lo usan."
      />

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(LandingTheme).map((theme) => {
          const swatch = THEME_SWATCHES[theme];
          const sample = sampleMap.get(theme);
          const count = countByTheme.get(theme) ?? 0;

          return (
            <li key={theme}>
              <Card className="flex flex-col gap-0 overflow-hidden p-0">
                <div
                  className="flex h-24 items-end p-4"
                  style={{ backgroundColor: swatch.surface, color: swatch.text }}
                >
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: swatch.accent, color: "#04201d" }}
                  >
                    Aa
                  </span>
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-semibold">{THEME_LABELS[theme].split(" — ")[0]}</h2>
                  <p className="mt-1 text-sm text-muted">{THEME_TAGLINES[theme]}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <Badge tone={count > 0 ? "info" : "neutral"}>
                      {count} {count === 1 ? "negocio" : "negocios"}
                    </Badge>
                    {sample ? (
                      <Link
                        href={tagUrl(sample.code)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        Ver ejemplo real →
                      </Link>
                    ) : (
                      <span className="text-sm text-muted">Sin ejemplo activo</span>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </>
  );
}
