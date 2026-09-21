import { Module } from "@nestjs/common";
import { CreateCategoryUseCase } from "./application/use-cases/category/create-category.use-case";
import { DeleteCategoryUseCase } from "./application/use-cases/category/delete-category.use-case";
import { GetCategoryUseCase } from "./application/use-cases/category/get-category.use-case";
import { GetUserCategoryPreferencesUseCase } from "./application/use-cases/category/get-user-category-preferences.use-case";
import { ListCategoriesUseCase } from "./application/use-cases/category/list-categories.use-case";
import { SetUserCategoryPreferencesUseCase } from "./application/use-cases/category/set-user-category-preferences.use-case";
import { UpdateCategoryUseCase } from "./application/use-cases/category/update-category.use-case";
import { GetNewsArticleUseCase } from "./application/use-cases/news/get-news-article.use-case";
import { ListNewsArticlesUseCase } from "./application/use-cases/news/list-news-articles.use-case";
import { ListNewsForUserUseCase } from "./application/use-cases/news/list-news-for-user.use-case";
import { CATEGORY_REPOSITORY_PORT } from "./domain/category-repository.port";
import { NEWS_ARTICLE_REPOSITORY_PORT } from "./domain/news-article-repository.port";
import { USER_CATEGORY_PREFERENCE_REPOSITORY_PORT } from "./domain/user-category-preference-repository.port";
import { CategoriesController } from "./infrastructure/http/categories.controller";
import { NewsController } from "./infrastructure/http/news.controller";
import { DrizzleCategoryRepository } from "./infrastructure/persistence/drizzle-category.repository";
import { DrizzleNewsArticleRepository } from "./infrastructure/persistence/drizzle-news-article.repository";
import { DrizzleUserCategoryPreferenceRepository } from "./infrastructure/persistence/drizzle-user-category-preference.repository";

/**
 * Nest wiring layer for the news business module: two controllers
 * (CategoriesController, NewsController) sharing one module, binding each
 * repository port token to its concrete Drizzle adapter. JwtAuthGuard and
 * @CurrentUser() are imported directly from modules/_auth — no need to
 * import AuthModule/UserModule here, their own dependencies (Passport
 * strategy, JwtModule) are already wired globally via AuthModule in
 * AppModule.
 */
@Module({
  controllers: [CategoriesController, NewsController],
  providers: [
    CreateCategoryUseCase,
    ListCategoriesUseCase,
    GetCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    GetUserCategoryPreferencesUseCase,
    SetUserCategoryPreferencesUseCase,
    ListNewsArticlesUseCase,
    GetNewsArticleUseCase,
    ListNewsForUserUseCase,
    {
      provide: CATEGORY_REPOSITORY_PORT,
      useClass: DrizzleCategoryRepository,
    },
    {
      provide: NEWS_ARTICLE_REPOSITORY_PORT,
      useClass: DrizzleNewsArticleRepository,
    },
    {
      provide: USER_CATEGORY_PREFERENCE_REPOSITORY_PORT,
      useClass: DrizzleUserCategoryPreferenceRepository,
    },
  ],
})
export class NewsModule {}
