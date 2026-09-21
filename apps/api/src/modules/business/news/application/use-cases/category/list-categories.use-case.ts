import { Inject, Injectable } from "@nestjs/common";
import type { Category as PublicCategory } from "@xarvis/shared";
import {
  CATEGORY_REPOSITORY_PORT,
  CategoryRepositoryPort,
} from "../../../domain/category-repository.port";
import { toPublicCategory } from "../../to-public-category";

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(filters?: { type?: string }): Promise<PublicCategory[]> {
    const categories = await this.categoryRepository.findAll(filters);
    return categories.map(toPublicCategory);
  }
}
