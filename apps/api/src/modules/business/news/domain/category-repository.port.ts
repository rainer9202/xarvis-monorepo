import { Category } from "./category.entity";

/**
 * Port (in the hexagonal sense): a contract the application layer depends
 * on, implemented by an infrastructure adapter. The domain/application
 * layers know nothing about how persistence actually happens.
 */
export interface CategoryRepositoryPort {
  save(category: Category): Promise<Category>;
  findAll(filters?: { type?: string }): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  update(
    id: string,
    changes: Partial<{ name: string; type: string }>,
  ): Promise<Category | null>;
  delete(id: string): Promise<boolean>;
}

export const CATEGORY_REPOSITORY_PORT = Symbol("CATEGORY_REPOSITORY_PORT");
