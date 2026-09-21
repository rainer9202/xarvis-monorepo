import { Inject, Injectable } from "@nestjs/common";
import type { NewsArticle as PublicNewsArticle } from "@xarvis/shared";
import {
  NEWS_ARTICLE_REPOSITORY_PORT,
  NewsArticleRepositoryPort,
} from "../../../domain/news-article-repository.port";
import { toPublicNewsArticle } from "../../to-public-news-article";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class ListNewsArticlesUseCase {
  constructor(
    @Inject(NEWS_ARTICLE_REPOSITORY_PORT)
    private readonly newsArticleRepository: NewsArticleRepositoryPort,
  ) {}

  async execute(filters: {
    categoryId?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }): Promise<PublicNewsArticle[]> {
    const limit = Math.min(filters.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = filters.offset ?? 0;

    const articles = await this.newsArticleRepository.findAll({
      categoryId: filters.categoryId,
      source: filters.source,
      limit,
      offset,
    });

    return articles.map(toPublicNewsArticle);
  }
}
