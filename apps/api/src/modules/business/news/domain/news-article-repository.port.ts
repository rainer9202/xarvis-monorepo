import { NewsArticle } from "./news-article.entity";

/**
 * Port (in the hexagonal sense): a contract the application layer depends
 * on, implemented by an infrastructure adapter. The domain/application
 * layers know nothing about how persistence actually happens.
 *
 * Read-only on purpose: there is no ingestion job yet (fetching from
 * Dev.to/HN/RSS is a separate future task), so this port intentionally has
 * no save/update/delete — don't add persistence methods with nothing to
 * call them.
 */
export interface NewsArticleRepositoryPort {
  findAll(filters: {
    categoryId?: string;
    source?: string;
    limit: number;
    offset: number;
  }): Promise<NewsArticle[]>;
  findById(id: string): Promise<NewsArticle | null>;
  findByUrl(url: string): Promise<NewsArticle | null>;
  /**
   * Used by "news filtered by my preferences". If categoryIds is empty,
   * callers must get back an empty result, not "all articles" — an empty
   * preference set means the user hasn't picked anything yet.
   */
  findAllForCategories(
    categoryIds: string[],
    limit: number,
    offset: number,
  ): Promise<NewsArticle[]>;
}

export const NEWS_ARTICLE_REPOSITORY_PORT = Symbol(
  "NEWS_ARTICLE_REPOSITORY_PORT",
);
