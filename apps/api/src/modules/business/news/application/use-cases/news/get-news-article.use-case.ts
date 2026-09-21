import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { NewsArticle as PublicNewsArticle } from "@xarvis/shared";
import {
  NEWS_ARTICLE_REPOSITORY_PORT,
  NewsArticleRepositoryPort,
} from "../../../domain/news-article-repository.port";
import { toPublicNewsArticle } from "../../to-public-news-article";

@Injectable()
export class GetNewsArticleUseCase {
  constructor(
    @Inject(NEWS_ARTICLE_REPOSITORY_PORT)
    private readonly newsArticleRepository: NewsArticleRepositoryPort,
  ) {}

  async execute(id: string): Promise<PublicNewsArticle> {
    const article = await this.newsArticleRepository.findById(id);
    if (!article) {
      throw new NotFoundException(`News article with id "${id}" not found`);
    }

    return toPublicNewsArticle(article);
  }
}
