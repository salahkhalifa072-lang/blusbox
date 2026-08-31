import { expect, test } from "@playwright/test";

/**
 * Wat alleen op smalle schermen bestaat.
 *
 * Deze tests draaien in beide projecten, maar zetten zelf de breedte: de
 * fouten die ze afdekken waren allemaal onzichtbaar op desktopbreedte.
 */

test.describe("mobiele navigatie", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test("er is een menuknop die de andere pagina's ontsluit", async ({
    page,
  }) => {
    // Zonder deze knop kom je op een telefoon niet verder dan de pagina waar
    // je binnenkwam: de pill-header toont zijn links pas vanaf lg.
    await page.goto("/");

    const knop = page.getByRole("button", { name: "Menu openen" });
    await expect(knop).toBeVisible();
    await expect(knop).toHaveAttribute("aria-expanded", "false");

    await knop.click();
    await expect(
      page.getByRole("button", { name: "Menu sluiten" }),
    ).toHaveAttribute("aria-expanded", "true");

    for (const label of ["Product", "Hoe het werkt", "Zakelijk", "Vragen"]) {
      await expect(
        page.getByRole("navigation", { name: "Hoofdnavigatie" }).getByRole("link", { name: label }),
      ).toBeVisible();
    }
  });

  test("het menu brengt je daadwerkelijk naar een andere pagina", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu openen" }).click();
    await page
      .getByRole("navigation", { name: "Hoofdnavigatie" })
      .getByRole("link", { name: "Hoe het werkt" })
      .click();

    await expect(page).toHaveURL(/\/hoe-het-werkt/);
    // Na de overgang hoort het paneel dicht te zijn.
    await expect(page.getByRole("button", { name: "Menu openen" })).toBeVisible();
  });

  test("Escape sluit het menu", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu openen" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Menu openen" })).toBeVisible();
  });
});

test.describe("hero op een telefoon", () => {
  test("de film staat in de flow en niet achter de tekst", async ({ page }) => {
    // Als achtergrond was de module volledig onzichtbaar op een klein
    // scherm: de tekstkolom is daar de hele breedte.
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const video = page.locator("main video").first();
    const kop = page.getByRole("heading", { level: 1 });

    const v = await video.boundingBox();
    const k = await kop.boundingBox();
    expect(v).not.toBeNull();
    expect(k).not.toBeNull();

    // De video heeft eigen hoogte en eindigt boven de kop.
    expect(v!.height).toBeGreaterThan(150);
    expect(v!.y + v!.height).toBeLessThanOrEqual(k!.y + 1);
  });

  test("op desktop ligt de film juist achter de tekst", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const video = page.locator("main video").first();
    const kop = page.getByRole("heading", { level: 1 });
    const v = await video.boundingBox();
    const k = await kop.boundingBox();

    // Overlappen betekent hier: de kop staat óver het beeld.
    expect(v!.y + v!.height).toBeGreaterThan(k!.y);
  });
});
