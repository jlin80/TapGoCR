import { NextResponse, type NextRequest } from "next/server";

import { EventSource, MenuMode, ScanEventType } from "@/generated/prisma/enums";
import { landingButtons } from "@/lib/landing";
import { hasPublishedMenu } from "@/lib/menu";
import { prisma } from "@/lib/prisma";
import { recordEvent } from "@/lib/tracking";
import { checkUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

/**
 * Registra el CLICK y redirige al destino.
 *
 * El destino nunca llega en la URL: se recibe el identificador del botón y se
 * resuelve contra la base de datos comprobando que pertenece al negocio del
 * tag. Así este endpoint no puede convertirse en un redirector abierto.
 *
 * La lista de botones válidos se calcula con `landingButtons`, la misma función
 * que usa la página. Un identificador que la landing no mostraría —un enlace
 * oculto, o el botón derivado de un dato que el negocio no tiene— no resuelve a
 * ningún destino y termina en la landing.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext<"/t/[code]/go/[linkId]">,
) {
  const { code, linkId } = await context.params;
  const source =
    request.nextUrl.searchParams.get("s") === "qr"
      ? EventSource.QR
      : EventSource.TAP;
  const landing = new URL(`/t/${encodeURIComponent(code)}`, request.url);

  const tag = await prisma.tag.findUnique({
    where: { code },
    select: {
      id: true,
      active: true,
      business: {
        select: {
          id: true,
          active: true,
          menuMode: true,
          phone: true,
          whatsapp: true,
          latitude: true,
          longitude: true,
          websiteUrl: true,
          links: {
            where: { active: true },
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
            select: { id: true, type: true, label: true, url: true },
          },
        },
      },
    },
  });

  if (!tag || !tag.active || !tag.business.active) {
    return NextResponse.redirect(landing, 302);
  }

  // El mismo criterio que la página: con el menú nativo publicado, el enlace
  // de tipo MENU no se muestra, así que tampoco puede resolverse desde acá.
  const nativeMenuActive =
    tag.business.menuMode === MenuMode.NATIVE &&
    (await hasPublishedMenu(tag.business.id));

  const destination = landingButtons(tag.business, { nativeMenuActive }).find(
    (button) => button.id === linkId,
  );

  if (!destination || !destination.url) {
    return NextResponse.redirect(landing, 302);
  }

  // Defensa en profundidad: las URLs se validan al guardarse, pero un registro
  // insertado directamente en la base de datos no pasaría por esa validación.
  const checked = checkUrl(destination.url);
  if (!checked.ok) {
    console.error(
      `[tapgocr] el botón ${linkId} del negocio ${tag.business.id} tiene una URL no permitida`,
    );
    return NextResponse.redirect(landing, 302);
  }

  await recordEvent({
    businessId: tag.business.id,
    tagId: tag.id,
    eventType: ScanEventType.CLICK,
    target: destination.target,
    source,
    headers: request.headers,
  });

  return NextResponse.redirect(checked.url, 302);
}
