import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * De cookievraag zoals een nieuwe bezoeker uit een advertentie hem ziet:
 * telefoon (375 × 812), lege browser. De vraag sluit de pagina af tot er
 * gekozen is, Weigeren is even makkelijk als Akkoord, en na de keuze is de
 * pagina meteen te gebruiken.
 *
 * Google en Meta worden hier nooit echt aangeroepen: hun scripts worden
 * onderschept en vervangen door een lege stub. Zo is te zien óf ze geladen
 * worden, en blijft de wachtrij van de pixel (fbq.queue) staan om te tellen
 * wat er gemeld zou zijn.
 */

test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  isMobile: true,
});

const META = /connect\.facebook\.net/;
const GOOGLE = /googletagmanager\.com/;

/** Onderschept Google en Meta en houdt bij wat er opgevraagd werd. */
async function volgMeetscripts(page: Page) {
  const geladen: string[] = [];
  await page.route(META, (route) => {
    geladen.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });
  await page.route(GOOGLE, (route) => {
    geladen.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });
  return geladen;
}

/** Wat er naar /api/toestemming ging, en met welke status. */
function volgTellingen(page: Page) {
  const tellingen: { keuze: string; status: number }[] = [];
  page.on("response", async (antwoord) => {
    const verzoek = antwoord.request();
    if (!verzoek.url().endsWith("/api/toestemming") || verzoek.method() !== "POST") return;
    const keuze = (verzoek.postDataJSON() as { keuze: string }).keuze;
    tellingen.push({ keuze, status: antwoord.status() });
  });
  return tellingen;
}

/** De gebeurtenissen in de wachtrij van de pixel, zoals ["track", "PageView"]. */
async function pixelGebeurtenissen(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const fbq = (window as unknown as { fbq?: { queue?: unknown[][] } }).fbq;
    return (fbq?.queue ?? [])
      .filter((a) => a[0] === "track")
      .map((a) => String(a[1]));
  });
}

const paneel = (page: Page) => page.getByRole("dialog", { name: /cookies gebruiken/i });

