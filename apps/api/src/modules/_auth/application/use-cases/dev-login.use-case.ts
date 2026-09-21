import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { randomUUID } from "node:crypto";
import type { AuthResponse } from "@xarvis/shared";
import { hashPassword } from "../../../../infrastructure/auth/password";
import { toPublicUser } from "../../../user/application/to-public-user";
import { User } from "../../../user/domain/user.entity";
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from "../../../user/domain/user-repository.port";
import {
  REFRESH_TOKEN_REPOSITORY_PORT,
  RefreshTokenRepositoryPort,
} from "../../domain/refresh-token-repository.port";
import { issueRefreshToken } from "../issue-refresh-token";

const DEV_USER_EMAIL = "dev@local.test";
const DEV_USER_NAME = "Local Dev User";

/**
 * Mints a real token pair for a fixed local dev user, skipping password
 * verification entirely — a local-testing convenience, NOT an auth bypass:
 * JwtAuthGuard and LoginUseCase are completely untouched by this file, so
 * the real auth path is exactly as strict in every environment as before
 * this existed. The only thing this shortcuts is typing a password.
 *
 * Defense in depth: refuses outright if NODE_ENV is "production", even
 * though the controller already refuses to route here in that case — this
 * use case must never trust that the controller-level check is the only
 * thing standing between it and being reachable.
 */
@Injectable()
export class DevLoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY_PORT)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(): Promise<AuthResponse> {
    if (this.configService.get<string>("NODE_ENV") === "production") {
      throw new ForbiddenException("Not available in production");
    }

    let user = await this.userRepository.findByEmail(DEV_USER_EMAIL);
    if (!user) {
      // Random, never-used password — nobody logs in as this user with a
      // password, only via this dev-only shortcut.
      const passwordHash = await hashPassword(randomUUID());
      user = await this.userRepository.save(
        new User(randomUUID(), DEV_USER_EMAIL, DEV_USER_NAME, passwordHash),
      );
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    const refreshToken = await issueRefreshToken(
      user.id,
      this.refreshTokenRepository,
      this.configService.get<number>("REFRESH_TOKEN_EXPIRES_IN_DAYS")!,
    );

    return {
      accessToken,
      refreshToken,
      user: toPublicUser(user),
    };
  }
}
