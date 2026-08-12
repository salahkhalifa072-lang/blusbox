import { expect, test } from "@playwright/test";

/**
 * De publieke terugroeppagina. De volledige gang van zaken — versturen,
 * bevestigen, niet twee keer stempelen — staat in `src/db/terugroep.test.ts`
 * tegen een echte database. Hier gaat het om wat er aan de buitenkant
 * gebeurt met een link die niet klopt.
 */

test("een onzinnige id geeft 404, geen serverfout", async ({ page }) => {
  const response = await page.goto("/terugroep/zomaar-wat");
  expect(response?.status()).toBe(404);
});

test("een geldig gevormde maar onbekende id geeft 404", async ({ page }) => {
  // Zo kan niemand met een lijst uuid's aftasten welke bestaan.
  const response = await page.goto(
    "/terugroep/00000000-0000-4000-8000-000000000000",
  );
  expect(response?.status()).toBe(404);
});

test("de pagina hoort niet in een zoekmachine", async ({ page }) => {
  // Deze pagina hoort bij één afnemer. Ook de 404-variant mag niet
  // geïndexeerd worden.
  await page.goto("/terugroep/00000000-0000-4000-8000-000000000000");
  const robots = await page
    .locator('meta[name="robots"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute("content")));
  expect(robots.join(" ")).toContain("noindex");
});
