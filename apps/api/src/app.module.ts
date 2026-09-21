import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
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
    DatabaseModule,
    HealthModule,
    UserModule,
    AuthModule,
    NewsModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
