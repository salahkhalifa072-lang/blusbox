/**
 * Canonical origin. Set NEXT_PUBLIC_SITE_URL per environment; the fallback
 * is only for local development.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";
