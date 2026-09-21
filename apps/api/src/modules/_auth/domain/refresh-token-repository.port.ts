import { RefreshToken } from "./refresh-token.entity";

/**
 * Port (in the hexagonal sense): a contract the application layer depends
 * on, implemented by an infrastructure adapter — mirrors UserRepositoryPort's
 * shape (modules/user/domain/user-repository.port.ts).
 *
 * findByTokenHash() deliberately returns the row regardless of its
 * revoked/expired status (not just "valid" ones) — RefreshTokenUseCase needs
 * to distinguish "not found" from "found but revoked" (reuse/theft signal)
 * from "found but naturally expired" (not a signal), and that branching
 * belongs in the use case, not hidden behind a repository that silently
 * treats all three as "not found".
 */
export interface RefreshTokenRepositoryPort {
  save(refreshToken: RefreshToken): Promise<RefreshToken>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}

export const REFRESH_TOKEN_REPOSITORY_PORT = Symbol(
  "REFRESH_TOKEN_REPOSITORY_PORT",
);
