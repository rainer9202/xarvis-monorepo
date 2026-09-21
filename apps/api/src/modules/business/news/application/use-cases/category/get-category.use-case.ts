import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Category as PublicCategory } from "@xarvis/shared";
import {
  CATEGORY_REPOSITORY_PORT,
  CategoryRepositoryPort,
} from "../../../domain/category-repository.port";
import { toPublicCategory } from "../../to-public-category";

@Injectable()
export class GetCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(id: string): Promise<PublicCategory> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }

    return toPublicCategory(category);
  }
}
