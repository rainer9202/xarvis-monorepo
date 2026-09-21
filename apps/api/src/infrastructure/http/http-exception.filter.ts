import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { STATUS_CODES } from "node:http";

export interface ApiErrorResponse {
  errors: unknown[];
  status: number;
  responseTime: number;
  message: string;
}

/**
 * Catches every thrown error (Nest HttpExceptions and anything unexpected)
 * and formats it as the same envelope shape ResponseInterceptor uses for
 * success, but with `errors` instead of `data`. Nest-thrown exceptions
 * (ConflictException, NotFoundException, nestjs-zod's validation errors,
 * ...) already carry a structured body via getResponse() — that structure
 * is preserved as `errors` instead of being flattened away.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { startTime?: number }>();
    const startTime = request.startTime ?? Date.now();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = STATUS_CODES[status] ?? "Error";
    let errors: unknown[] = [{ message }];

    if (isHttpException) {
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
        errors = [{ message: body }];
      } else {
        const record = body as Record<string, unknown>;
        message = (record.message as string) ?? message;
        errors = Array.isArray(record.errors) ? record.errors : [record];
      }
    } else if (exception instanceof Error) {
      // Unexpected (non-Nest) error: don't leak internals to the client,
      // but the message is still useful in server logs via Nest's default
      // unhandled-exception logging, which still runs before filters.
      errors = [{ message }];
    }

    response.status(status).json({
      errors,
      status,
      responseTime: Date.now() - startTime,
      message,
    });
  }
}
