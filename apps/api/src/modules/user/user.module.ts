import { Module } from "@nestjs/common";
import { CreateUserUseCase } from "./application/use-cases/create-user.use-case";
import { DeleteUserUseCase } from "./application/use-cases/delete-user.use-case";
import { GetUserUseCase } from "./application/use-cases/get-user.use-case";
import { ListUsersUseCase } from "./application/use-cases/list-users.use-case";
import { UpdateUserUseCase } from "./application/use-cases/update-user.use-case";
import { USER_REPOSITORY_PORT } from "./domain/user-repository.port";
import { UsersController } from "./infrastructure/http/users.controller";
import { DrizzleUserRepository } from "./infrastructure/persistence/drizzle-user.repository";

/**
 * Nest wiring layer: binds the UserRepositoryPort token to a concrete
 * adapter (DrizzleUserRepository). Swapping adapters is just changing this
 * one line — domain/application/HTTP layers are untouched.
 */
@Module({
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    {
      provide: USER_REPOSITORY_PORT,
      useClass: DrizzleUserRepository,
    },
  ],
  exports: [USER_REPOSITORY_PORT],
})
export class UserModule {}
