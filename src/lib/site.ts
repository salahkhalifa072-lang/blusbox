/**
 * Canonical origin. Set NEXT_PUBLIC_SITE_URL per environment; the fallback
 * is only for local development.
 *
 * The canonical host is the apex, blusbox.nl. www.blusbox.nl must resolve
 * too but is redirected here (see next.config.ts), so nothing on the site
 * should ever build a www URL.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

/** Production origin, for docs and deploy checks. */
export const productieUrl = "https://blusbox.nl";
