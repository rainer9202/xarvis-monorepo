import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  DATABASE_CONNECTION,
  type DrizzleDatabase,
} from "../../../../../infrastructure/database/client";
import { newsArticlesTable } from "../../../../../infrastructure/database/schema";
import { NewsArticle } from "../../domain/news-article.entity";
import { NewsArticleRepositoryPort } from "../../domain/news-article-repository.port";

type NewsArticleRow = typeof newsArticlesTable.$inferSelect;

function toEntity(row: NewsArticleRow): NewsArticle {
  return new NewsArticle(
    row.id,
    row.title,
    row.url,
    row.description,
    row.imageUrl,
    row.source,
    row.categoryId,
    row.publishedAt,
    row.createdAt,
  );
}

/**
 * Adapter implementing NewsArticleRepositoryPort against a real Postgres
 * table via Drizzle.
 */
@Injectable()
export class DrizzleNewsArticleRepository implements NewsArticleRepositoryPort {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async save(article: NewsArticle): Promise<NewsArticle> {
    const [row] = await this.db
      .insert(newsArticlesTable)
      .values({
        id: article.id,
        title: article.title,
        url: article.url,
        description: article.description,
        imageUrl: article.imageUrl,
        source: article.source,
        categoryId: article.categoryId,
        publishedAt: article.publishedAt,
      })
      .returning();

    return toEntity(row);
  }

  async findAll(filters: {
    categoryId?: string;
    source?: string;
    limit: number;
    offset: number;
  }): Promise<NewsArticle[]> {
    const conditions = [
      filters.categoryId
        ? eq(newsArticlesTable.categoryId, filters.categoryId)
        : undefined,
      filters.source ? eq(newsArticlesTable.source, filters.source) : undefined,
    ].filter((condition): condition is NonNullable<typeof condition> =>
      Boolean(condition),
    );

    const rows = await this.db
      .select()
      .from(newsArticlesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(newsArticlesTable.publishedAt))
      .limit(filters.limit)
      .offset(filters.offset);

    return rows.map(toEntity);
  }

  async findById(id: string): Promise<NewsArticle | null> {
    const [row] = await this.db
      .select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return toEntity(row);
  }

  async findByUrl(url: string): Promise<NewsArticle | null> {
    const [row] = await this.db
      .select()
      .from(newsArticlesTable)
      .where(eq(newsArticlesTable.url, url))
      .limit(1);

    if (!row) {
      return null;
    }

    return toEntity(row);
  }

  async findAllForCategories(
    categoryIds: string[],
    limit: number,
    offset: number,
  ): Promise<NewsArticle[]> {
    if (categoryIds.length === 0) {
      return [];
    }

    const rows = await this.db
      .select()
      .from(newsArticlesTable)
      .where(inArray(newsArticlesTable.categoryId, categoryIds))
      .orderBy(desc(newsArticlesTable.publishedAt))
      .limit(limit)
      .offset(offset);

    return rows.map(toEntity);
  }
}
