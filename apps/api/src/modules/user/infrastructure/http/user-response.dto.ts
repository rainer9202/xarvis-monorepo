import { createZodDto } from "nestjs-zod";
import { UserSchema } from "@xarvis/shared";

/**
 * nestjs-zod turns the shared Zod schema into a class Nest can use for
 * Swagger response typing. Used only for @ApiResponse({ type: ... }) so the
 * docs at /api/docs show the real response shape instead of an empty object.
 */
export class UserResponseDto extends createZodDto(UserSchema) {}
