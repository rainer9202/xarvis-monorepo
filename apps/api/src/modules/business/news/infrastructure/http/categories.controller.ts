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
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CreateCategoryUseCase } from "../../application/use-cases/category/create-category.use-case";
import { DeleteCategoryUseCase } from "../../application/use-cases/category/delete-category.use-case";
import { GetCategoryUseCase } from "../../application/use-cases/category/get-category.use-case";
import { GetUserCategoryPreferencesUseCase } from "../../application/use-cases/category/get-user-category-preferences.use-case";
import { ListCategoriesUseCase } from "../../application/use-cases/category/list-categories.use-case";
import { SetUserCategoryPreferencesUseCase } from "../../application/use-cases/category/set-user-category-preferences.use-case";
import { UpdateCategoryUseCase } from "../../application/use-cases/category/update-category.use-case";
import { ResponseMessage } from "../../../../../infrastructure/http/response-message.decorator";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../../../../_auth/infrastructure/current-user.decorator";
import { JwtAuthGuard } from "../../../../_auth/infrastructure/jwt-auth.guard";
import { CategoryResponseDto } from "./category-response.dto";
import { CreateCategoryDto } from "./create-category.dto";
import { SetCategoryPreferencesDto } from "./set-category-preferences.dto";
import { UpdateCategoryDto } from "./update-category.dto";

/**
 * Every route requires authentication (per product decision — no
 * exceptions for this module), matching UsersController's protected-route
 * style: @UseGuards(JwtAuthGuard) + @ApiBearerAuth() on every handler.
 *
 * Route order matters: /categories/me/preferences is declared BEFORE
 * /categories/:id, otherwise Nest would try to match "me" as the :id param
 * and ParseUUIDPipe would reject it as not-a-uuid.
 */
@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    private readonly getCategoryUseCase: GetCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly getUserCategoryPreferencesUseCase: GetUserCategoryPreferencesUseCase,
    private readonly setUserCategoryPreferencesUseCase: SetUserCategoryPreferencesUseCase,
  ) {}

  @Get("me/preferences")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage("Category preferences retrieved")
  @ApiOperation({ summary: "Get the current user's preferred categories" })
  @ApiResponse({ status: 200, type: [CategoryResponseDto] })
  async getMyPreferences(@CurrentUser() user: CurrentUserPayload) {
    return this.getUserCategoryPreferencesUseCase.execute(user.sub);
  }

  @Put("me/preferences")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage("Category preferences updated")
  @ApiOperation({ summary: "Replace the current user's preferred categories" })
  @ApiResponse({ status: 200, type: [CategoryResponseDto] })
  async setMyPreferences(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: SetCategoryPreferencesDto,
  ) {
    return this.setUserCategoryPreferencesUseCase.execute(
      user.sub,
      body.categoryIds,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage("Categories retrieved")
  @ApiOperation({ summary: "List categories" })
  @ApiQuery({ name: "type", required: false })
  @ApiResponse({ status: 200, type: [CategoryResponseDto] })
  async findAll(@Query("type") type?: string) {
    return this.listCategoriesUseCase.execute(type ? { type } : undefined);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage("Category retrieved")
  @ApiOperation({ summary: "Get a category by id" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.getCategoryUseCase.execute(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage("Category created")
  @ApiOperation({ summary: "Create a category" })
  @ApiResponse({ status: 201, type: CategoryResponseDto })
  async create(@Body() body: CreateCategoryDto) {
    return this.createCategoryUseCase.execute(body);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage("Category updated")
  @ApiOperation({ summary: "Update a category" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.updateCategoryUseCase.execute(id, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ResponseMessage("Category deleted")
  @ApiOperation({ summary: "Delete a category" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200 })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.deleteCategoryUseCase.execute(id);
    return null;
  }
}
