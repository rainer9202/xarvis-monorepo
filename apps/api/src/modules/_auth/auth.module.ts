import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import type { JwtSignOptions } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UserModule } from "../user/user.module";
import { DevLoginUseCase } from "./application/use-cases/dev-login.use-case";
import { LoginUseCase } from "./application/use-cases/login.use-case";
import { LogoutUseCase } from "./application/use-cases/logout.use-case";
import { RefreshTokenUseCase } from "./application/use-cases/refresh-token.use-case";
import { REFRESH_TOKEN_REPOSITORY_PORT } from "./domain/refresh-token-repository.port";
import { AuthController } from "./infrastructure/http/auth.controller";
import { JwtAuthGuard } from "./infrastructure/jwt-auth.guard";
import { JwtStrategy } from "./infrastructure/jwt.strategy";
import { DrizzleRefreshTokenRepository } from "./infrastructure/persistence/drizzle-refresh-token.repository";

/**
 * Nest wiring layer, mirroring UserModule's shape. Imports UserModule to
 * reuse the same USER_REPOSITORY_PORT binding (UserModule now exports it)
 * instead of re-declaring a separate DrizzleUserRepository binding here.
 */
@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: {
          // env.schema.ts validates this as a string (e.g. "1h"); the
          // jsonwebtoken types only accept its stricter ms.StringValue
          // pattern, which a plain `string` can't statically prove.
          expiresIn: config.get<string>(
            "JWT_EXPIRES_IN",
          ) as JwtSignOptions["expiresIn"],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    DevLoginUseCase,
    JwtStrategy,
    JwtAuthGuard,
    {
      provide: REFRESH_TOKEN_REPOSITORY_PORT,
      useClass: DrizzleRefreshTokenRepository,
    },
  ],
})
export class AuthModule {}
