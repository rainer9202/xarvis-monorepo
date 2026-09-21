import { Global, Module } from "@nestjs/common";
import { DATABASE_CONNECTION, DrizzleClient } from "./client";

/**
 * Provides the Drizzle client once at the module level (DATABASE_CONNECTION
 * token) so any feature module can inject it without knowing about pg.Pool
 * or drizzle() setup. @Global() means importing it once in AppModule makes
 * DATABASE_CONNECTION available everywhere, without re-importing per feature.
 * DrizzleClient depends on ConfigService, so ConfigModule must be
 * global/imported before this module resolves its providers.
 */
@Global()
@Module({
  providers: [
    DrizzleClient,
    {
      provide: DATABASE_CONNECTION,
      useFactory: (client: DrizzleClient) => client.db,
      inject: [DrizzleClient],
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
