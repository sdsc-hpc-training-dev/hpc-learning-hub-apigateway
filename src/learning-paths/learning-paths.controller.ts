import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { LearningPathResponseDto } from './dto/learning-path-response.dto';
import { LearningPathsService } from './learning-paths.service';

@Controller('learning-paths')
export class LearningPathsController {
  constructor(private readonly learningPathsService: LearningPathsService) {}

  @Get()
  findAll(): Promise<LearningPathResponseDto[]> {
    return this.learningPathsService.findAll();
  }

  @Get(':pathId')
  findOne(@Param('pathId', new ParseUUIDPipe()) pathId: string): Promise<LearningPathResponseDto> {
    return this.learningPathsService.findOne(pathId);
  }
}
