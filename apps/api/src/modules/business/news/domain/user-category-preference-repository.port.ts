/**
 * Port (in the hexagonal sense): a contract the application layer depends
 * on, implemented by an infrastructure adapter. The domain/application
 * layers know nothing about how persistence actually happens.
 */
export interface UserCategoryPreferenceRepositoryPort {
  findCategoryIdsForUser(userId: string): Promise<string[]>;
  /**
   * Replace-all semantics: removes whatever the user had, then inserts the
   * new set (delete-then-insert against Postgres).
   */
  setForUser(userId: string, categoryIds: string[]): Promise<void>;
}

export const USER_CATEGORY_PREFERENCE_REPOSITORY_PORT = Symbol(
  "USER_CATEGORY_PREFERENCE_REPOSITORY_PORT",
);
