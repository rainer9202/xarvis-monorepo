import { User } from "./user.entity";

/**
 * Port (in the hexagonal sense): a contract the application layer depends
 * on, implemented by an infrastructure adapter. The domain/application
 * layers know nothing about how persistence actually happens.
 */
export interface UserRepositoryPort {
  save(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(
    id: string,
    changes: Partial<{ email: string; name: string; passwordHash: string }>,
  ): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

export const USER_REPOSITORY_PORT = Symbol("USER_REPOSITORY_PORT");
