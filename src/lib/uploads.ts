import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { tapgoOrigin } from "@/lib/config";

/**
 * Archivos que un negocio sube directamente (menú en PDF, una imagen) en
 * lugar de pegar la URL de algo que ya está alojado en otro lado.
 *
 * Se guardan en disco, no en la base de datos: son binarios de hasta varios
 * megabytes, y PostgreSQL no es el lugar para eso. El enlace (`BusinessLink`)
 * solo guarda la URL pública que los sirve.
 */

const DEFAULT_MAX_MB = 10;

export const MAX_UPLOAD_BYTES =
  (Number(process.env.UPLOADS_MAX_MB) || DEFAULT_MAX_MB) * 1024 * 1024;

/**
 * Extensión en disco según el tipo MIME real del archivo, nunca según el
 * nombre que traía al subirlo: así un ".pdf" que en realidad es otra cosa no
 * termina sirviéndose con una extensión que no le corresponde.
 */
const EXTENSION_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Firma binaria ("magic bytes") de cada formato admitido, verificada contra
 * el contenido real del archivo y no solo contra el `Content-Type` que
 * reporta el navegador — ese header lo elige el cliente al construir el
 * `File`, así que por sí solo no impide subir, por ejemplo, un HTML con
 * script etiquetado como `image/png`.
 */
const SIGNATURE_BY_MIME: Record<string, (bytes: Uint8Array) => boolean> = {
  "application/pdf": (bytes) => startsWith(bytes, [0x25, 0x50, 0x44, 0x46]), // %PDF
  "image/jpeg": (bytes) => startsWith(bytes, [0xff, 0xd8, 0xff]),
  "image/png": (bytes) =>
    startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/webp": (bytes) =>
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50, // "RIFF....WEBP"
};

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

/** Para el atributo `accept` del selector de archivos. */
export const UPLOAD_ACCEPT = ".pdf,image/png,image/jpeg,image/webp";

/**
 * Carpeta donde se guardan los archivos subidos.
 *
 * Sin `UPLOADS_DIR`, cae en `./uploads` — cómodo en desarrollo, nunca en
 * producción: un despliegue reemplaza todo el árbol del proyecto con un
 * `rsync --delete`, así que cualquier ruta dentro del repo desaparecería en el
 * siguiente despliegue.
 */
export function uploadsDir(): string {
  return process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), "uploads");
}

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; reason: string };

/** Guarda un archivo subido y devuelve la URL pública desde la que se sirve. */
export async function saveUpload(businessId: string, file: File): Promise<UploadResult> {
  if (file.size === 0) {
    return { ok: false, reason: "El archivo está vacío." };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      reason: `El archivo pesa más de ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`,
    };
  }

  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    return { ok: false, reason: "Formato no admitido. Subí un PDF, JPG, PNG o WEBP." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const matchesSignature = SIGNATURE_BY_MIME[file.type];
  if (!matchesSignature?.(buffer)) {
    return {
      ok: false,
      reason: "El archivo no es un PDF, JPG, PNG o WEBP válido.",
    };
  }

  const filename = `${randomUUID()}.${extension}`;
  const dir = path.join(uploadsDir(), businessId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  return { ok: true, url: `${tapgoOrigin}/api/uploads/${businessId}/${filename}` };
}

/**
 * Ruta en disco de un archivo servido, o `null` si el negocio o el nombre no
 * tienen la forma esperada.
 *
 * `businessId` y `filename` llegan siempre desde una URL, propia o ajena: se
 * validan contra un patrón cerrado en lugar de solo sanear "..", que es lo
 * único que impide de verdad escapar del directorio de subidas.
 */
export function uploadFilePath(businessId: string, filename: string): string | null {
  if (!/^[a-z0-9]+$/i.test(businessId)) return null;
  if (!/^[a-f0-9-]+\.(pdf|jpg|png|webp)$/i.test(filename)) return null;

  return path.join(uploadsDir(), businessId, filename);
}

export function contentTypeFor(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  const byExtension: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  return byExtension[extension] ?? "application/octet-stream";
}

/**
 * Borra el archivo que respalda la URL de un enlace, si es uno de los que
 * subió el propio negocio. Un enlace externo (WhatsApp, Instagram, un PDF en
 * otro sitio) no tiene nada que borrar acá.
 */
export async function deleteUploadIfOwned(url: string): Promise<void> {
  const prefix = `${tapgoOrigin}/api/uploads/`;
  if (!url.startsWith(prefix)) return;

  const [businessId, filename] = url.slice(prefix.length).split("/");
  if (!businessId || !filename) return;

  const filePath = uploadFilePath(businessId, filename);
  if (!filePath) return;

  try {
    await unlink(filePath);
  } catch {
    // Ya no existe o nunca existió; quien borra el enlace no necesita saberlo.
  }
}
