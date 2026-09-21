import { SetMetadata } from "@nestjs/common";

export const RESPONSE_MESSAGE_KEY = "responseMessage";

/**
 * Declares the human-readable action a route performed (e.g. "User created"),
 * read by ResponseInterceptor to populate the envelope's `message` field.
 * Falls back to the HTTP status text (e.g. "OK") when a route doesn't set one.
 */
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);
