# syntax=docker/dockerfile:1
#
# IMPORTANT: build context must be the monorepo ROOT (not apps/api/),
# because this build needs access to libraries/shared and the root
# pnpm-workspace.yaml / pnpm-lock.yaml to resolve the workspace correctly.
#
# Dokploy setup:
#   Docker Context Path: .                     (repo root)
#   Dockerfile Path:     apps/api/Dockerfile
#
# Manual equivalent (run from repo root):
#   docker build -f apps/api/Dockerfile -t xarvis-api .

# ---------------------------------------------------------------------------
# Stage 1: install workspace deps and build shared -> api (dependency order)
# ---------------------------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Copy workspace/package manifests first so `pnpm install` is cached
# independently of application source changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY libraries/shared/package.json libraries/shared/package.json
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --frozen-lockfile

# Now bring in the rest of the source and build in dependency order
# (turbo.json's build pipeline ensures @xarvis/shared builds before api).
COPY libraries/shared libraries/shared
COPY apps/api apps/api

RUN pnpm turbo run build --filter=api...

# Produce a self-contained production deployment of `api`: pnpm deploy
# resolves the workspace:* dependency on @xarvis/shared into a real copy
# and installs only production dependencies. --legacy is required because
# this workspace uses the default (non-injected) node-linker; it still
# produces a correct, isolated node_modules for the deployed package.
RUN pnpm --filter=api deploy --prod --legacy /prod/api

# ---------------------------------------------------------------------------
# Stage 2: minimal runtime image
# ---------------------------------------------------------------------------
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /prod/api ./
# The SQL migration files aren't part of the compiled dist/ output, and
# aren't guaranteed to survive `pnpm deploy`'s own file-inclusion rules —
# copied explicitly so dist/infrastructure/database/migrate.js can always
# find them at ./drizzle relative to the container's cwd.
COPY --from=build /repo/apps/api/drizzle ./drizzle

# Dokploy maps its own external port to this one; main.ts reads PORT and
# falls back to 3000 when it isn't set.
EXPOSE 3000

# Migrations run once at container start, before the app boots — if they
# fail, the container exits non-zero instead of serving against a stale
# schema. See src/infrastructure/database/migrate.ts for why this isn't
# drizzle-kit (dev-only, not in the production node_modules).
CMD ["sh", "-c", "node dist/infrastructure/database/migrate.js && node dist/main.js"]
