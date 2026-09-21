import { createZodDto } from "nestjs-zod";
import { UpdateCategorySchema } from "@xarvis/shared";

/**
 * nestjs-zod turns the shared Zod schema into a class Nest can use for
 * request validation (ZodValidationPipe) and, if needed, Swagger metadata.
 * The schema itself still lives in libraries/shared — this is just a thin
 * Nest-shaped wrapper around it.
 */
export class UpdateCategoryDto extends createZodDto(UpdateCategorySchema) {}
