import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:4321"),
  // No default: a missing/weak JWT secret must fail startup loudly, unlike
  // the dev-friendly defaults above.
  JWT_SECRET: z.string().min(32),
  // Short-lived on purpose now that rotating refresh tokens exist (see
  // REFRESH_TOKEN_EXPIRES_IN_DAYS below) — the access token no longer needs
  // to carry a long session by itself; the refresh flow re-issues it.
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(30),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = EnvSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  return result.data;
}
