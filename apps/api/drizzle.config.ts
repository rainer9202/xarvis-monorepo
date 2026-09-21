import { defineConfig } from "drizzle-kit";

// drizzle-kit's CLI (generate/migrate/...) auto-loads apps/api/.env when
// present; DATABASE_URL can also be exported directly in the shell.

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set (check apps/api/.env)");
}

export default defineConfig({
  schema: "./src/infrastructure/database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
