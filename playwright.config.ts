import { defineConfig, devices } from "@playwright/test";

/**
 * §14 stap 12. Deze suite draait tegen een echte server met een echte
 * database — dat is het punt: de unittests in Vitest dekken de rekenregels,
 * hier gaat het om wat een bezoeker werkelijk ziet en kan doen.
 *
 * Bewust tegen een productiebuild op een eigen poort, niet tegen `next dev`.
 * De dev-server compileert een route pas bij het eerste bezoek, en dat gaf
 * met parallelle workers verlopen wachttijden op pagina's die niets mankeren.
 * Bovendien test je zo wat er daadwerkelijk gedeployd wordt.
 *
 * Draait er al iets waar je tegenaan wilt testen? Zet `E2E_BASIS_URL`, dan
 * start deze config zelf geen server.
 */

/**
 * De beheertests hebben een echte sessie nodig. Zonder inloggegevens draaien
 * ze niet mee — en dat mag geen rode suite opleveren voor iemand die de
 * repo net heeft binnengehaald. Ze overslaan in de test zelf is niet genoeg:
 * Playwright zoekt het sessiebestand al bij het opzetten van de context, en
 * struikelt daar voordat een skip aan bod komt. Vandaar hier, bij de
 * projecten.
 *
 * Aanzetten:
 *   npm run db:admin -- e2e-admin@blusbox.test '<lang wachtwoord>'
 *   E2E_ADMIN_EMAIL=… E2E_ADMIN_WACHTWOORD=… npm run e2e
 */
const HEEFT_BEHEERINLOG = Boolean(
  process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_WACHTWOORD,
);

if (!HEEFT_BEHEERINLOG) {
  console.warn(
    "[e2e] Beheertests overgeslagen: E2E_ADMIN_EMAIL en E2E_ADMIN_WACHTWOORD niet gezet.",
  );
}

const EIGEN_URL = process.env.E2E_BASIS_URL;
const POORT = 3101;
const BASIS = EIGEN_URL ?? `http://localhost:${POORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASIS,
    trace: "on-first-retry",
    locale: "nl-NL",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /beheer\.spec\.ts|auth\.setup\.ts/,
    },
    {
      name: "mobiel",
      use: { ...devices["Pixel 7"] },
      testIgnore: /beheer\.spec\.ts|auth\.setup\.ts/,
    },
    // Aparte opzet: één keer inloggen, daarna de sessie hergebruiken.
    ...(HEEFT_BEHEERINLOG
      ? [
          { name: "aanmelden", testMatch: /auth\.setup\.ts/ },
          {
            name: "beheer",
            testMatch: /beheer\.spec\.ts/,
            dependencies: ["aanmelden"],
            use: {
              ...devices["Desktop Chrome"],
              storageState: "playwright/.auth/beheerder.json",
            },
          },
        ]
      : []),
  ],
  ...(EIGEN_URL
    ? {}
    : {
        webServer: {
          // Eigen buildmap, anders sloopt deze build een draaiende dev-server
          command: `NEXT_DIST_DIR=.next-e2e npm run build && NEXT_DIST_DIR=.next-e2e npx next start -p ${POORT}`,
          url: BASIS,
          // Auth.js leidt zijn eigen URL af uit de omgeving. Zonder deze twee
          // blijft het aanmelden hangen op de callback: de app draait hier op
          // 3101 terwijl .env.local naar 3000 wijst.
          env: {
            NEXT_PUBLIC_SITE_URL: BASIS,
            AUTH_URL: BASIS,
            AUTH_TRUST_HOST: "true",
          },
          reuseExistingServer: false,
          timeout: 180_000,
          stdout: "ignore",
          stderr: "pipe",
        },
      }),
});
