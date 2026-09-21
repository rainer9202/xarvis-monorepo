import { Inject, Injectable } from "@nestjs/common";
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
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(): Promise<PublicUser[]> {
    const users = await this.userRepository.findAll();
    return users.map(toPublicUser);
  }
}
