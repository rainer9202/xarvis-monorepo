import { Controller, Get, Inject } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorService,
} from "@nestjs/terminus";
import { sql } from "drizzle-orm";
import {
  DATABASE_CONNECTION,
  type DrizzleDatabase,
} from "../../infrastructure/database/client";
import { ResponseMessage } from "../../infrastructure/http/response-message.decorator";

/**
 * No dedicated Terminus indicator exists for raw Drizzle/pg, so the database
 * check runs a trivial `SELECT 1` through the same DATABASE_CONNECTION every
 * other module injects — down if the pool can't reach Postgres.
 */
@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly indicators: HealthIndicatorService,
    @Inject(DATABASE_CONNECTION) private readonly db: DrizzleDatabase,
  ) {}

  @Get()
  @HealthCheck()
  @ResponseMessage("Health check")
  check() {
    return this.health.check([
      () =>
        this.indicators
          .check("database")
          .attempt(async () => {
            await this.db.execute(sql`SELECT 1`);
          })
          .withTimeout(3000),
    ]);
  }
}
