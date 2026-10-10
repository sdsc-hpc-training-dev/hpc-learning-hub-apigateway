import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicCatalogCache } from '../common/http/public-catalog-cache.decorator';
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
  @PublicCatalogCache()
  findMaterials(
    @Query() query: MaterialQueryDto,
  ): Promise<MaterialPageResponseDto> {
    return this.trainingLibraryService.findMaterials(query);
  }

  @Get('materials/:materialId')
  @PublicCatalogCache()
  findMaterial(
    @Param('materialId') materialId: string,
  ): Promise<MaterialResponseDto> {
    return this.trainingLibraryService.findMaterial(materialId);
  }

  @Get('materials/:materialId/resources')
  @PublicCatalogCache()
  findResources(
    @Param('materialId') materialId: string,
  ): Promise<MaterialResourceResponseDto[]> {
    return this.trainingLibraryService.findResources(materialId);
  }

  @Get('topics')
  @PublicCatalogCache()
  findTopics(): Promise<NamedCatalogItemResponseDto[]> {
    return this.trainingLibraryService.findTopics();
  }

  @Get('tools')
  @PublicCatalogCache()
  findTools(): Promise<NamedCatalogItemResponseDto[]> {
    return this.trainingLibraryService.findTools();
  }

  @Get('systems')
  @PublicCatalogCache()
  findSystems(): Promise<NamedCatalogItemResponseDto[]> {
    return this.trainingLibraryService.findSystems();
  }

  @Get('event-series')
  @PublicCatalogCache()
  findEventSeries(): Promise<EventSeriesResponseDto[]> {
    return this.trainingLibraryService.findEventSeries();
  }

  @Get('event-series/:seriesId')
  @PublicCatalogCache()
  findEventSeriesById(
    @Param('seriesId') seriesId: string,
  ): Promise<EventSeriesResponseDto> {
    return this.trainingLibraryService.findEventSeriesById(seriesId);
  }

  @Get('event-editions')
  @PublicCatalogCache()
  findEventEditions(): Promise<EventEditionResponseDto[]> {
    return this.trainingLibraryService.findEventEditions();
  }

  @Get('event-editions/:eventId')
  @PublicCatalogCache()
  findEventEditionsById(
    @Param('eventId') eventId: string,
  ): Promise<EventEditionResponseDto> {
    return this.trainingLibraryService.findEventEditionById(eventId);
  }
}
