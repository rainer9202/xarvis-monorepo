import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from "../../domain/user-repository.port";

/**
 * Use case: orchestrates the domain via ports only. It knows nothing about
 * HTTP, Express, or which persistence technology backs the repository port.
 */
@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
  }
}
