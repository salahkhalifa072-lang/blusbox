import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The first production deploy shipped canonical tags and a sitemap full of
 * http://localhost:3000, because NEXT_PUBLIC_SITE_URL was not set in the
 * hosting environment. Google will not index pages whose canonical points
 * somewhere it cannot fetch, so the site was invisible in search while
 * looking completely healthy to a visitor.
 *
 * These tests pin the fallback chain that prevents a repeat.
 */

const oorspronkelijk = { ...process.env };

async function laadSiteUrl() {
  // The module reads env at import time, so it has to be re-imported.
  vi.resetModules();
  return (await import("./site")).siteUrl;
}

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  delete process.env.VERCEL_URL;
});

afterEach(() => {
  process.env = { ...oorspronkelijk };
});

describe("siteUrl", () => {
  it("gebruikt NEXT_PUBLIC_SITE_URL als die is gezet", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://blusbox.nl";
    expect(await laadSiteUrl()).toBe("https://blusbox.nl");
  });

  it("haalt een trailing slash weg", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://blusbox.nl/";
    expect(await laadSiteUrl()).toBe("https://blusbox.nl");
  });

  it("valt terug op het productiedomein van het platform", async () => {
    // This is the case that broke: no explicit variable, but the platform
    // does know its own production domain.
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "www.blusbox.nl";
    expect(await laadSiteUrl()).toBe("https://www.blusbox.nl");
  });

  it("valt daarna terug op de deploy-URL, handig voor previews", async () => {
    process.env.VERCEL_URL = "blusbox-abc123.vercel.app";
    expect(await laadSiteUrl()).toBe("https://blusbox-abc123.vercel.app");
  });

  it("geeft voorrang aan de expliciete variabele boven het platform", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://blusbox.nl";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "iets-anders.vercel.app";
    expect(await laadSiteUrl()).toBe("https://blusbox.nl");
  });

  it("gebruikt localhost alleen als er niets anders bekend is", async () => {
    expect(await laadSiteUrl()).toBe("http://localhost:3000");
  });

  it("valt nooit terug op localhost als het platform een domein kent", async () => {
    // The actual regression: a deploy must never publish localhost
    // canonicals just because someone forgot an environment variable.
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "www.blusbox.nl";
    expect(await laadSiteUrl()).not.toContain("localhost");
  });
});
