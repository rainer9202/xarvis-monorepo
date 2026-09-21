import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Guards protected routes with the "jwt" Passport strategy registered by
 * JwtStrategy (infrastructure/jwt.strategy.ts).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
