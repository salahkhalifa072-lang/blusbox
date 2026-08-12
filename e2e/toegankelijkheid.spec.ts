import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * De toegankelijkheidsaudit uit stap 11, vastgezet zodat hij niet stilletjes
 * kan terugvallen. Alle publieke routes, WCAG 2.0 en 2.1, A en AA, plus de
 * best-practice-regels — dat is waar de site nu op staat.
 */

const ROUTES = [
  "/",
  "/blusbox",
  "/hoe-het-werkt",
  "/meterkastbrand",
  "/zakelijk",
  "/installateurs",
  "/installatie",
  "/veelgestelde-vragen",
  "/verzending",
  "/retourneren",
  "/garantie",
  "/herroepingsrecht",
  "/downloads",
  "/over-ons",
  "/contact",
  "/algemene-voorwaarden",
  "/privacyverklaring",
  "/cookiebeleid",
  "/winkelwagen",
  "/account",
];

for (const route of ROUTES) {
  test(`axe: ${route}`, async ({ page }) => {
    await page.goto(route);
    const resultaat = await new AxeBuilder({ page })
      .withTags([
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
        "best-practice",
      ])
      .analyze();

    // Bij een fout wil je meteen zien wát er stuk is, niet alleen dát.
    const samenvatting = resultaat.violations.map((v) => ({
      regel: v.id,
      ernst: v.impact,
      aantal: v.nodes.length,
      element: v.nodes[0]?.target.join(" "),
    }));
    expect(samenvatting).toEqual([]);
  });
}

test("de 404 is ook toegankelijk", async ({ page }) => {
  await page.goto("/deze-pagina-bestaat-echt-niet");
  const resultaat = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();
  expect(resultaat.violations.map((v) => v.id)).toEqual([]);
});

test("de hele site is met het toetsenbord te bedienen", async ({ page }) => {
  await page.goto("/");

  // Tab tot in de navigatie en controleer dat de focus zichtbaar ergens landt.
  await page.keyboard.press("Tab");
  const eerste = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? { tag: el.tagName, tekst: el.textContent?.trim().slice(0, 40) } : null;
  });
  expect(eerste).not.toBeNull();
  expect(eerste!.tag).not.toBe("BODY");
});
