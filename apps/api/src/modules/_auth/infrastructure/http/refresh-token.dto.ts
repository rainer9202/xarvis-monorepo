import { createZodDto } from "nestjs-zod";
import { RefreshTokenRequestSchema } from "@xarvis/shared";

/**
 * nestjs-zod turns the shared Zod schema into a class Nest can use for
 * request validation. Reused for both POST /auth/refresh and POST
 * /auth/logout — both take the same { refreshToken: string } body shape.
 */
export class RefreshTokenDto extends createZodDto(RefreshTokenRequestSchema) {}
