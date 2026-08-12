import { expect, test } from "@playwright/test";

/**
 * §8 rolafdwinging. De kern hiervan zit in unittests op `lib/rollen`, maar
 * die bewijzen alleen dat de functie klopt — niet dat elke route hem ook
 * aanroept. Dat is precies waar dit soort lekken ontstaat.
 */

const AFGESCHERMD = [
  "/dashboard",
  "/dashboard/bestellingen",
  "/dashboard/lots",
  "/dashboard/recalls",
  "/dashboard/units",
  "/dashboard/retouren",
  "/dashboard/activeringen",
  "/portaal",
];

for (const route of AFGESCHERMD) {
  test(`${route} stuurt een anonieme bezoeker naar inloggen`, async ({
    page,
  }) => {
    await page.goto(route);
    expect(new URL(page.url()).pathname).toBe("/account");
  });
}

test("geen enkel afgeschermd scherm lekt inhoud", async ({ page }) => {
  for (const route of AFGESCHERMD) {
    await page.goto(route);
    const inhoud = (await page.locator("body").innerText()).toLowerCase();
    // Kolomkoppen uit het dashboard; als die zichtbaar zijn, staat het open.
    for (const verklikker of ["ordernummer", "lotnummer", "afnemer"]) {
      expect(inhoud, `${route} toonde "${verklikker}"`).not.toContain(
        verklikker,
      );
    }
  }
});

test("de installateurspagina zelf is gewoon publiek", async ({ page }) => {
  // /installateurs is marketing en moet open zijn; /portaal is het afgeschermde deel.
  await page.goto("/installateurs");
  expect(new URL(page.url()).pathname).toBe("/installateurs");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("het accountscherm vraagt om inloggen", async ({ page }) => {
  await page.goto("/account");
  const inhoud = await page.locator("main").innerText();
  expect(inhoud.toLowerCase()).toMatch(/inloggen|e-mailadres|wachtwoord/);
});
