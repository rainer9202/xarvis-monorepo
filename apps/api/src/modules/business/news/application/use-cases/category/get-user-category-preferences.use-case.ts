import { Inject, Injectable } from "@nestjs/common";
import type { Category as PublicCategory } from "@xarvis/shared";
import {
  CATEGORY_REPOSITORY_PORT,
  CategoryRepositoryPort,
} from "../../../domain/category-repository.port";
import {
  USER_CATEGORY_PREFERENCE_REPOSITORY_PORT,
  UserCategoryPreferenceRepositoryPort,
} from "../../../domain/user-category-preference-repository.port";
import { toPublicCategory } from "../../to-public-category";

/**
 * Returns the current user's preferred categories as full Category objects
 * (not just raw ids) — joins the preference ids against the category
 * repository so the response is actually useful to a caller.
 */
@Injectable()
export class GetUserCategoryPreferencesUseCase {
  constructor(
    @Inject(USER_CATEGORY_PREFERENCE_REPOSITORY_PORT)
    private readonly preferenceRepository: UserCategoryPreferenceRepositoryPort,
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(userId: string): Promise<PublicCategory[]> {
    const categoryIds =
      await this.preferenceRepository.findCategoryIdsForUser(userId);

    if (categoryIds.length === 0) {
      return [];
    }

    const categories = await Promise.all(
      categoryIds.map((id) => this.categoryRepository.findById(id)),
    );

    return categories
      .filter((category): category is NonNullable<typeof category> =>
        Boolean(category),
      )
      .map(toPublicCategory);
  }
}
