import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreatePersonalLearningPathDto } from './dto/create-personal-learning-path.dto';
import { UpdatePersonalLearningPathDto } from './dto/update-personal-learning-path.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserIdentity } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { PersonalLearningPathResponseDto } from './dto/personal-learning-path-response.dto';
import { MyLearningService } from './my-learning.service';

@Controller('me/learning-paths')
@UseGuards(SessionAuthGuard)
export class MyLearningController {
  constructor(private readonly myLearningService: MyLearningService) {}

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserIdentity,
  ): Promise<PersonalLearningPathResponseDto[]> {
    return this.myLearningService.findAll(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserIdentity,
    @Body() input: CreatePersonalLearningPathDto,
  ): Promise<PersonalLearningPathResponseDto> {
    return this.myLearningService.create(user.id, input);
  }

  @Get(':pathId')
  findOne(
    @CurrentUser() user: CurrentUserIdentity,
    @Param('pathId', new ParseUUIDPipe()) pathId: string,
  ): Promise<PersonalLearningPathResponseDto> {
    return this.myLearningService.findOne(user.id, pathId);
  }

  @Patch(':pathId')
  update(
    @CurrentUser() user: CurrentUserIdentity,
    @Param('pathId', new ParseUUIDPipe()) pathId: string,
    @Body() input: UpdatePersonalLearningPathDto,
  ): Promise<PersonalLearningPathResponseDto> {
    return this.myLearningService.update(user.id, pathId, input);
  }

  @Delete(':pathId')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @CurrentUser() user: CurrentUserIdentity,
    @Param('pathId', new ParseUUIDPipe()) pathId: string,
  ): Promise<void> {
    return this.myLearningService.delete(user.id, pathId);
  }
}
