import { Injectable } from "@nestjs/common";

const DEV_TO_API_BASE_URL = "https://dev.to/api/articles";

/**
 * Raw shape returned by Dev.to's public articles API
 * (GET https://dev.to/api/articles), based on a live response observed for
 * `?tag=javascript&per_page=3`. Only the fields this client actually reads
 * are declared — Dev.to returns many more (user, tag_list, comments_count,
 * etc.) that we don't need here.
 *
 * Quirks observed live:
 * - `url` is Dev.to's own permalink for the post; `canonical_url` is the
 *   article's original source (often identical to `url` for posts written
 *   natively on Dev.to, but points elsewhere for cross-posted content). We
 *   treat `canonical_url` as THE canonical article URL per product intent.
 * - `cover_image` is frequently `null` (not every author sets one).
 *   `social_image` is Dev.to's own auto-generated fallback image and was
 *   populated on every article observed, even when `cover_image` was null —
 *   so it's a reasonable fallback for a display image.
 * - `description` can be `null` in principle even though every sampled
 *   article had one; typed as nullable to be safe.
 * - Both `published_at` and `published_timestamp` are ISO-8601 strings and
 *   were identical in every sample; `published_at` is used.
 */
export interface RawDevToArticle {
  id: number;
  title: string;
  description: string | null;
  url: string;
  canonical_url: string;
  cover_image: string | null;
  social_image: string | null;
  published_at: string;
}

/**
 * Normalized article shape this client hands back to callers. Field
 * renaming to our own domain vocabulary (NewsArticle) happens in the use
 * case, not here — this is just an honest, typed parse of Dev.to's payload.
 */
export interface DevToArticle {
  title: string;
  canonicalUrl: string;
  description: string | null;
  imageUrl: string | null;
  publishedAt: Date;
}

function toDevToArticle(raw: RawDevToArticle): DevToArticle {
  return {
    title: raw.title,
    canonicalUrl: raw.canonical_url,
    description: raw.description,
    imageUrl: raw.cover_image ?? raw.social_image ?? null,
    publishedAt: new Date(raw.published_at),
  };
}

/**
 * Thin HTTP client for Dev.to's public articles API. No auth required. Uses
 * Node's native global `fetch` (Node 24) — no HTTP client dependency.
 */
@Injectable()
export class DevToClient {
  async fetchByTag(tag: string, perPage = 20): Promise<DevToArticle[]> {
    const url = `${DEV_TO_API_BASE_URL}?tag=${encodeURIComponent(tag)}&per_page=${perPage}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Dev.to API request failed for tag "${tag}": ${response.status} ${response.statusText}`,
      );
    }

    const rawArticles = (await response.json()) as RawDevToArticle[];
    return rawArticles.map(toDevToArticle);
  }
}
