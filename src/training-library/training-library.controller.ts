import { Controller, Get } from '@nestjs/common';
import { TrainingLibraryService } from './training-library.service';

@Controller('training-library')
export class TrainingLibraryController {
  constructor(
    private readonly trainingLibraryService: TrainingLibraryService,
  ) {}

  @Get()
  findAll(): [] {
    return this.trainingLibraryService.findAll();
  }
}
