import { Injectable } from '@nestjs/common';
import { DataSource, In, SelectQueryBuilder } from 'typeorm';
import {
  EventMaterial,
  MaterialInstructor,
  MaterialResource,
  MaterialSystem,
  MaterialTool,
  MaterialTopic,
} from '../../database/entities/catalog-relationship.entity';
import {
  ContentResource,
  EventEdition,
  EventSeries,
  System,
  Tool,
  Topic,
  TrainingMaterial,
} from '../../database/entities/catalog.entity';
import { ActiveSnapshotQuery } from './active-snapshot.query';
import {
  MaterialFilters,
  MaterialPageRecord,
  MaterialRecord,
} from './training-library.records';

@Injectable()
export class TrainingLibraryRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly activeSnapshot: ActiveSnapshotQuery,
  ) {}

  async findMaterials(filters: MaterialFilters): Promise<MaterialPageRecord> {
    const snapshotId = await this.activeSnapshot.findId();
    if (!snapshotId) return { items: [], total: 0 };

    const query = this.dataSource
      .getRepository(TrainingMaterial)
      .createQueryBuilder('material')
      .where('material.snapshotId = :snapshotId', { snapshotId });

    this.applyFilters(query, filters, snapshotId);
    const [materials, total] = await query
      .orderBy('lower(material.title)', 'ASC')
      .addOrderBy('material.id', 'ASC')
      .skip((filters.page - 1) * filters.pageSize)
      .take(filters.pageSize)
      .getManyAndCount();

    return { items: await this.hydrate(materials, snapshotId), total };
  }

  async findMaterialById(materialId: string): Promise<MaterialRecord | null> {
    const snapshotId = await this.activeSnapshot.findId();
    if (!snapshotId) return null;

    const material = await this.dataSource
      .getRepository(TrainingMaterial)
      .findOne({ where: { id: materialId, snapshotId } });
    if (!material) return null;

    return (await this.hydrate([material], snapshotId))[0] ?? null;
  }

  async findResourcesByMaterialId(
    materialId: string,
  ): Promise<ContentResource[] | null> {
    const record = await this.findMaterialById(materialId);
    return record?.resources ?? null;
  }

  async findTopics(): Promise<Topic[]> {
    const snapshotId = await this.activeSnapshot.findId();
    if (!snapshotId) return [];
    return this.dataSource.getRepository(Topic).find({
      where: { snapshotId },
      order: { name: 'ASC', id: 'ASC' },
    });
  }

  async findTools(): Promise<Tool[]> {
    const snapshotId = await this.activeSnapshot.findId();
    if (!snapshotId) return [];
    return this.dataSource.getRepository(Tool).find({
      where: { snapshotId },
      order: { name: 'ASC', id: 'ASC' },
    });
  }

  async findSystems(): Promise<System[]> {
    const snapshotId = await this.activeSnapshot.findId();
    if (!snapshotId) return [];
    return this.dataSource.getRepository(System).find({
      where: { snapshotId },
      order: { name: 'ASC', id: 'ASC' },
    });
  }

  async findEventSeries(): Promise<EventSeries[]> {
    const snapshotId = await this.activeSnapshot.findId();
    if (!snapshotId) return [];
    return this.dataSource.getRepository(EventSeries).find({
      where: { snapshotId },
      order: { name: 'ASC', id: 'ASC' },
    });
  }

  async findEventSeriesById(seriesId: string): Promise<EventSeries | null> {
    const snapshotId = await this.activeSnapshot.findId();
    if (!snapshotId) return null;

    return this.dataSource
      .getRepository(EventSeries)
      .findOne({ where: { id: seriesId, snapshotId } });
  }

  async findEventEditions(): Promise<EventEdition[]> {
    const snapshotId = await this.activeSnapshot.findId();
    if (!snapshotId) return [];
    return this.dataSource.getRepository(EventEdition).find({
      where: { snapshotId },
      order: { startAt: 'DESC', title: 'ASC', id: 'ASC' },
    });
  }

  async findEventEditionById(eventId: string): Promise<EventEdition | null> {
    const snapshotId = await this.activeSnapshot.findId();
    if (!snapshotId) return null;
    return this.dataSource
      .getRepository(EventEdition)
      .findOne({ where: {id: eventId, snapshotId} });
  }

  private applyFilters(
    query: SelectQueryBuilder<TrainingMaterial>,
    filters: MaterialFilters,
    snapshotId: string,
  ): void {
    if (filters.search) {
      query.andWhere(
        `to_tsvector('simple', coalesce(material.title, '') || ' ' || coalesce(material.description, '')) @@ websearch_to_tsquery('simple', :search)`,
        { search: filters.search },
      );
    }
    this.applyRelationshipFilters(query, filters, snapshotId);
  }

  private applyRelationshipFilters(
    query: SelectQueryBuilder<TrainingMaterial>,
    filters: MaterialFilters,
    snapshotId: string,
  ): void {
    this.addExists(query, 'material_topics', 'topic_id', filters.topic, {
      snapshotId,
    });
    this.addExists(query, 'material_tools', 'tool_id', filters.tool, {
      snapshotId,
    });
    this.addExists(query, 'material_systems', 'system_id', filters.system, {
      snapshotId,
    });
    this.addExists(
      query,
      'material_instructors',
      'person_id',
      filters.instructor,
      { snapshotId },
    );
    this.addExists(
      query,
      'event_materials',
      'event_edition_id',
      filters.eventEdition,
      { snapshotId },
    );
    this.addResourceTypeFilter(query, filters, snapshotId);
    this.addEventSeriesFilter(query, filters, snapshotId);
  }

  private addExists(
    query: SelectQueryBuilder<TrainingMaterial>,
    table: string,
    filterColumn: string,
    filterValue: string | undefined,
    parameters: { snapshotId: string },
  ): void {
    if (!filterValue) return;
    const parameterName = `filter_${filterColumn}`;
    query.andWhere(
      `EXISTS (SELECT 1 FROM ${table} relation WHERE relation.material_id = material.id AND relation.snapshot_id = :snapshotId AND relation.${filterColumn} = :${parameterName})`,
      { ...parameters, [parameterName]: filterValue },
    );
  }

  private addResourceTypeFilter(
    query: SelectQueryBuilder<TrainingMaterial>,
    filters: MaterialFilters,
    snapshotId: string,
  ): void {
    if (!filters.resourceType) return;
    query.andWhere(
      `EXISTS (SELECT 1 FROM material_resources mr JOIN content_resources resource ON resource.id = mr.resource_id WHERE mr.material_id = material.id AND mr.snapshot_id = :snapshotId AND resource.snapshot_id = :snapshotId AND resource.resource_type = :resourceType)`,
      { snapshotId, resourceType: filters.resourceType },
    );
  }

  private addEventSeriesFilter(
    query: SelectQueryBuilder<TrainingMaterial>,
    filters: MaterialFilters,
    snapshotId: string,
  ): void {
    if (!filters.eventSeries) return;
    query.andWhere(
      `EXISTS (SELECT 1 FROM event_materials em JOIN event_series_editions ese ON ese.event_edition_id = em.event_edition_id WHERE em.material_id = material.id AND em.snapshot_id = :snapshotId AND ese.snapshot_id = :snapshotId AND ese.event_series_id = :eventSeries)`,
      { snapshotId, eventSeries: filters.eventSeries },
    );
  }

  private async hydrate(
    materials: TrainingMaterial[],
    snapshotId: string,
  ): Promise<MaterialRecord[]> {
    const materialIds = materials.map(({ id }) => id);
    if (materialIds.length === 0) return [];

    const [topics, tools, systems, instructors, resources, events] =
      await Promise.all([
        this.findMaterialTopics(materialIds, snapshotId),
        this.findMaterialTools(materialIds, snapshotId),
        this.findMaterialSystems(materialIds, snapshotId),
        this.findMaterialInstructors(materialIds, snapshotId),
        this.findMaterialResources(materialIds, snapshotId),
        this.findMaterialEvents(materialIds, snapshotId),
      ]);

    return materials.map((material) => ({
      material,
      topics: topics
        .filter((item) => item.materialId === material.id)
        .map((item) => item.topic),
      tools: tools
        .filter((item) => item.materialId === material.id)
        .map((item) => item.tool),
      systems: systems
        .filter((item) => item.materialId === material.id)
        .map((item) => item.system),
      instructors: instructors
        .filter((item) => item.materialId === material.id)
        .map((item) => item.person),
      resources: resources
        .filter((item) => item.materialId === material.id)
        .map((item) => item.resource),
      eventEditions: events
        .filter((item) => item.materialId === material.id)
        .map((item) => item.eventEdition),
    }));
  }

  private findMaterialTopics(materialIds: string[], snapshotId: string) {
    return this.dataSource.getRepository(MaterialTopic).find({
      where: { materialId: In(materialIds), snapshotId },
      relations: { topic: true },
    });
  }

  private findMaterialTools(materialIds: string[], snapshotId: string) {
    return this.dataSource.getRepository(MaterialTool).find({
      where: { materialId: In(materialIds), snapshotId },
      relations: { tool: true },
    });
  }

  private findMaterialSystems(materialIds: string[], snapshotId: string) {
    return this.dataSource.getRepository(MaterialSystem).find({
      where: { materialId: In(materialIds), snapshotId },
      relations: { system: true },
    });
  }

  private findMaterialInstructors(materialIds: string[], snapshotId: string) {
    return this.dataSource.getRepository(MaterialInstructor).find({
      where: { materialId: In(materialIds), snapshotId },
      relations: { person: true },
    });
  }

  private findMaterialResources(materialIds: string[], snapshotId: string) {
    return this.dataSource.getRepository(MaterialResource).find({
      where: { materialId: In(materialIds), snapshotId },
      relations: { resource: true },
    });
  }

  private findMaterialEvents(materialIds: string[], snapshotId: string) {
    return this.dataSource.getRepository(EventMaterial).find({
      where: { materialId: In(materialIds), snapshotId },
      relations: { eventEdition: true },
    });
  }
}
