import { expect, test } from "@playwright/test";

/**
 * §8 rolafdwinging. De kern hiervan zit in unittests op `lib/rollen`, maar
 * die bewijzen alleen dat de functie klopt — niet dat elke route hem ook
 * aanroept. Dat is precies waar dit soort lekken ontstaan.
 *
 * Twee verschillende antwoorden zijn allebei goed, en dat is met opzet:
 * doorsturen naar inloggen bij een scherm waarvan het bestaan geen geheim
 * is, en 404 bij recall — daar is het bestaan zelf informatie.
 */

const NAAR_INLOGGEN = ["/dashboard", "/dashboard/bestellingen", "/portaal"];
const BESTAAT_NIET_VOOR_JOU = ["/dashboard/recall"];

for (const route of NAAR_INLOGGEN) {
  test(`${route} stuurt een anonieme bezoeker naar inloggen`, async ({
    page,
  }) => {
    await page.goto(route);
    expect(new URL(page.url()).pathname).toBe("/account");
  });
}

for (const route of BESTAAT_NIET_VOOR_JOU) {
  test(`${route} verraadt zijn bestaan niet`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);

    const inhoud = await page.locator("body").innerText();
    expect(inhoud).not.toMatch(/lotnummer|afnemers|terugroep/i);
  });
}

test("geen enkel afgeschermd scherm lekt inhoud", async ({ page }) => {
  for (const route of [...NAAR_INLOGGEN, ...BESTAAT_NIET_VOOR_JOU]) {
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
