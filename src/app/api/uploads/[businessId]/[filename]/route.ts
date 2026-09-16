import { readFile } from "node:fs/promises";

import { NextResponse } from "next/server";

import { contentTypeFor, uploadFilePath } from "@/lib/uploads";

/**
 * Sirve un archivo que un negocio subió (menú en PDF, una imagen).
 *
 * Público y sin sesión, a propósito: es lo que se muestra en la landing que
 * abre cualquiera que toque la placa, igual que el logo o la portada del
 * negocio ya son URLs públicas.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/uploads/[businessId]/[filename]">,
) {
  const { businessId, filename } = await context.params;

  const filePath = uploadFilePath(businessId, filename);
  if (!filePath) return new NextResponse(null, { status: 404 });

  let data: Buffer;
  try {
    data = await readFile(filePath);
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": contentTypeFor(filename),
      // El nombre en disco es un UUID que nunca se reutiliza: cachear para
      // siempre es seguro, un archivo reemplazado simplemente vive en otra URL.
      "Cache-Control": "public, max-age=31536000, immutable",
      // El contenido ya se valida por firma binaria al subirlo, pero esto
      // evita que un navegador ignore el Content-Type declarado y renderice
      // el archivo como otra cosa (p. ej. HTML) según su propio sniffing.
      "X-Content-Type-Options": "nosniff",
    },
  });
}
