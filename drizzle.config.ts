import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next reads .env.local; plain `dotenv/config` would only read .env, so
// drizzle-kit would run without a DATABASE_URL that the app itself has.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
