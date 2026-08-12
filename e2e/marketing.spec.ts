import { expect, test } from "@playwright/test";

/**
 * De publieke pagina's: staat de prijs er goed op, is de verzendbelofte
 * zichtbaar, en klopt wat we aan Google vertellen met wat de bezoeker ziet.
 */

/** Wat er op de site hoort te staan. Faalt zodra iets uit de pas loopt. */
const PRIJS = "€ 28,95";

test.describe("home", () => {
  test("toont de kop, de prijs en de verzendbelofte", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Blusbox/);
    // De kop is opgesplitst rond het product; de sr-only zin draagt de hele
    // regel voor voorleessoftware.
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Als alles al is misgegaan, grijpt Blusbox in.",
    );

    await expect(page.getByText(PRIJS).first()).toBeVisible();
    await expect(
      page.getByText("Altijd gratis verzending").first(),
    ).toBeVisible();
  });

  test("noemt de waarde van de gratis verzending", async ({ page }) => {
    await page.goto("/");
    // § De belofte is alleen geloofwaardig als er een bedrag bij staat.
    await expect(page.getByText("€ 6,00").first()).toBeVisible();
  });

  test("levert Organization-data aan zoekmachines", async ({ page }) => {
    await page.goto("/");
    const blokken = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const types = blokken.map((b) => JSON.parse(b)["@type"]);
    expect(types).toContain("Organization");
  });

  test("verbergt geen tekst achter JavaScript", async ({ browser }) => {
    // De reveal-animatie mag inhoud nooit onzichtbaar maken voordat de
    // bundel binnen is; zonder JS moet de pagina gewoon leesbaar zijn.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByText("Waarom juist de meterkast")).toBeVisible();
    await expect(page.getByText(PRIJS).first()).toBeVisible();
    await context.close();
  });
});

test.describe("productpagina", () => {
  test("toont prijs, btw-regel en gratis verzending", async ({ page }) => {
    await page.goto("/blusbox");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Blusbox");
    await expect(page.getByText(PRIJS).first()).toBeVisible();
    // "incl. btw" staat ook in een balk die per breedte verborgen is
    await expect(
      page.locator("main").getByText(/incl\. btw/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText("Altijd gratis verzending").first(),
    ).toBeVisible();
  });

  test("beschrijft het product voor zoekmachines met dezelfde prijs", async ({
    page,
  }) => {
    await page.goto("/blusbox");
    const blokken = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const product = blokken
      .map((b) => JSON.parse(b))
      .find((d) => d["@type"] === "Product");

    expect(product).toBeTruthy();
    // Gestructureerde data die afwijkt van de zichtbare prijs is een reden
    // voor Google om de rich result te laten vallen.
    expect(product.offers.price).toBe("28.95");
    expect(product.offers.priceCurrency).toBe("EUR");
    expect(product.offers.shippingDetails.shippingRate.value).toBe("0");
  });

  test("heeft een kruimelpad in de gestructureerde data", async ({ page }) => {
    await page.goto("/blusbox");
    const blokken = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const kruimels = blokken
      .map((b) => JSON.parse(b))
      .find((d) => d["@type"] === "BreadcrumbList");

    expect(kruimels.itemListElement[0].name).toBe("Home");
    expect(kruimels.itemListElement[1].name).toBe("Blusbox");
    // absolute URL's, anders negeert Google ze
    expect(kruimels.itemListElement[1].item).toMatch(/^https?:\/\/.+\/blusbox$/);
  });
});

test.describe("vindbaarheid", () => {
  test("serveert robots.txt en sitemap.xml", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toMatch(/sitemap/i);

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const xml = await sitemap.text();
    expect(xml).toContain("/blusbox");
    expect(xml).toContain("/hoe-het-werkt");
  });

  test("zet op elke pagina een absolute canonical", async ({ page }) => {
    for (const pad of ["/", "/blusbox", "/hoe-het-werkt", "/zakelijk"]) {
      await page.goto(pad);
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      // Een canonical die naar localhost wijst haalt de hele pagina uit de
      // index — dat is eerder gebeurd, vandaar deze test.
      expect(canonical).toMatch(/^https?:\/\//);
      expect(canonical).not.toBe("");
    }
  });
});

test.describe("doodlopende paden", () => {
  test("geeft een eigen 404 met wegwijzers", async ({ page }) => {
    const response = await page.goto("/deze-pagina-bestaat-echt-niet");
    expect(response?.status()).toBe(404);

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "bestaat niet",
    );
    // Een doodlopend pad op een webshop hoort ergens heen te wijzen.
    await expect(
      page.getByRole("link", { name: /Blusbox bestellen/ }),
    ).toBeVisible();
  });

  test("houdt de 404 uit de index", async ({ page }) => {
    await page.goto("/deze-pagina-bestaat-echt-niet");
    const robots = await page
      .locator('meta[name="robots"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute("content")));
    expect(robots.length).toBe(1);
    expect(robots[0]).toContain("noindex");
  });
});
