import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Validates the bearer token's signature/expiry (handled by passport-jwt
 * itself before validate() runs) and trusts the payload as-is. No database
 * hit here on purpose — this app has no revocation/refresh system yet, so
 * re-checking the user on every request is out of scope for this pass.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET")!,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
