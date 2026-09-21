# Agent instructions

Conventions and gotchas for anyone (human or AI) working in `apps/api`. Read this before adding a feature — the patterns here are deliberate, not accidental.

## Architecture: Hexagonal, per module

Every feature module follows the same internal shape:

```
modules/<module>/
  domain/            entities, repository port interfaces — zero framework imports
  application/
    use-cases/        one class per use case (or per-subgroup subfolder if the
                       module has multiple concerns, e.g. news/application/use-cases/{category,news}/)
    to-public-*.ts     sanitizing mappers (see below) — NOT use cases, stay directly in application/
  infrastructure/
    http/              controllers + DTOs (createZodDto wrapping a shared Zod schema)
    persistence/        Drizzle repository adapters implementing the domain ports
    clients/             adapters for external third-party APIs (e.g. Dev.to)
  <module>.module.ts    Nest wiring: binds each port token to its concrete adapter
```

Domain and application layers know nothing about HTTP, Express, or Drizzle. Only `infrastructure/` touches those.

### Where modules live

- `modules/user/`, `modules/_auth/`, `modules/_health/` are at the modules root — deliberately, not moved into `business/`.
- `modules/business/<feature>/` is where business-domain feature modules go (e.g. `modules/business/news/`). Put new business features here.

## The sanitization rule (non-negotiable)

A domain entity can carry fields that must never leave the server (`User.passwordHash` is the clearest example). Every use case that returns an entity to a controller maps it through a `toPublicX()` function first (`toPublicUser`, `toPublicCategory`, `toPublicNewsArticle`) — this is the single point where "what the client is allowed to see" is decided. There is no interceptor stripping fields as a substitute; don't add one instead of doing this at the source, and don't skip it because an entity "looks safe today."

## HTTP conventions

- **Response envelope**: every response is wrapped globally (`ResponseInterceptor` + `HttpExceptionFilter`, registered as `APP_INTERCEPTOR`/`APP_FILTER`) as `{data, status, responseTime, message}` on success or `{errors, status, responseTime, message}` on error. Don't wrap responses manually in a controller.
- **`@ResponseMessage("...")`**: sets the envelope's `message` for a route. Add one per route; it falls back to the generic HTTP status text if omitted.
- **DELETE returns 200, never 204**: a 204 must have no body by spec, but the envelope always needs one. `DELETE` routes use `@HttpCode(200)` and return `null` data.
- **Every `:id` route param uses `ParseUUIDPipe`**: `@Param("id", ParseUUIDPipe) id: string`. Skipping this once caused a real 500 — an invalid UUID reaching a `uuid`-typed Postgres column throws a raw driver error instead of a clean 400.
- **Route ordering**: a literal sub-path (`/categories/me/preferences`, `/news/for-me`, `/news/sync/dev-to`) must be declared in the controller BEFORE the `:id` route, or Nest matches it as the id param.
- **Auth**: `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` per protected route (no global guard — some routes are intentionally public: registration, login/refresh/logout, health check). Decide per module/route whether auth is required; there's no single blanket rule across the whole API.
- **Rate limiting**: global default is 100 req/min/IP (`ThrottlerGuard` as `APP_GUARD`). Override per-route with `@Throttle({ default: { limit, ttl } })` where it matters (e.g. `/auth/login` is 5/min to slow down password brute-forcing).

## Auth model

- Access tokens: JWT, 15 min (`JWT_EXPIRES_IN`), short-lived on purpose.
- Refresh tokens: DB-backed, rotating, hashed at rest (SHA-256, never stored/logged raw). Chosen over stateless refresh JWTs because the primary client is mobile — long-lived tokens on a device you don't control need per-token revocation and theft detection, not just an expiry.
- Reusing an already-revoked refresh token revokes **every** session for that user (`revokeAllForUser`) — this is the theft-detection behavior, not a bug.
- Passwords: argon2 (not bcrypt).
- `POST /auth/dev-login`: local-dev-only shortcut, mints a token pair for a fixed user without a password. Gated on `NODE_ENV !== "production"` in **two** places (controller and use case) — neither trusts the other alone. Don't remove either check "because the other one already covers it."

## Environment variables

Defined and validated in `apps/api/src/infrastructure/config/env.schema.ts` (Zod — the app refuses to boot on an invalid/missing var, with a clear error naming which one). `JWT_SECRET` has no default; everything else does. See `apps/api/.env.example`.

**Claude Code cannot read/write `.env`/`.env.*` files in this repo (blocked by permission settings)** — if you're an AI agent and need the user to add/change an env var, tell them the exact lines to paste, don't try to work around the block.

## Known gotchas

- **`libraries/shared` needs a manual rebuild after schema changes**: `pnpm --filter @xarvis/shared build`. The API's `tsc --watch` does not rebuild the shared package's `dist/` automatically, and you'll get a stale-type/missing-export error until you do.
- **Don't run `pnpm install` on the host while the dev container is running.** The dev container (`Dockerfile.dev`) bind-mounts the whole repo, so host and container share the same `node_modules`. Host (glibc) and container (Alpine/musl) installing at the same time can race and briefly corrupt each other's view of `node_modules`. If you need to reinstall while the container is up, run it inside the container: `podman exec <container> pnpm install`.
- **Migrations in production run via `drizzle-orm`'s own `migrate()`, not `drizzle-kit`.** `drizzle-kit` is a dev-only CLI and isn't in the production `node_modules`. `apps/api/src/infrastructure/database/migrate.ts` is a small standalone script run before `node dist/main.js` in the production container's `CMD`.
