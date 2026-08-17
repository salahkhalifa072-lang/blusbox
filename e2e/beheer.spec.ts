import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Het beheerdeel, met een sessie.
 *
 * Deze schermen zaten niet in de toegankelijkheidsaudit omdat ze achter een
 * login staan, en dat is precies waar er iets misging: de tabellen scrollen
 * horizontaal zonder dat je er met een toetsenbord bij kon. Dat kwam pas aan
 * het licht toen iemand er handmatig naar keek. Vandaar deze suite, en
 * vandaar dat hij ook op een smalle breedte draait — een tabel die past,
 * scrollt niet en verbergt het probleem.
 */

const ROUTES = [
  "/dashboard",
  "/dashboard/bestellingen",
  "/dashboard/lots",
  "/dashboard/units",
  "/dashboard/recalls",
  "/dashboard/activeringen",
  "/dashboard/retouren",
];

for (const route of ROUTES) {
  test(`axe: ${route}`, async ({ page }) => {
    await page.goto(route);
    // Zeker weten dat we niet naar het inlogscherm kijken.
    expect(new URL(page.url()).pathname).toBe(route);

    const resultaat = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
      .analyze();

    const samenvatting = resultaat.violations.map((v) => ({
      regel: v.id,
      ernst: v.impact,
      aantal: v.nodes.length,
      element: v.nodes[0]?.target.join(" "),
    }));
    expect(samenvatting).toEqual([]);
  });
}

test("de tabellen zijn met het toetsenbord te scrollen", async ({ page }) => {
  await page.setViewportSize({ width: 520, height: 800 });
  await page.goto("/dashboard/bestellingen");

  const regio = page.getByRole("region", { name: "Alle bestellingen" });
  await expect(regio).toHaveAttribute("tabindex", "0");
});

test("een recall is per afnemer af te vinken", async ({ page }) => {
  // Het pad dat een recall pas afsluitbaar maakt: wie telefonisch reageert
  // moet met de hand afgevinkt kunnen worden.
  await page.goto("/dashboard/recalls");

  const eerste = page.locator('a[href^="/dashboard/recalls/"]').first();
  const aantal = await eerste.count();
  test.skip(aantal === 0, "geen recalls in deze database");

  await eerste.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Terugroepactie",
  );
  await expect(page.getByRole("columnheader", { name: "Bevestigd" })).toBeVisible();
});
