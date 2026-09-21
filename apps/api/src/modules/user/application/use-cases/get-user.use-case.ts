import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { User as PublicUser } from "@xarvis/shared";
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
export class GetUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(id: string): Promise<PublicUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return toPublicUser(user);
  }
}
