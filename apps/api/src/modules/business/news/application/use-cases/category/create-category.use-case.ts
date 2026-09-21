import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Category as PublicCategory, CreateCategoryDto } from "@xarvis/shared";
import { Category } from "../../../domain/category.entity";
import {
  CATEGORY_REPOSITORY_PORT,
  CategoryRepositoryPort,
} from "../../../domain/category-repository.port";
import { toPublicCategory } from "../../to-public-category";

/**
 * Use case: orchestrates the domain via ports only. It knows nothing about
 * HTTP, Express, or which persistence technology backs the repository port.
 */
@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(input: CreateCategoryDto): Promise<PublicCategory> {
    const existing = await this.categoryRepository.findByName(input.name);
    if (existing) {
      throw new ConflictException(
        `Category with name "${input.name}" already exists`,
      );
    }

    const category = new Category(randomUUID(), input.name, input.type);
    const saved = await this.categoryRepository.save(category);
    return toPublicCategory(saved);
  }
}
