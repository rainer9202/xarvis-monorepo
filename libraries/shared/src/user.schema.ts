import { z } from "zod";

/**
 * Shared Zod schema for creating a user.
 * Used both by the NestJS API (via nestjs-zod) and, later, by the
 * Astro frontend for form validation — the same schema, no duplication.
 */
export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  password: z.string().min(8),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

/**
 * Partial version of CreateUserSchema for PATCH updates — email/name are
 * both optional, but keep the same validation rules when present.
 */
export const UpdateUserSchema = CreateUserSchema.partial();

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

/**
 * Read-model shape used for GET/list responses and Swagger response typing.
 * Mirrors the User domain entity's public shape (id, email, name).
 *
 * Deliberately NOT derived from CreateUserSchema.extend(...) — CreateUserSchema
 * carries `password`, and extending it would leak that field into every
 * response type. This schema is defined independently so it can never pick
 * up a sensitive field added to CreateUserSchema in the future.
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(120),
});

export type User = z.infer<typeof UserSchema>;
