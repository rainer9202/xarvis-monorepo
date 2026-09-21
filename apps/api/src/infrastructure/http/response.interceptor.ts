import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request, Response } from "express";
import { STATUS_CODES } from "node:http";
import { map, Observable } from "rxjs";
import { RESPONSE_MESSAGE_KEY } from "./response-message.decorator";

export interface ApiSuccessResponse<T> {
  data: T | null;
  status: number;
  responseTime: number;
  message: string;
}

/**
 * Wraps every successful controller response in a consistent envelope.
 * Pairs with HttpExceptionFilter, which wraps error responses the same way
 * but with `errors` instead of `data`. Both read `request.startTime`,
 * stamped by the timing middleware in main.ts, so elapsed time is measured
 * from the same point regardless of whether the request succeeds or fails.
 *
 * `message` describes the action performed (e.g. "User created"), set per
 * route via @ResponseMessage(...); routes that don't set one fall back to
 * the HTTP status text.
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T>> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { startTime?: number }>();
    const response = http.getResponse<Response>();
    const startTime = request.startTime ?? Date.now();
    const actionMessage = this.reflector.get<string | undefined>(
      RESPONSE_MESSAGE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => ({
        data: data ?? null,
        status: response.statusCode,
        responseTime: Date.now() - startTime,
        message: actionMessage ?? STATUS_CODES[response.statusCode] ?? "OK",
      })),
    );
  }
}
