import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  // E-mailsjablonen (.tsx) moeten ook in tests te renderen zijn; tsconfig
  // zet jsx op "preserve" voor Next, en daar kan Vite niets mee.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
