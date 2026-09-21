import { BadRequestException, Inject, Injectable } from "@nestjs/common";
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
 * Replaces the current user's full set of preferred categories. Every
 * provided category id must actually exist — if any doesn't, the whole
 * request is rejected (400 naming the invalid id(s)) rather than silently
 * ignoring bad ids or partially applying the update.
 */
@Injectable()
export class SetUserCategoryPreferencesUseCase {
  constructor(
    @Inject(USER_CATEGORY_PREFERENCE_REPOSITORY_PORT)
    private readonly preferenceRepository: UserCategoryPreferenceRepositoryPort,
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(
    userId: string,
    categoryIds: string[],
  ): Promise<PublicCategory[]> {
    const categories = await Promise.all(
      categoryIds.map((id) => this.categoryRepository.findById(id)),
    );

    const invalidIds = categoryIds.filter((_, index) => !categories[index]);
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid category id(s): ${invalidIds.join(", ")}`,
      );
    }

    await this.preferenceRepository.setForUser(userId, categoryIds);

    return categories
      .filter((category): category is NonNullable<typeof category> =>
        Boolean(category),
      )
      .map(toPublicCategory);
  }
}
