import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * DI token feature modules inject to get the Drizzle client, e.g.:
 *   @Inject(DATABASE_CONNECTION) private readonly db: DrizzleDatabase
 */
export const DATABASE_CONNECTION = Symbol("DATABASE_CONNECTION");

export type DrizzleDatabase = NodePgDatabase<typeof schema>;

/**
 * Owns the pg.Pool + Drizzle client for the app's lifetime. Registered as a
 * provider (see database.module.ts) so Nest constructs it once and calls
 * onModuleDestroy() to close the pool cleanly on app shutdown.
 */
@Injectable()
export class DrizzleClient implements OnModuleDestroy {
  readonly pool: Pool;
  readonly db: DrizzleDatabase;

  constructor(config: ConfigService) {
    this.pool = new Pool({ connectionString: config.get<string>("DATABASE_URL") });
    this.db = drizzle(this.pool, { schema });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
