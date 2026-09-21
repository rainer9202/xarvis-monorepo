import { Inject, Injectable } from "@nestjs/common";
import type { NewsArticle as PublicNewsArticle } from "@xarvis/shared";
import {
  NEWS_ARTICLE_REPOSITORY_PORT,
  NewsArticleRepositoryPort,
} from "../../../domain/news-article-repository.port";
import {
  USER_CATEGORY_PREFERENCE_REPOSITORY_PORT,
  UserCategoryPreferenceRepositoryPort,
} from "../../../domain/user-category-preference-repository.port";
import { toPublicNewsArticle } from "../../to-public-news-article";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Looks up the current user's preferred category ids, then returns news
 * articles restricted to those categories. If the user has zero
 * preferences, returns an empty list (not an error) — the controller
 * attaches a clear @ResponseMessage for that case.
 */
@Injectable()
export class ListNewsForUserUseCase {
  constructor(
    @Inject(USER_CATEGORY_PREFERENCE_REPOSITORY_PORT)
    private readonly preferenceRepository: UserCategoryPreferenceRepositoryPort,
    @Inject(NEWS_ARTICLE_REPOSITORY_PORT)
    private readonly newsArticleRepository: NewsArticleRepositoryPort,
  ) {}

  async execute(
    userId: string,
    pagination: { limit?: number; offset?: number },
  ): Promise<PublicNewsArticle[]> {
    const categoryIds =
      await this.preferenceRepository.findCategoryIdsForUser(userId);

    const limit = Math.min(pagination.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = pagination.offset ?? 0;

    const articles = await this.newsArticleRepository.findAllForCategories(
      categoryIds,
      limit,
      offset,
    );

    return articles.map(toPublicNewsArticle);
  }
}
