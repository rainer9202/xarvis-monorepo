import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

/**
 * One-shot migration runner for production. Deliberately NOT drizzle-kit
 * (that's a dev-only CLI, stripped out of the production deploy) — this
 * uses drizzle-orm's own runtime `migrate()`, which just needs the SQL
 * files under ./drizzle (copied into the runtime image alongside dist/,
 * see apps/api/Dockerfile) and a DATABASE_URL. Run before `node dist/main.js`
 * in the container's CMD, not from within the Nest app itself.
 */
async function runMigrations(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete.");

  await pool.end();
}

runMigrations().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
