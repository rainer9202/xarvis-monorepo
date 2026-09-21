import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface CurrentUserPayload {
  sub: string;
  email: string;
}

/**
 * Pulls `request.user` — the payload JwtStrategy.validate() returned after
 * a successful JwtAuthGuard check (see jwt.strategy.ts: {sub, email}, where
 * `sub` is the user id) — so route handlers can do
 * `@CurrentUser() user: CurrentUserPayload` instead of reaching into
 * `@Req()` manually. Only meaningful behind JwtAuthGuard; on an
 * unprotected route `request.user` is undefined.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
