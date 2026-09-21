import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { AuthResponse, LoginDto } from "@xarvis/shared";
import { verifyPassword } from "../../../../infrastructure/auth/password";
import { toPublicUser } from "../../../user/application/to-public-user";
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from "../../../user/domain/user-repository.port";
import {
  REFRESH_TOKEN_REPOSITORY_PORT,
  RefreshTokenRepositoryPort,
} from "../../domain/refresh-token-repository.port";
import { issueRefreshToken } from "../issue-refresh-token";

/**
 * Use case: orchestrates the domain via ports only. It knows nothing about
 * HTTP, Express, or which persistence technology backs the repository port.
 *
 * On any mismatch (email not found OR wrong password) this throws the same
 * generic UnauthorizedException — never reveal to a caller whether the
 * email is registered.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(REFRESH_TOKEN_REPOSITORY_PORT)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await verifyPassword(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    const refreshToken = await issueRefreshToken(
      user.id,
      this.refreshTokenRepository,
      this.configService.get<number>("REFRESH_TOKEN_EXPIRES_IN_DAYS")!,
    );

    return {
      accessToken,
      refreshToken,
      user: toPublicUser(user),
    };
  }
}
