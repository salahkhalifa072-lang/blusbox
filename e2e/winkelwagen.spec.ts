import { expect, test, type Page } from "@playwright/test";

/**
 * Het pad waar geld aan hangt. Dit gaat tot en met de laatste stap vóór de
 * betaalpagina; verder gaan zou een echte Stripe-sessie aanmaken.
 */

const PRIJS_CENTEN = 2895;

/** Zoals de site het schrijft: € 28,95, met een vaste spatie. */
const euro = (centen: number) =>
  `€ ${(centen / 100).toFixed(2).replace(".", ",")}`;

/** Het overzicht staat in een <aside>, naast de regels zelf. */
const overzicht = (page: Page) => page.getByRole("complementary");

async function legInWagen(page: Page, aantal?: number) {
  await page.goto("/blusbox");
  if (aantal !== undefined) await page.getByLabel("Aantal").fill(String(aantal));
  // Op smalle schermen staat er ook een knop in de onderbalk; die neemt
  // altijd één stuk, dus voor het aantal moet je in de koopkolom zijn.
  await page
    .getByRole("button", { name: "In winkelwagen", exact: true })
    .click();
  // De actie stuurt door naar de wagen; dat is de enige bevestiging die de
  // klant krijgt, dus als dit niet gebeurt is er iets echt mis.
  await expect(page).toHaveURL(/\/winkelwagen/);
}

test.describe("winkelwagen", () => {
  test("legt de module in de wagen en rekent de geadverteerde prijs", async ({
    page,
  }) => {
    await legInWagen(page);

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /winkelwagen/i,
    );
    // De klant betaalt exact wat er op de pagina stond. Dat is niet
    // vanzelfsprekend: € 28,95 is niet te maken door btw op te tellen bij
    // een heel aantal centen, dus de berekening loopt andersom.
    await expect(overzicht(page)).toContainText(euro(PRIJS_CENTEN));
  });

  test("laat zien dat verzending gratis is én wat dat waard is", async ({
    page,
  }) => {
    await legInWagen(page);

    await expect(
      overzicht(page).getByRole("term").filter({ hasText: "Verzending" }),
    ).toBeVisible();
    // De doorgestreepte € 6,00 naast "gratis" is de hele belofte.
    await expect(overzicht(page)).toContainText("€ 6,00");
    await expect(overzicht(page)).toContainText("gratis");
  });

  test("telt op bij meer stuks", async ({ page }) => {
    await legInWagen(page, 3);
    await expect(overzicht(page)).toContainText(euro(PRIJS_CENTEN * 3));
  });

  test("splitst de btw zo dat de som exact uitkomt", async ({ page }) => {
    await legInWagen(page);

    const tekst = await overzicht(page).innerText();
    const lees = (label: RegExp) => {
      const m = tekst.match(
        new RegExp(label.source + "[^€]*€\\s*([\\d.]+),(\\d{2})"),
      );
      if (!m) throw new Error(`bedrag niet gevonden bij ${label}`);
      return Number(m[1].replace(".", "")) * 100 + Number(m[2]);
    };

    const excl = lees(/Subtotaal excl\. btw/);
    const btw = lees(/Btw 21%/);
    const totaal = lees(/Totaal incl\. btw/);

    expect(totaal).toBe(PRIJS_CENTEN);
    expect(excl + btw).toBe(totaal);
  });

  test("meldt een lege wagen zonder doodlopend pad", async ({ page }) => {
    await page.goto("/winkelwagen");
    await expect(page.getByText("Je winkelwagen is leeg.")).toBeVisible();
  });
});

test.describe("afrekenen", () => {
  test.beforeEach(async ({ page }) => {
    await legInWagen(page);
    await page.goto("/afrekenen");
  });

  test("neemt het wagentotaal mee naar de betaalknop", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: new RegExp(`Betalen`) }),
    ).toContainText(euro(PRIJS_CENTEN));
  });

  test("laat een onjuist e-mailadres niet door de browser komen", async ({
    page,
  }) => {
    await page.getByLabel("E-mailadres").fill("geen-adres");
    await page.getByLabel("Postcode").fill("1011 AB");
    await page.getByLabel("Huisnummer").fill("12");
    await page.getByRole("button", { name: /Betalen/ }).click();

    // type="email" vangt dit af vóór het verstuurd wordt: we blijven staan.
    await expect(page).toHaveURL(/\/afrekenen/);
    const geldig = await page
      .getByLabel("E-mailadres")
      .evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(geldig).toBe(false);
  });

  test("wijst een onjuiste postcode af met een Nederlands voorbeeld", async ({
    page,
  }) => {
    // Een postcode kent de browser niet, dus dit bewijst dat de server zelf
    // opnieuw valideert — het formulier is te omzeilen.
    await page.getByLabel("E-mailadres").fill("test@voorbeeld.nl");
    await page.getByLabel("Postcode").fill("XX");
    await page.getByLabel("Huisnummer").fill("12");
    await page.getByRole("button", { name: /Betalen/ }).click();

    await expect(page.getByText(/geldige postcode/i)).toBeVisible();
    await expect(page.getByText(/1011 AB/).first()).toBeVisible();
  });

  test("koppelt de foutmelding aan het veld waar hij bij hoort", async ({
    page,
  }) => {
    await page.getByLabel("E-mailadres").fill("test@voorbeeld.nl");
    await page.getByLabel("Postcode").fill("XX");
    await page.getByLabel("Huisnummer").fill("12");
    await page.getByRole("button", { name: /Betalen/ }).click();

    const postcode = page.getByLabel("Postcode");
    await expect(postcode).toHaveAttribute("aria-invalid", "true");
    await expect(postcode).toHaveAttribute("aria-describedby", "postcode-fout");
  });

  test("noemt de verzendbelofte bij het afrekenen", async ({ page }) => {
    // De belofte op de homepage moet ook waar zijn op het laatste scherm.
    await expect(page.getByText(/gratis/i).first()).toBeVisible();
  });

  test("noemt geen gevaarlijke goederen meer", async ({ page }) => {
    // Het product valt daar niet onder; die tekst mag nergens terugkomen.
    const inhoud = await page.locator("body").innerText();
    expect(inhoud).not.toMatch(/gevaarlijk|UN-nummer/i);
    // Woordgrens, anders matcht "ADR" ook in "bezorgadres".
    expect(inhoud).not.toMatch(/\bADR\b/);
  });
});
