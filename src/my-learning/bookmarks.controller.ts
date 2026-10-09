import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserIdentity } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AddBookmarkDto } from './dto/add-bookmark.dto';
import { BookmarkResponseDto } from './dto/bookmark-response.dto';
import { MyLearningService } from './my-learning.service';

@Controller('me/bookmarks')
@UseGuards(SessionAuthGuard)
export class BookmarksController {
  constructor(private readonly myLearningService: MyLearningService) {}

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserIdentity,
  ): Promise<BookmarkResponseDto[]> {
    return this.myLearningService.findBookmarks(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserIdentity,
    @Body() input: AddBookmarkDto,
  ): Promise<BookmarkResponseDto> {
    return this.myLearningService.addBookmark(user.id, input);
  }

  @Delete(':materialId')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @CurrentUser() user: CurrentUserIdentity,
    @Param() input: AddBookmarkDto,
  ): Promise<void> {
    return this.myLearningService.deleteBookmark(user.id, input.materialId);
  }
}
