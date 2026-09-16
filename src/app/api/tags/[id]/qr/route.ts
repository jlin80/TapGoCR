import { NextResponse } from "next/server";

import { requireTagAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { qrPngForCode } from "@/lib/qr";

/**
 * Descarga del QR de un tag en PNG.
 *
 * Pasa por `requireTagAccess`, así que un CLIENT solo puede descargar los QR de
 * sus propios tags aunque conozca el identificador de otro.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/tags/[id]/qr">,
) {
  const { id } = await context.params;
  await requireTagAccess(id);

  const tag = await prisma.tag.findUniqueOrThrow({
    where: { id },
    select: { code: true, name: true },
  });

  const png = await qrPngForCode(tag.code);
  const filename = `tapgocr-${slugify(tag.name)}-${tag.code}.png`;

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
