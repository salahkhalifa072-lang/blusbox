import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Marketing and service routes. /winkelwagen and /design stay out. */
const routes: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/blusbox", priority: 0.9 },
  { path: "/meterkastbrand", priority: 0.8 },
  { path: "/hoe-het-werkt", priority: 0.8 },
  { path: "/zakelijk", priority: 0.8 },
  { path: "/installateurs", priority: 0.7 },
  { path: "/installatie", priority: 0.6 },
  { path: "/veelgestelde-vragen", priority: 0.6 },
  { path: "/downloads", priority: 0.5 },
  { path: "/over-ons", priority: 0.4 },
  { path: "/contact", priority: 0.4 },
  { path: "/verzending", priority: 0.3 },
  { path: "/retourneren", priority: 0.3 },
  { path: "/herroepingsrecht", priority: 0.3 },
  { path: "/garantie", priority: 0.3 },
  { path: "/algemene-voorwaarden", priority: 0.2 },
  { path: "/privacyverklaring", priority: 0.2 },
  { path: "/cookiebeleid", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority,
  }));
}
