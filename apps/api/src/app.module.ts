import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { validateEnv } from "./infrastructure/config/env.schema";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { AuthModule } from "./modules/_auth/auth.module";
import { HealthModule } from "./modules/_health/health.module";
import { HttpExceptionFilter } from "./infrastructure/http/http-exception.filter";
import { ResponseInterceptor } from "./infrastructure/http/response.interceptor";
import { NewsModule } from "./modules/business/news/news.module";
import { UserModule } from "./modules/user/user.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Global default: 100 requests/minute per IP. Routes that need a
    // stricter limit (e.g. /auth/login) override it with @Throttle(...).
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    HealthModule,
    UserModule,
    AuthModule,
    NewsModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
