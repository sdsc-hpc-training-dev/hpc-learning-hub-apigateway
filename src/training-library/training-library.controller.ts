import { Controller, Get, Param, Query } from '@nestjs/common';
import { MaterialQueryDto } from './dto/material-query.dto';
import type {
  EventEditionResponseDto,
  EventSeriesResponseDto,
  MaterialPageResponseDto,
  MaterialResourceResponseDto,
  MaterialResponseDto,
  NamedCatalogItemResponseDto,
} from './dto/material-response.dto';
import { TrainingLibraryService } from './training-library.service';

@Controller()
export class TrainingLibraryController {
  constructor(
    private readonly trainingLibraryService: TrainingLibraryService,
  ) {}

  @Get('materials')
  findMaterials(
    @Query() query: MaterialQueryDto,
  ): Promise<MaterialPageResponseDto> {
    return this.trainingLibraryService.findMaterials(query);
  }

  @Get('materials/:materialId')
  findMaterial(
    @Param('materialId') materialId: string,
  ): Promise<MaterialResponseDto> {
    return this.trainingLibraryService.findMaterial(materialId);
  }

  @Get('materials/:materialId/resources')
  findResources(
    @Param('materialId') materialId: string,
  ): Promise<MaterialResourceResponseDto[]> {
    return this.trainingLibraryService.findResources(materialId);
  }

  @Get('topics')
  findTopics(): Promise<NamedCatalogItemResponseDto[]> {
    return this.trainingLibraryService.findTopics();
  }

  @Get('tools')
  findTools(): Promise<NamedCatalogItemResponseDto[]> {
    return this.trainingLibraryService.findTools();
  }

  @Get('systems')
  findSystems(): Promise<NamedCatalogItemResponseDto[]> {
    return this.trainingLibraryService.findSystems();
  }

  @Get('event-series')
  findEventSeries(): Promise<EventSeriesResponseDto[]> {
    return this.trainingLibraryService.findEventSeries();
  }

  @Get('event-series/:seriesId')
  findEventSeriesById(
    @Param('seriesId') seriesId: string,
  ): Promise<EventSeriesResponseDto> {
    return this.trainingLibraryService.findEventSeriesById(seriesId);
  }

  @Get('event-editions')
  findEventEditions(): Promise<EventEditionResponseDto[]> {
    return this.trainingLibraryService.findEventEditions();
  }

  @Get('event-editions/:eventId')
  findEventEditionsById(
    @Param('eventId') eventId: string,
  ): Promise<EventEditionResponseDto> {
    return this.trainingLibraryService.findEventEditionById(eventId);
  }
}
