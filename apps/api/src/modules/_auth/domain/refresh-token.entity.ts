/**
 * Domain entity. No framework dependencies, no decorators, no I/O — plain
 * TypeScript that expresses the business concept, mirroring the `User`
 * entity's style (modules/user/domain/user.entity.ts).
 *
 * `tokenHash` is the SHA-256 digest of the raw token, never the raw token
 * itself — the raw token exists only transiently in memory between
 * generation and being handed to the client (see
 * infrastructure/auth/refresh-token.ts).
 */
export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    public readonly revokedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  get isExpired(): boolean {
    return this.expiresAt.getTime() <= Date.now();
  }

  get isRevoked(): boolean {
    return this.revokedAt !== null;
  }
}
