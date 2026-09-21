import { Inject, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { NewsArticle } from "../../../domain/news-article.entity";
import {
  NEWS_ARTICLE_REPOSITORY_PORT,
  NewsArticleRepositoryPort,
} from "../../../domain/news-article-repository.port";
import {
  CATEGORY_REPOSITORY_PORT,
  CategoryRepositoryPort,
} from "../../../domain/category-repository.port";
import { DevToClient } from "../../../infrastructure/clients/dev-to.client";

const DEV_TO_SOURCE = "dev.to";
const DEV_CATEGORY_TYPE = "dev";

interface CategorySyncSummary {
  categoryId: string;
  categoryName: string;
  fetched: number;
  saved: number;
  skipped: number;
}

export interface SyncDevToArticlesSummary {
  fetched: number;
  saved: number;
  skipped: number;
  errors: string[];
  perCategory: CategorySyncSummary[];
}

/**
 * Ingests articles from Dev.to into news_articles, one category at a time.
 * Manual trigger only (POST /news/sync/dev-to) — no cron/scheduling yet,
 * that's an intentional, separate future step.
 *
 * Our `dev` categories (javascript/webdev/devops) are literally valid Dev.to
 * tags, so category.name is used directly as the tag to fetch.
 */
@Injectable()
export class SyncDevToArticlesUseCase {
  private readonly logger = new Logger(SyncDevToArticlesUseCase.name);

  constructor(
    private readonly devToClient: DevToClient,
    @Inject(NEWS_ARTICLE_REPOSITORY_PORT)
    private readonly newsArticleRepository: NewsArticleRepositoryPort,
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(): Promise<SyncDevToArticlesSummary> {
    const categories = await this.categoryRepository.findAll({
      type: DEV_CATEGORY_TYPE,
    });

    const perCategory: CategorySyncSummary[] = [];
    const errors: string[] = [];

    for (const category of categories) {
      try {
        const articles = await this.devToClient.fetchByTag(category.name);
        let saved = 0;
        let skipped = 0;

        for (const article of articles) {
          const existing = await this.newsArticleRepository.findByUrl(
            article.canonicalUrl,
          );

          if (existing) {
            skipped += 1;
            continue;
          }

          await this.newsArticleRepository.save(
            new NewsArticle(
              randomUUID(),
              article.title,
              article.canonicalUrl,
              article.description,
              article.imageUrl,
              DEV_TO_SOURCE,
              category.id,
              article.publishedAt,
              new Date(),
            ),
          );
          saved += 1;
        }

        perCategory.push({
          categoryId: category.id,
          categoryName: category.name,
          fetched: articles.length,
          saved,
          skipped,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Dev.to sync failed for category "${category.name}": ${message}`,
        );
        errors.push(`${category.name}: ${message}`);
      }
    }

    return {
      fetched: perCategory.reduce((sum, entry) => sum + entry.fetched, 0),
      saved: perCategory.reduce((sum, entry) => sum + entry.saved, 0),
      skipped: perCategory.reduce((sum, entry) => sum + entry.skipped, 0),
      errors,
      perCategory,
    };
  }
}
