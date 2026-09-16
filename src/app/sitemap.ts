import type { MetadataRoute } from "next";

import { tapgoOrigin } from "@/lib/config";
import { INDUSTRIES } from "@/lib/industries";
import { PACKAGES } from "@/lib/packages";

/**
 * Solo las páginas pensadas para buscadores: la landing, precios, registro,
 * el desglose de cada paquete y cada página de industria. Los paneles y las
 * landings de tag (`/t/{code}`) quedan fuera a propósito — ver `robots.ts`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: tapgoOrigin, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${tapgoOrigin}/precios`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${tapgoOrigin}/registro`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${tapgoOrigin}/nosotros`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${tapgoOrigin}/privacidad`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${tapgoOrigin}/terminos`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const packageRoutes: MetadataRoute.Sitemap = PACKAGES.map((item) => ({
    url: `${tapgoOrigin}/paquetes/${item.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const industryRoutes: MetadataRoute.Sitemap = INDUSTRIES.map((industry) => ({
    url: `${tapgoOrigin}/${industry.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...packageRoutes, ...industryRoutes];
}
