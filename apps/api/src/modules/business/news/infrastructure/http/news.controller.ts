import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { GetNewsArticleUseCase } from "../../application/use-cases/news/get-news-article.use-case";
import { ListNewsArticlesUseCase } from "../../application/use-cases/news/list-news-articles.use-case";
import { ListNewsForUserUseCase } from "../../application/use-cases/news/list-news-for-user.use-case";
import { ResponseMessage } from "../../../../../infrastructure/http/response-message.decorator";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../../../../_auth/infrastructure/current-user.decorator";
import { JwtAuthGuard } from "../../../../_auth/infrastructure/jwt-auth.guard";
import { NewsArticleResponseDto } from "./news-article-response.dto";

/**
 * Read-only: ingestion (Dev.to/HN/RSS) is a separate future task, so there
 * is no POST/PATCH/DELETE here yet — manual data entry happens directly
 * against Postgres for now.
 *
 * Every route requires authentication, matching CategoriesController.
 *
 * Route order matters: /news/for-me is declared BEFORE /news/:id, otherwise
 * Nest would try to match "for-me" as the :id param and ParseUUIDPipe
 * would reject it as not-a-uuid.
 */
@ApiTags("news")
@Controller("news")
export class NewsController {
  constructor(
    private readonly listNewsArticlesUseCase: ListNewsArticlesUseCase,
    private readonly listNewsForUserUseCase: ListNewsForUserUseCase,
    private readonly getNewsArticleUseCase: GetNewsArticleUseCase,
  ) {}

  @Get("for-me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage("News for your preferences retrieved")
  @ApiOperation({
    summary: "List news articles filtered by the current user's preferred categories",
  })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @ApiResponse({ status: 200, type: [NewsArticleResponseDto] })
  async findForMe(
    @CurrentUser() user: CurrentUserPayload,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.listNewsForUserUseCase.execute(user.sub, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage("News articles retrieved")
  @ApiOperation({ summary: "List news articles" })
  @ApiQuery({ name: "categoryId", required: false, format: "uuid" })
  @ApiQuery({ name: "source", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @ApiResponse({ status: 200, type: [NewsArticleResponseDto] })
  async findAll(
    @Query("categoryId") categoryId?: string,
    @Query("source") source?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.listNewsArticlesUseCase.execute({
      categoryId,
      source,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage("News article retrieved")
  @ApiOperation({ summary: "Get a news article by id" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiResponse({ status: 200, type: NewsArticleResponseDto })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.getNewsArticleUseCase.execute(id);
  }
}
