import type { NextConfig } from "next";

/**
 * blusbox.nl is the canonical host; www.blusbox.nl redirects to it.
 *
 * Both names must resolve — plenty of people type "www" out of habit, and
 * link scanners do too — but only one may serve content, or the same page
 * exists at two URLs and search engines split the ranking between them.
 * The redirect is permanent so the canonical is unambiguous.
 *
 * Hosting platforms can do this at the edge as well. Keeping it here means
 * the behaviour is identical wherever the app runs.
 */
const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.blusbox.nl" }],
        destination: "https://blusbox.nl/:path*",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Baseline. A full CSP lands with the payment provider in §14
          // step 6, since Mollie's domains need allow-listing.
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Generated media is immutable: the filename changes when the
        // asset does, so it can be cached for a year.
        source: "/media/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