test.describe("cookievraag", () => {
  test("nieuwe bezoeker: paneel onderaan, pagina erachter niet te gebruiken", async ({ page }) => {
    const geladen = await volgMeetscripts(page);
    const tellingen = volgTellingen(page);
    await page.goto("/blusbox");

    await expect(paneel(page)).toBeVisible();
    const vak = (await paneel(page).boundingBox())!;
    // Hooguit ongeveer 40% van de schermhoogte, en vast tegen de onderkant.
    expect(vak.height).toBeLessThanOrEqual(812 * 0.4 + 1);
    expect(Math.round(vak.y + vak.height)).toBe(812);

    // Bovenaan de pagina klik je op het gedimde vlak van het paneel, niet
    // op de pagina zelf.
    const raakt = await page.evaluate(() =>
      Boolean(document.elementFromPoint(187, 120)?.closest("dialog")),
    );
    expect(raakt).toBe(true);
    // En scrollen kan niet.
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe(
      "hidden",
    );

    // Escape sluit het niet; ook niet twee keer.
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(paneel(page)).toBeVisible();

    // Geen kruisje: alleen de link en de twee knoppen.
    await expect(paneel(page).getByRole("button")).toHaveCount(2);

    await expect.poll(() => tellingen.find((t) => t.keuze === "getoond")?.status).toBe(204);
    expect(geladen).toEqual([]);
  });

  test("axe: het paneel zelf", async ({ page }) => {
    await page.goto("/blusbox");
    await expect(paneel(page)).toBeVisible();
    const resultaat = await new AxeBuilder({ page })
      .include("dialog")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
      .analyze();
    expect(resultaat.violations.map((v) => v.id)).toEqual([]);
  });

  test("Weigeren en Akkoord zijn even groot en even opvallend", async ({ page }) => {
    await page.goto("/blusbox");
    const weigeren = paneel(page).getByRole("button", { name: "Weigeren" });
    const akkoord = paneel(page).getByRole("button", { name: "Akkoord" });

    const [w, a] = [(await weigeren.boundingBox())!, (await akkoord.boundingBox())!];
    expect(w.height).toBeGreaterThanOrEqual(44);
    expect(Math.round(w.height)).toBe(Math.round(a.height));
    expect(Math.round(w.width)).toBe(Math.round(a.width));
    // Naast elkaar.
    expect(Math.round(w.y)).toBe(Math.round(a.y));

    const stijl = (knop: typeof weigeren) =>
      knop.evaluate((el) => {
        const s = getComputedStyle(el);
        return [s.fontSize, s.fontWeight, s.color, s.backgroundColor].join(" ");
      });
    expect(await stijl(weigeren)).toBe(await stijl(akkoord));
  });

  test("met het toetsenbord: focus blijft in het paneel en beide knoppen werken", async ({
    page,
  }) => {
    await page.goto("/blusbox");
    await expect(paneel(page)).toBeVisible();
    const inPaneel = () =>
      page.evaluate(() => Boolean(document.activeElement?.closest("dialog")));

    expect(await inPaneel()).toBe(true);
    const bezocht = new Set<string>();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      // Na de laatste knop gaat de focus even naar de browser zelf (body,
      // de adresbalk) en dan terug naar het paneel; nooit naar de pagina.
      const opBody = await page.evaluate(() => document.activeElement === document.body);
      if (opBody) continue;
      expect(await inPaneel()).toBe(true);
      bezocht.add(await page.evaluate(() => document.activeElement?.textContent?.trim() ?? ""));
    }
    expect([...bezocht].sort()).toEqual(["Akkoord", "Privacyverklaring", "Weigeren"]);

    await paneel(page).getByRole("button", { name: "Weigeren" }).focus();
    await page.keyboard.press("Enter");
    await expect(paneel(page)).toBeHidden();
  });

  test("Weigeren: paneel weg, geen Google of Meta, ook niet na herladen", async ({ page }) => {
    const geladen = await volgMeetscripts(page);
    const tellingen = volgTellingen(page);
    await page.goto("/blusbox");
    await paneel(page).getByRole("button", { name: "Weigeren" }).click();

    await expect(paneel(page)).toBeHidden();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe(
      "hidden",
    );
    await expect.poll(() => tellingen.find((t) => t.keuze === "geweigerd")?.status).toBe(204);

    const cookies = await page.context().cookies();
    const keuze = cookies.find((c) => c.name === "blusbox-toestemming");
    expect(keuze?.value).toBe("geweigerd.1");
    // 182 dagen, met een minuut speling voor de testduur.
    expect(keuze!.expires - Date.now() / 1000).toBeGreaterThan(182 * 86400 - 60);

    await page.reload();
    await expect(page.locator("h1")).toBeVisible();
    await expect(paneel(page)).toBeHidden();

    // De koopbalk ligt nergens meer onder en is te bedienen.
    await page
      .getByRole("button", { name: "In winkelwagen", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/winkelwagen/);
    expect(geladen).toEqual([]);
  });

  test("Akkoord: paneel weg, pixel laadt nu, precies één PageView", async ({ page }) => {
    const geladen = await volgMeetscripts(page);
    const tellingen = volgTellingen(page);
    await page.goto("/blusbox");
    expect(geladen).toEqual([]);

    await paneel(page).getByRole("button", { name: "Akkoord" }).click();
    await expect(paneel(page)).toBeHidden();

    await expect.poll(() => geladen.some((u) => META.test(u))).toBe(true);
    await expect.poll(() => geladen.some((u) => GOOGLE.test(u))).toBe(true);
    await expect.poll(() => pixelGebeurtenissen(page)).toEqual(["PageView"]);
    await expect.poll(() => tellingen.find((t) => t.keuze === "verleend")?.status).toBe(204);

    await page.reload();
    await expect(page.locator("h1")).toBeVisible();
    await expect(paneel(page)).toBeHidden();
  });

  test("Koop nu na Akkoord: precies één AddToCart en één InitiateCheckout", async ({ page }) => {
    await volgMeetscripts(page);
    await page.goto("/blusbox");
    await paneel(page).getByRole("button", { name: "Akkoord" }).click();
    await expect(paneel(page)).toBeHidden();

    await page.getByRole("button", { name: /koop nu/i }).first().click();
    await expect(page).toHaveURL(/\/afrekenen/);

    await expect
      .poll(async () => (await pixelGebeurtenissen(page)).filter((g) => g !== "PageView"))
      .toEqual(["AddToCart", "InitiateCheckout"]);
    // Even wachten: een tweede melding zou na de eerste komen.
    await page.waitForTimeout(1500);
    expect((await pixelGebeurtenissen(page)).filter((g) => g !== "PageView")).toEqual([
      "AddToCart",
      "InitiateCheckout",
    ]);
  });

  test("Cookie-instellingen in de footer: van Akkoord naar Weigeren", async ({ page }) => {
    const geladen = await volgMeetscripts(page);
    const tellingen = volgTellingen(page);
    await page.goto("/blusbox");
    await paneel(page).getByRole("button", { name: "Akkoord" }).click();
    await expect.poll(() => geladen.length).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Cookie-instellingen" }).click();
    await expect(paneel(page)).toBeVisible();
    await expect(paneel(page)).toContainText("Je huidige keuze: Akkoord");

    await paneel(page).getByRole("button", { name: "Weigeren" }).click();
    await page.waitForLoadState("load");
    await expect(paneel(page)).toBeHidden();

    // Vanaf hier laadt er niets meer, ook niet op de volgende pagina.
    geladen.length = 0;
    await page.goto("/");
    await expect(paneel(page)).toBeHidden();
    expect(geladen).toEqual([]);
    expect(await page.evaluate(() => typeof (window as { fbq?: unknown }).fbq)).toBe("undefined");

    // Een gewijzigde keuze telt niet als nieuwe vertoning of keuze.
    expect(tellingen.map((t) => t.keuze).sort()).toEqual(["getoond", "verleend"]);
  });

  test("de privacyverklaring is te lezen vóór de keuze", async ({ page }) => {
    await page.goto("/blusbox");
    await paneel(page).getByRole("link", { name: "Privacyverklaring" }).click();
    await expect(page).toHaveURL(/\/privacyverklaring/);

    // Het paneel blijft staan, maar de pagina is te lezen en te scrollen.
    await expect(paneel(page)).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe(
      "hidden",
    );
    const raakt = await page.evaluate(() =>
      Boolean(document.elementFromPoint(187, 200)?.closest("dialog")),
    );
    expect(raakt).toBe(false);

    // Terug naar de winkel: weer een vraag die om een keuze vraagt.
    await page.goBack();
    await expect(paneel(page)).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe(
      "hidden",
    );
  });
});
