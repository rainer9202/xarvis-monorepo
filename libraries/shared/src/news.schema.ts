import { z } from "zod";

/**
 * Read/response shape for a category. Categories are reference data
 * (javascript/webdev/devops/world/science/business, "dev" | "general")
 * managed via full CRUD by CategoriesController.
 */
export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
});

export type Category = z.infer<typeof CategorySchema>;

/**
 * "dev" | "general" grouping — kept as a Zod enum at the validation layer
 * even though the DB column is plain text (see schema.ts comment: no
 * Postgres enum, so new groupings later don't need a migration).
 */
export const CreateCategorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["dev", "general"]),
});

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;

/**
 * Read/response shape for a news article. NewsController is read-only —
 * ingestion (Dev.to/HN/RSS) is a separate future task, so there is no
 * corresponding Create/Update schema here.
 */
export const NewsArticleSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  url: z.string().url(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  source: z.string(),
  categoryId: z.string().uuid().nullable(),
  publishedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export type NewsArticle = z.infer<typeof NewsArticleSchema>;

/**
 * Request body for PUT /categories/me/preferences — replaces the current
 * user's full set of preferred categories (replace-all semantics, not a
 * merge/append).
 */
export const SetCategoryPreferencesSchema = z.object({
  categoryIds: z.array(z.string().uuid()),
});

export type SetCategoryPreferencesDto = z.infer<
  typeof SetCategoryPreferencesSchema
>;
