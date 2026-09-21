import * as argon2 from "argon2";

/**
 * Thin wrapper around argon2 — a stateless utility, not a port/adapter
 * abstraction. This app isn't going to swap hashing libraries, so there's
 * no interface to satisfy; CreateUserUseCase, UpdateUserUseCase, and
 * LoginUseCase call these functions directly.
 */
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return argon2.verify(hash, plain);
}
