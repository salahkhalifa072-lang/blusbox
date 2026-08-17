import { expect, test as setup } from "@playwright/test";
import path from "node:path";

/**
 * Logt één keer in en bewaart de sessie, zodat de beheertests niet elk
 * afzonderlijk door het inlogscherm hoeven.
 *
 * De inloggegevens komen uit de omgeving en staan niet in de repo. Zonder
 * `E2E_ADMIN_EMAIL` en `E2E_ADMIN_WACHTWOORD` doet dit project niet mee —
 * beter dan een testwachtwoord dat meelift in de geschiedenis.
 *
 * Lokaal aanmaken kan met:
 *   npm run db:admin -- e2e-admin@blusbox.test '<een lang wachtwoord>'
 */

export const SESSIE_BESTAND = path.join(
  process.cwd(),
  "playwright/.auth/beheerder.json",
);

setup("meld de beheerder aan", async ({ page }) => {
  // Het project draait alleen als deze twee gezet zijn; zie playwright.config.
  const email = process.env.E2E_ADMIN_EMAIL!;
  const wachtwoord = process.env.E2E_ADMIN_WACHTWOORD!;

  await page.goto("/account");
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByLabel("Wachtwoord").fill(wachtwoord);
  await page.getByRole("button", { name: "Inloggen" }).click();

  // /account stuurt na inloggen door op rol; een beheerder hoort in het
  // dashboard te landen.
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: SESSIE_BESTAND });
});
