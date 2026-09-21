/**
 * Domain entity. No framework dependencies, no decorators, no I/O — plain
 * TypeScript that expresses the business concept.
 */
export class Category {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: string,
  ) {}
}
