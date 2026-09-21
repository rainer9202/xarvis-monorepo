import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CreateUserUseCase } from "../../application/use-cases/create-user.use-case";
import { DeleteUserUseCase } from "../../application/use-cases/delete-user.use-case";
import { GetUserUseCase } from "../../application/use-cases/get-user.use-case";
import { ListUsersUseCase } from "../../application/use-cases/list-users.use-case";
import { UpdateUserUseCase } from "../../application/use-cases/update-user.use-case";
import { ResponseMessage } from "../../../../infrastructure/http/response-message.decorator";
import { JwtAuthGuard } from "../../../_auth/infrastructure/jwt-auth.guard";
import { CreateUserDto } from "./create-user.dto";
import { UpdateUserDto } from "./update-user.dto";
import { UserResponseDto } from "./user-response.dto";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Post()
  @ResponseMessage("User created")
  @ApiOperation({ summary: "Create a user" })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(@Body() body: CreateUserDto) {
    const user = await this.createUserUseCase.execute(body);
    return user;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage("Users retrieved")
  @ApiOperation({ summary: "List all users" })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll() {
    return this.listUsersUseCase.execute();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage("User retrieved")
  @ApiOperation({ summary: "Get a user by id" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.getUserUseCase.execute(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage("User updated")
  @ApiOperation({ summary: "Update a user" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.updateUserUseCase.execute(id, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ResponseMessage("User deleted")
  @ApiOperation({ summary: "Delete a user" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200 })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.deleteUserUseCase.execute(id);
    return null;
  }
}
