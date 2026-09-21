import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import {
  DATABASE_CONNECTION,
  type DrizzleDatabase,
} from "../../../../../infrastructure/database/client";
import { userCategoryPreferencesTable } from "../../../../../infrastructure/database/schema";
import { UserCategoryPreferenceRepositoryPort } from "../../domain/user-category-preference-repository.port";

/**
 * Adapter implementing UserCategoryPreferenceRepositoryPort against a real
 * Postgres table via Drizzle.
 */
@Injectable()
export class DrizzleUserCategoryPreferenceRepository
  implements UserCategoryPreferenceRepositoryPort
{
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async findCategoryIdsForUser(userId: string): Promise<string[]> {
    const rows = await this.db
      .select()
      .from(userCategoryPreferencesTable)
      .where(eq(userCategoryPreferencesTable.userId, userId));

    return rows.map((row) => row.categoryId);
  }

  /**
   * Replace-all semantics: delete-then-insert in sequence. A wrapping
   * transaction would be a nice-to-have, but the node-postgres driver setup
   * here doesn't require one for correctness of this specific operation —
   * a failure between delete and insert just leaves the user with no
   * preferences, which is a safe (not corrupt) state to retry from.
   */
  async setForUser(userId: string, categoryIds: string[]): Promise<void> {
    await this.db
      .delete(userCategoryPreferencesTable)
      .where(eq(userCategoryPreferencesTable.userId, userId));

    if (categoryIds.length === 0) {
      return;
    }

    await this.db.insert(userCategoryPreferencesTable).values(
      categoryIds.map((categoryId) => ({
        userId,
        categoryId,
      })),
    );
  }
}
