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
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobiel", use: { ...devices["Pixel 7"] } },
  ],
  ...(EIGEN_URL
    ? {}
    : {
        webServer: {
          // Eigen buildmap, anders sloopt deze build een draaiende dev-server
          command: `NEXT_DIST_DIR=.next-e2e npm run build && NEXT_DIST_DIR=.next-e2e npx next start -p ${POORT}`,
          url: BASIS,
          reuseExistingServer: false,
          timeout: 180_000,
          stdout: "ignore",
          stderr: "pipe",
        },
      }),
});
