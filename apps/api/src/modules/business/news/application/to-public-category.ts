import type { Category as PublicCategory } from "@xarvis/shared";
import { Category } from "../domain/category.entity";

/**
 * Maps the domain entity to the public/response shape (matches the shared
 * CategorySchema: {id, name, type}). Categories have no sensitive fields,
 * but every use case still routes through an explicit mapper before
 * returning to the HTTP layer, for consistency with the rest of the app
 * (see modules/user/application/to-public-user.ts).
 */
export function toPublicCategory(category: Category): PublicCategory {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
  };
}
