import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { UpdateUserDto, User as PublicUser } from "@xarvis/shared";
import { hashPassword } from "../../../../infrastructure/auth/password";
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from "../../domain/user-repository.port";
import { toPublicUser } from "../to-public-user";

/**
 * Use case: orchestrates the domain via ports only. It knows nothing about
 * HTTP, Express, or which persistence technology backs the repository port.
 */
@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(id: string, input: UpdateUserDto): Promise<PublicUser> {
    const target = await this.userRepository.findById(id);
    if (!target) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    if (input.email && input.email !== target.email) {
      const existing = await this.userRepository.findByEmail(input.email);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `User with email "${input.email}" already exists`,
        );
      }
    }

    const { password, ...rest } = input;
    const changes: Partial<{
      email: string;
      name: string;
      passwordHash: string;
    }> = { ...rest };

    if (password) {
      changes.passwordHash = await hashPassword(password);
    }

    const updated = await this.userRepository.update(id, changes);
    if (!updated) {
      throw new Error(
        `Invariant violation: user with id "${id}" disappeared during update`,
      );
    }

    return toPublicUser(updated);
  }
}
