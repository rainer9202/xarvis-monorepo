import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import {
  DATABASE_CONNECTION,
  type DrizzleDatabase,
} from "../../../../../infrastructure/database/client";
import { categoriesTable } from "../../../../../infrastructure/database/schema";
import { Category } from "../../domain/category.entity";
import { CategoryRepositoryPort } from "../../domain/category-repository.port";

/**
 * Adapter implementing CategoryRepositoryPort against a real Postgres table
 * via Drizzle. Domain/application layers only ever see
 * CategoryRepositoryPort — Drizzle, pg, and the schema module are confined
 * to this file.
 */
@Injectable()
export class DrizzleCategoryRepository implements CategoryRepositoryPort {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async save(category: Category): Promise<Category> {
    const [row] = await this.db
      .insert(categoriesTable)
      .values({
        id: category.id,
        name: category.name,
        type: category.type,
      })
      .returning();

    return new Category(row.id, row.name, row.type);
  }

  async findAll(filters?: { type?: string }): Promise<Category[]> {
    const query = this.db.select().from(categoriesTable);
    const rows = filters?.type
      ? await query.where(eq(categoriesTable.type, filters.type))
      : await query;

    return rows.map((row) => new Category(row.id, row.name, row.type));
  }

  async findById(id: string): Promise<Category | null> {
    const [row] = await this.db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return new Category(row.id, row.name, row.type);
  }

  async findByName(name: string): Promise<Category | null> {
    const [row] = await this.db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.name, name))
      .limit(1);

    if (!row) {
      return null;
    }

    return new Category(row.id, row.name, row.type);
  }

  async update(
    id: string,
    changes: Partial<{ name: string; type: string }>,
  ): Promise<Category | null> {
    const [row] = await this.db
      .update(categoriesTable)
      .set(changes)
      .where(eq(categoriesTable.id, id))
      .returning();

    if (!row) {
      return null;
    }

    return new Category(row.id, row.name, row.type);
  }

  async delete(id: string): Promise<boolean> {
    const deletedRows = await this.db
      .delete(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .returning();

    return deletedRows.length > 0;
  }
}
