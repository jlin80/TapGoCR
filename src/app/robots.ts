import type { MetadataRoute } from "next";

import { tapgoOrigin } from "@/lib/config";

/**
 * Los paneles (`/app`, `/client`), el login y la API nunca deben aparecer en
 * un buscador: no tienen valor de búsqueda y exponer su estructura no aporta
 * nada. Las landings de tag (`/t/{code}`) ya se marcan `noindex` una por una
 * porque se reparten por NFC/QR, no por buscador.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/client", "/login", "/api"],
    },
    sitemap: `${tapgoOrigin}/sitemap.xml`,
  };
}
