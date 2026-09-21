import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Drizzle table schema(s) for shared DB infrastructure. This file lives
 * under infrastructure/database/ (not inside modules/user/) because the
 * Postgres connection/schema is shared plumbing, not something owned by a
 * single feature module.
 *
 * Column choices mirror the `User` domain entity (src/modules/user/domain/
 * user.entity.ts) exactly: id, email, name — no extra fields were invented.
 * - id: uuid primary key, DB-generated default so callers that already pass
 *   an id (the use case generates one via randomUUID()) still work, and
 *   direct inserts without one still get a valid id.
 * - email: text, unique — the create-user use case enforces "no duplicate
 *   email" at the application layer; the DB constraint backs that
 *   invariant instead of relying on application logic alone.
 * - name: text, not null — matches the required `name: string` field.
 * - password_hash: text, not null — argon2 hash of the user's password.
 *   Never exposed over HTTP; only read/written by the persistence layer
 *   and the application-layer use cases that legitimately need it
 *   (CreateUserUseCase, UpdateUserUseCase, LoginUseCase).
 */
export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
});

/**
 * Rotating, DB-backed refresh tokens for the mobile client. See
 * modules/_auth for the full rotation/reuse-detection flow; this table only
 * stores what's needed to look a token up and revoke it.
 *
 * - id: uuid PK, DB-generated default — same convention as usersTable.
 * - userId: FK to usersTable.id, `onDelete: "cascade"` so deleting a user
 *   cleans up their refresh tokens automatically instead of leaving orphans.
 * - tokenHash: SHA-256 hex digest of the raw token (see
 *   infrastructure/auth/refresh-token.ts) — never the raw token itself. This
 *   is the lookup key on every refresh call, hence the index below.
 * - expiresAt: absolute expiry, computed at issue time from
 *   REFRESH_TOKEN_EXPIRES_IN_DAYS.
 * - revokedAt: null while active; set once the token is rotated away,
 *   logged out, or nuked by reuse-detection. Nullable, not a boolean, so we
 *   keep the timestamp of when revocation happened.
 * - createdAt: not null, defaults to now() at insert time.
 */
export const refreshTokensTable = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("refresh_tokens_token_hash_idx").on(table.tokenHash)],
);

/**
 * Reference data for news categories/tags (e.g. "javascript", "world"). A
 * table rather than a Postgres enum or hardcoded list, deliberately — new
 * categories get added as data (an insert), not as a schema migration.
 *
 * - name: text, unique — e.g. "javascript", "world-news".
 * - type: text, "dev" | "general" — lets the API/UI group categories by
 *   the two news "worlds" this product cares about, without a Postgres enum
 *   (kept as plain text so adding a third grouping later needs no migration
 *   either).
 */
export const categoriesTable = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(),
});

/**
 * Ingested news articles, from whichever source fetched them (Dev.to,
 * Hacker News, RSS feeds, ...).
 *
 * - url: text, unique — the natural dedup key: re-ingesting the same feed
 *   twice must not create duplicate rows.
 * - description/imageUrl: nullable — not every source provides these.
 * - source: text — which fetcher produced this row (e.g. "dev.to",
 *   "hacker-news", "the-conversation", "404-media", "google-news"), for
 *   debugging/filtering by origin later.
 * - categoryId: nullable FK, `onDelete: "set null"` — deleting a category
 *   must not delete historical articles, it should just untag them.
 * - publishedAt: the source's own publish timestamp (not ingestion time).
 * - createdAt: when THIS system ingested the row — kept separate from
 *   publishedAt since a feed can be fetched well after an article's
 *   original publish date.
 * - composite index on (categoryId, publishedAt): the expected hot query is
 *   "latest articles in category X".
 */
export const newsArticlesTable = pgTable(
  "news_articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    url: text("url").notNull().unique(),
    description: text("description"),
    imageUrl: text("image_url"),
    source: text("source").notNull(),
    categoryId: uuid("category_id").references(() => categoriesTable.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("news_articles_category_published_idx").on(
      table.categoryId,
      table.publishedAt,
    ),
  ],
);

/**
 * Pure join table: which categories a user wants to see news for. No
 * surrogate `id` — the composite primary key on (userId, categoryId) both
 * identifies the row and prevents duplicate preferences for the same pair.
 * Both FKs cascade-delete: removing a user or a category cleans up
 * preferences referencing it automatically.
 */
export const userCategoryPreferencesTable = pgTable(
  "user_category_preferences",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categoriesTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.categoryId] }),
  ],
);
