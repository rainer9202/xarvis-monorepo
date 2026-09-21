import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Category as PublicCategory, UpdateCategoryDto } from "@xarvis/shared";
import {
  CATEGORY_REPOSITORY_PORT,
  CategoryRepositoryPort,
} from "../../../domain/category-repository.port";
import { toPublicCategory } from "../../to-public-category";

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(id: string, input: UpdateCategoryDto): Promise<PublicCategory> {
    const target = await this.categoryRepository.findById(id);
    if (!target) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }

    if (input.name && input.name !== target.name) {
      const existing = await this.categoryRepository.findByName(input.name);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Category with name "${input.name}" already exists`,
        );
      }
    }

    const updated = await this.categoryRepository.update(id, input);
    if (!updated) {
      throw new Error(
        `Invariant violation: category with id "${id}" disappeared during update`,
      );
    }

    return toPublicCategory(updated);
  }
}
