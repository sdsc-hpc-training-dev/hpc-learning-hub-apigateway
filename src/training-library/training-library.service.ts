import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentResource,
  EventEdition,
  EventSeries,
} from '../database/entities/catalog.entity';
import { ResourceType } from '../database/entities/persistence.enums';
import { MaterialQueryDto } from './dto/material-query.dto';
import {
  EventEditionResponseDto,
  EventSeriesResponseDto,
  MaterialPageResponseDto,
  MaterialResourceResponseDto,
  MaterialResponseDto,
  NamedCatalogItemResponseDto,
} from './dto/material-response.dto';
import { TrainingLibraryRepository } from './persistence/training-library.repository';
import {
  MaterialFilters,
  MaterialRecord,
} from './persistence/training-library.records';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class TrainingLibraryService {
  constructor(private readonly repository: TrainingLibraryRepository) {}

  async findMaterials(
    query: MaterialQueryDto,
  ): Promise<MaterialPageResponseDto> {
    const filters = this.toFilters(query);
    const result = await this.repository.findMaterials(filters);

    return {
      items: result.items.map((record) => this.toMaterialResponse(record)),
      page: filters.page,
      pageSize: filters.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / filters.pageSize),
    };
  }

  async findMaterial(materialId: string): Promise<MaterialResponseDto> {
    const record = await this.repository.findMaterialById(materialId);
    if (!record) throw this.materialNotFound(materialId);
    return this.toMaterialResponse(record);
  }

  async findResources(
    materialId: string,
  ): Promise<MaterialResourceResponseDto[]> {
    const resources =
      await this.repository.findResourcesByMaterialId(materialId);
    if (!resources) throw this.materialNotFound(materialId);
    return this.toResources(resources);
  }

  async findTopics(): Promise<NamedCatalogItemResponseDto[]> {
    const topics = await this.repository.findTopics();
    return topics.map(({ id, name }) => ({ id, name }));
  }

  async findTools(): Promise<NamedCatalogItemResponseDto[]> {
    const tools = await this.repository.findTools();
    return tools.map(({ id, name }) => ({ id, name }));
  }

  async findSystems(): Promise<NamedCatalogItemResponseDto[]> {
    const systems = await this.repository.findSystems();
    return systems.map(({ id, name }) => ({ id, name }));
  }

  async findEventSeries(): Promise<EventSeriesResponseDto[]> {
    const series = await this.repository.findEventSeries();
    return series.map((item) => this.toEventSeries(item));
  }

  async findEventSeriesById(seriesId: string): Promise<EventSeriesResponseDto> {
    const series = await this.repository.findEventSeriesById(seriesId);
    if (!series) {
      throw new NotFoundException(`Series "${seriesId}" was not found`);
    }
    return this.toEventSeries(series);
  }

  async findEventEditions(): Promise<EventEditionResponseDto[]> {
    const editions = await this.repository.findEventEditions();
    return editions.map((item) => this.toEventEdition(item));
  }

  async findEventEditionById(eventId: string): Promise<EventEditionResponseDto> {
    const edition = await this.repository.findEventEditionById(eventId);
    if (!edition) {
      throw new NotFoundException(`Event "${eventId}" was not found`);
    }
    return this.toEventEdition(edition);
  }

  private toFilters(query: MaterialQueryDto): MaterialFilters {
    return {
      search: this.optional(query.search),
      topic: this.optional(query.topic),
      tool: this.optional(query.tool),
      system: this.optional(query.system),
      eventSeries: this.optional(query.eventSeries),
      eventEdition: this.optional(query.eventEdition),
      instructor: this.optional(query.instructor),
      resourceType: this.resourceType(query.resourceType),
      page: this.positiveInteger(query.page, 'page', DEFAULT_PAGE),
      pageSize: this.positiveInteger(
        query.pageSize,
        'pageSize',
        DEFAULT_PAGE_SIZE,
        MAX_PAGE_SIZE,
      ),
    };
  }

  private positiveInteger(
    value: string | undefined,
    name: string,
    fallback: number,
    maximum?: number,
  ): number {
    if (value === undefined) return fallback;
    const parsed = Number(value);
    if (
      !Number.isInteger(parsed) ||
      parsed < 1 ||
      (maximum !== undefined && parsed > maximum)
    ) {
      const upperBound = maximum ? ` and at most ${maximum}` : '';
      throw new BadRequestException(
        `${name} must be a positive integer${upperBound}`,
      );
    }
    return parsed;
  }

  private resourceType(value: string | undefined): ResourceType | undefined {
    const normalized = this.optional(value)?.toUpperCase();
    if (!normalized) return undefined;
    if (!Object.values(ResourceType).includes(normalized as ResourceType)) {
      throw new BadRequestException('resourceType is not supported');
    }
    return normalized as ResourceType;
  }

  private optional(value: string | undefined): string | undefined {
    const normalized = value?.trim();
    return normalized || undefined;
  }

  private toMaterialResponse(record: MaterialRecord): MaterialResponseDto {
    return {
      id: record.material.id,
      title: record.material.title,
      description: record.material.description,
      eventEditions: record.eventEditions
        .map((item) => this.toEventEdition(item))
        .sort((left, right) =>
          (left.title ?? '').localeCompare(right.title ?? ''),
        ),
      topics: this.toNamedItems(record.topics),
      tools: this.toNamedItems(record.tools),
      systems: this.toNamedItems(record.systems),
      instructors: this.toNamedItems(record.instructors),
      resources: this.toResources(record.resources),
    };
  }

  private toNamedItems(
    items: Array<{ id: string; name: string }>,
  ): NamedCatalogItemResponseDto[] {
    return items
      .map(({ id, name }) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private toResources(
    resources: ContentResource[],
  ): MaterialResourceResponseDto[] {
    return resources
      .map((resource) => ({
        id: resource.id,
        title: resource.title,
        type: resource.resourceType.toLowerCase(),
        url: resource.canonicalUrl,
        verificationStatus: resource.verificationStatus,
      }))
      .sort((left, right) =>
        (left.title ?? '').localeCompare(right.title ?? ''),
      );
  }

  private toEventEdition(event: EventEdition): EventEditionResponseDto {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      startAt: event.startAt?.toISOString() ?? null,
      endAt: event.endAt?.toISOString() ?? null,
      format: event.format,
      location: event.location,
    };
  }

  private toEventSeries(series: EventSeries): EventSeriesResponseDto {
    return { id: series.id, name: series.name };
  }

  private materialNotFound(materialId: string): NotFoundException {
    return new NotFoundException(`Material "${materialId}" was not found`);
  }
}
