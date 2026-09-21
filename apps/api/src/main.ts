import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NextFunction, Request, Response } from "express";
import { cleanupOpenApiDoc, ZodValidationPipe } from "nestjs-zod";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ZodValidationPipe());

  // Stamps the request's start time as early as possible (before guards,
  // interceptors, pipes) so ResponseInterceptor and HttpExceptionFilter both
  // measure responseTime from the same point, whether the request succeeds
  // or throws. Both are registered as APP_INTERCEPTOR/APP_FILTER providers
  // in AppModule (not here) so Nest can inject ResponseInterceptor's
  // Reflector dependency.
  app.use((req: Request & { startTime?: number }, _res: Response, next: NextFunction) => {
    req.startTime = Date.now();
    next();
  });

  const config = app.get(ConfigService);
  app.enableCors({ origin: config.get<string>("CORS_ORIGIN") });

  // cleanupOpenApiDoc() post-processes the document so nestjs-zod DTOs
  // (createZodDto) describe themselves correctly instead of as empty objects.
  const swaggerDocument = cleanupOpenApiDoc(
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("Xarvis API")
        .setVersion("0.0.0")
        .addBearerAuth()
        .build(),
    ),
  );
  SwaggerModule.setup("api/docs", app, swaggerDocument);

  const port = config.get<number>("PORT")!;
  await app.listen(port);
}

bootstrap();
