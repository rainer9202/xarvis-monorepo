import { Body, Controller, ForbiddenException, Post } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { DevLoginUseCase } from "../../application/use-cases/dev-login.use-case";
import { LoginUseCase } from "../../application/use-cases/login.use-case";
import { LogoutUseCase } from "../../application/use-cases/logout.use-case";
import { RefreshTokenUseCase } from "../../application/use-cases/refresh-token.use-case";
import { ResponseMessage } from "../../../../infrastructure/http/response-message.decorator";
import { AuthResponseDto } from "./auth-response.dto";
import { LoginDto } from "./login.dto";
import { RefreshTokenDto } from "./refresh-token.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly devLoginUseCase: DevLoginUseCase,
    private readonly configService: ConfigService,
  ) {}

  // Stricter than the global default (100/min) — this is the brute-force
  // vector (guessing passwords), unlike refresh/logout which operate on a
  // high-entropy token nobody can practically guess.
  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ResponseMessage("Login successful")
  @ApiOperation({ summary: "Log in with email and password" })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async login(@Body() body: LoginDto) {
    return this.loginUseCase.execute(body);
  }

  // Public on purpose — this endpoint's whole reason to exist is to work
  // when the access token has already expired, so it can't sit behind
  // JwtAuthGuard. "Whose session" is derived from the refresh token itself.
  @Post("refresh")
  @ResponseMessage("Token refreshed")
  @ApiOperation({ summary: "Rotate a refresh token for a new access token" })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async refresh(@Body() body: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute(body);
  }

  // Public for the same reason as /auth/refresh above — a client with an
  // expired (or no) access token still needs to be able to log out.
  @Post("logout")
  @ResponseMessage("Logged out")
  @ApiOperation({ summary: "Revoke a refresh token" })
  async logout(@Body() body: RefreshTokenDto) {
    return this.logoutUseCase.execute(body);
  }

  // Local-dev convenience only — mints a token pair for a fixed dev user,
  // skipping password verification. Hard-blocked in production at the
  // controller level (this check) AND again inside DevLoginUseCase itself
  // (defense in depth: neither layer trusts the other alone). Visible in
  // Swagger on purpose (so it's usable via "Try it out"), but the
  // production check means it 403s there regardless of visibility.
  @Post("dev-login")
  @ResponseMessage("Dev login successful")
  @ApiOperation({
    summary: "[DEV ONLY] Get a token pair for a fixed local dev user",
  })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async devLogin() {
    if (this.configService.get<string>("NODE_ENV") === "production") {
      throw new ForbiddenException("Not available in production");
    }
    return this.devLoginUseCase.execute();
  }
}
