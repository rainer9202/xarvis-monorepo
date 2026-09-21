import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { AuthResponse, RefreshTokenRequestDto } from "@xarvis/shared";
import { hashToken } from "../../../../infrastructure/auth/refresh-token";
import { toPublicUser } from "../../../user/application/to-public-user";
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from "../../../user/domain/user-repository.port";
import {
  REFRESH_TOKEN_REPOSITORY_PORT,
  RefreshTokenRepositoryPort,
} from "../../domain/refresh-token-repository.port";
import { issueRefreshToken } from "../issue-refresh-token";

/**
 * Use case: rotates a refresh token. Takes the RAW refresh token from the
 * client, hashes it, and looks up the row by that hash — the raw token
 * itself is never stored or compared directly (see
 * infrastructure/auth/refresh-token.ts).
 */
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY_PORT)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: RefreshTokenRequestDto): Promise<AuthResponse> {
    const tokenHash = hashToken(input.refreshToken);
    const stored = await this.refreshTokenRepository.findByTokenHash(
      tokenHash,
    );

    if (!stored) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (stored.isRevoked) {
      // REUSE DETECTION: a revoked token is one we already rotated away (or
      // explicitly logged out) — it should never be presented again. Seeing
      // it here means either the legitimate client is buggy/racing, or an
      // attacker stole an old token and is replaying it. We can't tell which
      // from this alone, so we treat it as a compromise signal and nuke
      // EVERY active session for this user, not just this one token. This
      // is deliberately aggressive: the cost of a false positive (user has
      // to log back in) is far lower than the cost of letting a stolen
      // token silently keep working.
      await this.refreshTokenRepository.revokeAllForUser(stored.userId);
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (stored.isExpired) {
      // Naturally expired, never revoked — this is NOT a compromise signal,
      // just an old token nobody used in time. No need to nuke other
      // sessions for this.
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.userRepository.findById(stored.userId);
    if (!user) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Rotate: the used token is single-use — revoke it before issuing the
    // replacement so a token can never be redeemed twice.
    await this.refreshTokenRepository.revoke(stored.id);

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
