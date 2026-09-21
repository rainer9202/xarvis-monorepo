import type { NewsArticle as PublicNewsArticle } from "@xarvis/shared";
import { NewsArticle } from "../domain/news-article.entity";

/**
 * Maps the domain entity to the public/response shape (matches the shared
 * NewsArticleSchema).
 */
export function toPublicNewsArticle(article: NewsArticle): PublicNewsArticle {
  return {
    id: article.id,
    title: article.title,
    url: article.url,
    description: article.description,
    imageUrl: article.imageUrl,
    source: article.source,
    categoryId: article.categoryId,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
  };
}
