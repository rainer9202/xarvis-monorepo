import { Inject, Injectable, ConflictException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { CreateUserDto, User as PublicUser } from "@xarvis/shared";
import { hashPassword } from "../../../../infrastructure/auth/password";
import { User } from "../../domain/user.entity";
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
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(input: CreateUserDto): Promise<PublicUser> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictException(
        `User with email "${input.email}" already exists`,
      );
    }

    const passwordHash = await hashPassword(input.password);
    const user = new User(randomUUID(), input.email, input.name, passwordHash);
    const saved = await this.userRepository.save(user);
    return toPublicUser(saved);
  }
}
