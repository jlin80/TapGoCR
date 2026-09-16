import { createHash } from "node:crypto";

import { DeviceType } from "@/generated/prisma/enums";

/**
 * Datos derivados de la petición para analytics.
 *
 * Política de privacidad del proyecto: no se guarda la IP completa ni nada que
 * permita construir un perfil personal. Solo un hash truncado y con sal, que
 * sirve para deduplicar aproximadamente pero no para reidentificar.
 */
export type RequestInfo = {
  userAgent: string | null;
  referer: string | null;
  ipHash: string | null;
  country: string | null;
  deviceType: DeviceType;
};

const MAX_STORED_LENGTH = 512;

export function detectDeviceType(userAgent: string | null | undefined): DeviceType {
  if (!userAgent) return DeviceType.UNKNOWN;
  const ua = userAgent.toLowerCase();

  // Android debe evaluarse antes que Linux: todo Android también dice "linux".
  if (ua.includes("android")) return DeviceType.ANDROID;
  if (/(iphone|ipad|ipod)/.test(ua)) return DeviceType.IPHONE;
  // iPadOS 13+ se anuncia como Macintosh; se distingue por el soporte táctil,
  // que no viaja en el user agent. Queda clasificado como escritorio.
  if (/(windows|macintosh|mac os x|cros|x11|linux)/.test(ua)) return DeviceType.DESKTOP;

  return DeviceType.UNKNOWN;
}

/**
 * Hash con sal y truncado de la IP. Sin ANALYTICS_IP_SALT devuelve null: es
 * preferible perder el dato a guardar un hash reversible por fuerza bruta
 * (el espacio de direcciones IPv4 se recorre entero en minutos).
 */
export function hashIp(ip: string | null | undefined): string | null {
  const salt = process.env.ANALYTICS_IP_SALT;
  if (!ip || !salt) return null;

  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export function extractClientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip");
}

export function buildRequestInfo(headers: Headers): RequestInfo {
  const userAgent = truncate(headers.get("user-agent"));

  return {
    userAgent,
    referer: truncate(headers.get("referer")),
    ipHash: hashIp(extractClientIp(headers)),
    // Lo inyecta el reverse proxy o el CDN cuando está disponible; nunca se
    // deduce de la IP dentro de la aplicación.
    country: headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry"),
    deviceType: detectDeviceType(userAgent),
  };
}

function truncate(value: string | null): string | null {
  if (!value) return null;
  return value.length > MAX_STORED_LENGTH ? value.slice(0, MAX_STORED_LENGTH) : value;
}
