import QRCode from "qrcode";

import { tagQrUrl } from "@/lib/config";

/**
 * Generación de QR a partir de la URL pública del tag.
 *
 * El QR codifica la misma URL del tag con el parámetro que lo identifica como
 * QR, de modo que su uso no consuma la cuota de taps del chip. El dominio sale
 * de NEXT_PUBLIC_TAPGO_DOMAIN; nunca se codifica información del negocio dentro
 * del propio código.
 */
const OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 2,
  color: { dark: "#0f172a", light: "#ffffff" },
};

/** SVG en línea, para mostrar el QR en pantalla sin una petición extra. */
export function qrSvgForCode(code: string): Promise<string> {
  return QRCode.toString(tagQrUrl(code), { ...OPTIONS, type: "svg", width: 240 });
}

/** PNG para descargar e imprimir. 1024 px basta para una placa o un sticker. */
export function qrPngForCode(code: string, width = 1024): Promise<Buffer> {
  return QRCode.toBuffer(tagQrUrl(code), { ...OPTIONS, type: "png", width });
}
