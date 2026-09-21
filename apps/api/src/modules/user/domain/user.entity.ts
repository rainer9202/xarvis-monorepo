/**
 * Domain entity. No framework dependencies, no decorators, no I/O —
 * plain TypeScript that expresses the business concept.
 *
 * `passwordHash` is carried on the entity because CreateUserUseCase and the
 * persistence layer both need a full row to construct/persist. It MUST
 * NEVER be returned to an HTTP caller directly — every use case that hands
 * a User back to a controller sanitizes it first via toPublicUser()
 * (see application/to-public-user.ts).
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly passwordHash: string,
  ) {}
}
