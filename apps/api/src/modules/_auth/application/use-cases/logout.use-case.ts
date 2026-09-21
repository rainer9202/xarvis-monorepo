import { Inject, Injectable } from "@nestjs/common";
import type { RefreshTokenRequestDto } from "@xarvis/shared";
import { hashToken } from "../../../../infrastructure/auth/refresh-token";
import {
  REFRESH_TOKEN_REPOSITORY_PORT,
  RefreshTokenRepositoryPort,
} from "../../domain/refresh-token-repository.port";

/**
 * Use case: revokes a single refresh token. Unlike RefreshTokenUseCase,
 * logout is deliberately forgiving — a client calling logout twice, or with
 * an already-expired/already-revoked token, is not a compromise signal, it's
 * just a redundant logout. "Token not found" is treated as a no-op success
 * here (not an UnauthorizedException like in the refresh flow) so logout
 * stays idempotent.
 */
@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY_PORT)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
  ) {}

  async execute(input: RefreshTokenRequestDto): Promise<{ success: true }> {
    const tokenHash = hashToken(input.refreshToken);
    const stored = await this.refreshTokenRepository.findByTokenHash(
      tokenHash,
    );

    if (stored) {
      await this.refreshTokenRepository.revoke(stored.id);
    }

    return { success: true };
  }
}
