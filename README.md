# xarvis-monorepo

pnpm/Turborepo monorepo. Backend API in NestJS (Hexagonal Architecture), shared Zod contracts, Postgres via Drizzle ORM. Primary API consumer is a mobile app.

## Stack

- **Runtime**: Node 24
- **Package manager**: pnpm (workspaces) + Turborepo
- **API**: NestJS 11, Hexagonal Architecture
- **Database**: PostgreSQL via Drizzle ORM
- **Validation**: Zod, via `nestjs-zod`
- **Auth**: JWT access tokens + rotating, DB-backed refresh tokens (argon2 password hashing)
- **Docs**: Swagger/OpenAPI at `/api/docs`

## Structure

```
apps/
  api/                 NestJS API
libraries/
  shared/              Zod schemas & DTOs shared between apps (e.g. a future Astro frontend)
```

See [AGENTS.md](./AGENTS.md) for the architecture conventions used inside `apps/api`.

## Prerequisites

- Node 24, pnpm 10
- A running Postgres instance
- Docker/Podman (for the provided dev/prod containers — optional, you can also run directly on the host)

## Getting started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the env example and fill in real values:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

   `DATABASE_URL` must point at a real Postgres database. `JWT_SECRET` has no default — generate one:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Run migrations:

   ```bash
   pnpm --filter api db:migrate
   ```

4. Start the API in watch mode:

   ```bash
   pnpm --filter api start:dev
   ```

5. Open Swagger at `http://localhost:3000/api/docs`.

   In development, `POST /auth/dev-login` mints a valid token pair for a fixed local user without needing to register/log in first — paste the returned `accessToken` into Swagger's "Authorize" button. This endpoint 403s outside `NODE_ENV=development`.

## Common scripts

Run from the repo root (Turborepo fans these out to every package that defines them):

- `pnpm build` — build all packages
- `pnpm dev` — run all packages in watch mode
- `pnpm lint` — lint all packages

Per-package (`apps/api`):

- `pnpm --filter api db:generate` — generate a Drizzle migration from schema changes
- `pnpm --filter api db:migrate` — apply pending migrations

## Docker

- `apps/api/Dockerfile` — production image. Build context must be the **repo root** (it needs `libraries/shared`). Runs migrations before booting the app. Intended for Dokploy (Docker Context Path `.`, Dockerfile Path `apps/api/Dockerfile`).
- `apps/api/Dockerfile.dev` — development image with hot reload via a bind-mounted repo. See the comments at the top of the file for the run command.

## CI

`.github/workflows/ci.yml` installs dependencies and runs the build on every push to `main` and on pull requests.
