/**
 * Domain entity. No framework dependencies, no decorators, no I/O — plain
 * TypeScript that expresses the business concept.
 */
export class NewsArticle {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly url: string,
    public readonly description: string | null,
    public readonly imageUrl: string | null,
    public readonly source: string,
    public readonly categoryId: string | null,
    public readonly publishedAt: Date,
    public readonly createdAt: Date,
  ) {}
}
