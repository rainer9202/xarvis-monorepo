import type { User as PublicUser } from "@xarvis/shared";
import { User } from "../domain/user.entity";

/**
 * Strips the domain entity down to the public shape (matches the shared
 * UserSchema: {id, email, name}) before it ever reaches a controller.
 *
 * Every use case that returns a User to the HTTP layer (create, get, list,
 * update) MUST route through this — passwordHash must never appear in an
 * HTTP response. Don't rely on "the entity happens to look right" or on
 * some interceptor stripping fields later; there is no such interceptor,
 * and there shouldn't be one substituting for sanitizing at the source.
 */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
