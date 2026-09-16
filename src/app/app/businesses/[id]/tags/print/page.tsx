import type { Metadata } from "next";

import { EmptyState } from "@/components/ui";
import { requireBusinessAccess } from "@/lib/authz";
import { appName, tagUrl } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { qrSvgForCode } from "@/lib/qr";

export const metadata: Metadata = { title: "Imprimir QR" };

/**
 * Hoja de impresión de todos los QR de un grupo (o de los tags sueltos sin
 * grupo, con `?group=none`), para que producción no tenga que abrir una
 * pantalla por punto. Reutiliza el mismo generador de QR que la ficha
 * individual de un tag — nunca uno propio.
 */
export default async function PrintTagsPage({
  params,
  searchParams,
}: PageProps<"/app/businesses/[id]/tags/print">) {
  const { id } = await params;
  const { group: groupId } = await searchParams;
  await requireBusinessAccess(id);

  const business = await prisma.business.findUniqueOrThrow({
    where: { id },
    select: { name: true },
  });

  const tags = await prisma.tag.findMany({
    where: {
      businessId: id,
      pointGroupId: groupId === "none" ? null : (groupId ? String(groupId) : undefined),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, code: true, locationLabel: true, pointGroup: { select: { name: true } } },
  });

  if (tags.length === 0) {
    return (
      <EmptyState
        title="No hay puntos para imprimir"
        description="Este grupo no tiene tags, o ya no existe."
      />
    );
  }

  const cards = await Promise.all(
    tags.map(async (tag) => ({ tag, qrSvg: await qrSvgForCode(tag.code) })),
  );

  const groupLabel = tags[0]?.pointGroup?.name ?? "Puntos sin grupo";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold">
            {business.name} — {groupLabel}
          </h1>
          <p className="text-sm text-muted">
            {tags.length} QR listos para imprimir. Usá Ctrl/Cmd+P.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 print:grid-cols-2">
        {cards.map(({ tag, qrSvg }) => (
          <div
            key={tag.id}
            className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center break-inside-avoid"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{appName}</p>
            <p className="font-medium">{tag.name}</p>
            {tag.locationLabel ? <p className="text-xs text-muted">{tag.locationLabel}</p> : null}
            <div
              className="w-full max-w-[200px] [&>svg]:h-auto [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="break-all font-mono text-[10px] text-muted">{tagUrl(tag.code)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
