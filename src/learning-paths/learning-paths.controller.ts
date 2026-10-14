import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { PublicCatalogCache } from '../common/http/public-catalog-cache.decorator';
import { LearningPathResponseDto } from './dto/learning-path-response.dto';
import { LearningPathsService } from './learning-paths.service';

@Controller('learning-paths')
export class LearningPathsController {
  constructor(private readonly learningPathsService: LearningPathsService) {}

  @Get()
  @PublicCatalogCache()
  findAll(): Promise<LearningPathResponseDto[]> {
    return this.learningPathsService.findAll();
  }

  @Get(':pathId')
  @PublicCatalogCache()
  findOne(
    @Param('pathId', new ParseUUIDPipe()) pathId: string,
  ): Promise<LearningPathResponseDto> {
    return this.learningPathsService.findOne(pathId);
  }
}
