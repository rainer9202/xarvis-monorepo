import { createHash, randomBytes } from "node:crypto";

/**
 * Thin wrapper around node:crypto, mirroring password.ts's style — a
 * stateless utility, not a port/adapter abstraction.
 *
 * Deliberately NOT argon2 (see password.ts for that pattern): refresh tokens
 * are checked on every refresh call a client makes, and argon2's whole point
 * is to be slow to defend a low-entropy secret (a human password) against
 * offline brute force. A refresh token is already a 512-bit random value —
 * there's nothing to brute force — so this is an exact-match DB lookup on a
 * fast, deterministic hash instead.
 */
export function generateRefreshToken(): string {
  return randomBytes(64).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
