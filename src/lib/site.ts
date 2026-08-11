/**
 * Canonical origin — drives canonical tags, OpenGraph URLs, the sitemap,
 * robots.txt and the auth callbacks.
 *
 * Order matters, and the fallback chain exists because of a real failure:
 * the first production deploy went out without NEXT_PUBLIC_SITE_URL, so
 * every canonical tag and every sitemap entry pointed at
 * http://localhost:3000. Google will not index pages whose canonical
 * points somewhere it cannot fetch, so the site was effectively invisible
 * while looking perfectly fine to a human visitor.
 *
 * A missing environment variable must therefore degrade to something
 * true, not to localhost:
 *
 *   1. NEXT_PUBLIC_SITE_URL   — explicit, always wins
 *   2. VERCEL_PROJECT_PRODUCTION_URL — the project's production domain,
 *      set automatically by Vercel, correct on production deploys
 *   3. VERCEL_URL             — this specific deployment, right for
 *      previews where a per-deploy origin is what you want
 *   4. localhost              — only when nothing else is available
 */
function bepaalSiteUrl(): string {
  const expliciet = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (expliciet) return expliciet.replace(/\/$/, "");

  const productie = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productie) return `https://${productie.replace(/\/$/, "")}`;

  const deploy = process.env.VERCEL_URL?.trim();
  if (deploy) return `https://${deploy.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export const siteUrl = bepaalSiteUrl();

/** True when the origin is still the local fallback — used by the healthcheck. */
export const isLokaleUrl = siteUrl.includes("localhost");

/** Production origin, for documentation and deploy checks. */
export const productieUrl = "https://blusbox.nl";
