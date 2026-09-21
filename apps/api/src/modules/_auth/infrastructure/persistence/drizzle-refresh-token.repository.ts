import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";
import {
  DATABASE_CONNECTION,
  type DrizzleDatabase,
} from "../../../../infrastructure/database/client";
import { refreshTokensTable } from "../../../../infrastructure/database/schema";
import { RefreshToken } from "../../domain/refresh-token.entity";
import { RefreshTokenRepositoryPort } from "../../domain/refresh-token-repository.port";

/**
 * Adapter implementing RefreshTokenRepositoryPort against a real Postgres
 * table via Drizzle — mirrors DrizzleUserRepository's shape
 * (modules/user/infrastructure/persistence/drizzle-user.repository.ts).
 */
@Injectable()
export class DrizzleRefreshTokenRepository
  implements RefreshTokenRepositoryPort
{
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  private toDomain(row: typeof refreshTokensTable.$inferSelect): RefreshToken {
    return new RefreshToken(
      row.id,
      row.userId,
      row.tokenHash,
      row.expiresAt,
      row.revokedAt,
      row.createdAt,
    );
  }

  async save(refreshToken: RefreshToken): Promise<RefreshToken> {
    const [row] = await this.db
      .insert(refreshTokensTable)
      .values({
        id: refreshToken.id,
        userId: refreshToken.userId,
        tokenHash: refreshToken.tokenHash,
        expiresAt: refreshToken.expiresAt,
        revokedAt: refreshToken.revokedAt,
        createdAt: refreshToken.createdAt,
      })
      .returning();

    return this.toDomain(row);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const [row] = await this.db
      .select()
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.tokenHash, tokenHash))
      .limit(1);

    if (!row) {
      return null;
    }

    return this.toDomain(row);
  }

  async revoke(id: string): Promise<void> {
    await this.db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.id, id));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokensTable.userId, userId),
          isNull(refreshTokensTable.revokedAt),
        ),
      );
  }
}
