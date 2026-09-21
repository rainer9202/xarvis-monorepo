import { z } from "zod";
import { UserSchema } from "./user.schema";

/**
 * Shared Zod schema for the login request. Same email/password validation
 * shape as CreateUserSchema (libraries/shared/src/user.schema.ts) — login
 * doesn't need `name`, so this isn't derived from CreateUserSchema.
 */
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginDto = z.infer<typeof LoginSchema>;

/**
 * Response shape for a successful login/refresh: a signed access JWT, a raw
 * refresh token (opaque high-entropy string, not a JWT — see
 * infrastructure/auth/refresh-token.ts), plus the public user shape (never
 * the password hash — UserSchema already excludes it).
 */
export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: UserSchema,
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

/**
 * Request body shape shared by both POST /auth/refresh and POST /auth/logout
 * — both take just the raw refresh token from the client.
 */
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenRequestDto = z.infer<typeof RefreshTokenRequestSchema>;
