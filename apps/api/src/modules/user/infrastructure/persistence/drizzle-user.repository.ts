import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import {
  DATABASE_CONNECTION,
  type DrizzleDatabase,
} from "../../../../infrastructure/database/client";
import { usersTable } from "../../../../infrastructure/database/schema";
import { User } from "../../domain/user.entity";
import { UserRepositoryPort } from "../../domain/user-repository.port";

/**
 * Adapter implementing UserRepositoryPort against a real Postgres table via
 * Drizzle. Domain/application layers only ever see UserRepositoryPort —
 * Drizzle, pg, and the schema module are confined to this file.
 */
@Injectable()
export class DrizzleUserRepository implements UserRepositoryPort {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async save(user: User): Promise<User> {
    const [row] = await this.db
      .insert(usersTable)
      .values({
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
      })
      .returning();

    return new User(row.id, row.email, row.name, row.passwordHash);
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!row) {
      return null;
    }

    return new User(row.id, row.email, row.name, row.passwordHash);
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return new User(row.id, row.email, row.name, row.passwordHash);
  }

  async findAll(): Promise<User[]> {
    const rows = await this.db.select().from(usersTable);
    return rows.map(
      (row) => new User(row.id, row.email, row.name, row.passwordHash),
    );
  }

  async update(
    id: string,
    changes: Partial<{ email: string; name: string; passwordHash: string }>,
  ): Promise<User | null> {
    const [row] = await this.db
      .update(usersTable)
      .set(changes)
      .where(eq(usersTable.id, id))
      .returning();

    if (!row) {
      return null;
    }

    return new User(row.id, row.email, row.name, row.passwordHash);
  }

  async delete(id: string): Promise<boolean> {
    const deletedRows = await this.db
      .delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning();

    return deletedRows.length > 0;
  }
}
