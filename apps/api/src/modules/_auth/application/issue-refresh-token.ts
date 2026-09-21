import { randomUUID } from "node:crypto";
import {
  generateRefreshToken,
  hashToken,
} from "../../../infrastructure/auth/refresh-token";
import { RefreshToken } from "../domain/refresh-token.entity";
import { RefreshTokenRepositoryPort } from "../domain/refresh-token-repository.port";

/**
 * Shared by LoginUseCase and RefreshTokenUseCase — both need to mint a new
 * refresh token row (generate raw token, hash it, persist, return the raw
 * token to hand to the client) the exact same way. Factored out instead of
 * duplicated so the "never store the raw token" invariant lives in one
 * place.
 */
export async function issueRefreshToken(
  userId: string,
  refreshTokenRepository: RefreshTokenRepositoryPort,
  expiresInDays: number,
): Promise<string> {
  const rawToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const refreshToken = new RefreshToken(
    randomUUID(),
    userId,
    hashToken(rawToken),
    expiresAt,
    null,
    new Date(),
  );

  await refreshTokenRepository.save(refreshToken);

  return rawToken;
}
