import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { CatalogSnapshot } from './catalog-snapshot.entity';
import {
  ContentResource,
  EventEdition,
  EventSeries,
  Person,
  System,
  Tool,
  Topic,
  TrainingMaterial,
} from './catalog.entity';

abstract class CatalogRelationship {
  @PrimaryColumn('text', { name: 'relationship_id' })
  relationshipId!: string;

  @Column('text', { name: 'snapshot_id' })
  snapshotId!: string;

  @Column('text')
  evidence!: string;

  @Column('text', { name: 'extraction_method' })
  extractionMethod!: string;

  @Column('text', { name: 'review_status' })
  reviewStatus!: string;

  @Column('text', { name: 'trust_class' })
  trustClass!: string;

  @Column('text', { name: 'source_document' })
  sourceDocument!: string;

  @ManyToOne(() => CatalogSnapshot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'snapshot_id' })
  snapshot!: CatalogSnapshot;
}

@Entity({ name: 'event_series_editions' })
@Unique('UQ_event_series_editions_pair', ['eventSeriesId', 'eventEditionId'])
@Unique('UQ_event_series_editions_event_edition_id', ['eventEditionId'])
@Index('IDX_event_series_editions_snapshot_id', ['snapshotId'])
@Index('IDX_event_series_editions_event_series_id', ['eventSeriesId'])
export class EventSeriesEdition extends CatalogRelationship {
  @Column('text', { name: 'event_series_id' })
  eventSeriesId!: string;

  @Column('text', { name: 'event_edition_id' })
  eventEditionId!: string;

  @ManyToOne(() => EventSeries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_series_id' })
  eventSeries!: EventSeries;

  @ManyToOne(() => EventEdition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_edition_id' })
  eventEdition!: EventEdition;
}

@Entity({ name: 'event_materials' })
@Unique('UQ_event_materials_pair', ['eventEditionId', 'materialId'])
@Index('IDX_event_materials_snapshot_id', ['snapshotId'])
@Index('IDX_event_materials_event_edition_id', ['eventEditionId'])
@Index('IDX_event_materials_material_id', ['materialId'])
export class EventMaterial extends CatalogRelationship {
  @Column('text', { name: 'event_edition_id' })
  eventEditionId!: string;

  @Column('text', { name: 'material_id' })
  materialId!: string;

  @ManyToOne(() => EventEdition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_edition_id' })
  eventEdition!: EventEdition;

  @ManyToOne(() => TrainingMaterial, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'material_id' })
  material!: TrainingMaterial;
}

@Entity({ name: 'material_resources' })
@Unique('UQ_material_resources_pair', ['materialId', 'resourceId'])
@Index('IDX_material_resources_snapshot_id', ['snapshotId'])
@Index('IDX_material_resources_material_id', ['materialId'])
@Index('IDX_material_resources_resource_id', ['resourceId'])
export class MaterialResource extends CatalogRelationship {
  @Column('text', { name: 'material_id' })
  materialId!: string;

  @Column('text', { name: 'resource_id' })
  resourceId!: string;

  @ManyToOne(() => TrainingMaterial, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'material_id' })
  material!: TrainingMaterial;

  @ManyToOne(() => ContentResource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resource_id' })
  resource!: ContentResource;
}

@Entity({ name: 'material_topics' })
@Unique('UQ_material_topics_pair', ['materialId', 'topicId'])
@Index('IDX_material_topics_snapshot_id', ['snapshotId'])
@Index('IDX_material_topics_material_id', ['materialId'])
@Index('IDX_material_topics_topic_id', ['topicId'])
export class MaterialTopic extends CatalogRelationship {
  @Column('text', { name: 'material_id' })
  materialId!: string;

  @Column('text', { name: 'topic_id' })
  topicId!: string;

  @ManyToOne(() => TrainingMaterial, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'material_id' })
  material!: TrainingMaterial;

  @ManyToOne(() => Topic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic!: Topic;
}

@Entity({ name: 'material_tools' })
@Unique('UQ_material_tools_pair', ['materialId', 'toolId'])
@Index('IDX_material_tools_snapshot_id', ['snapshotId'])
@Index('IDX_material_tools_material_id', ['materialId'])
@Index('IDX_material_tools_tool_id', ['toolId'])
export class MaterialTool extends CatalogRelationship {
  @Column('text', { name: 'material_id' })
  materialId!: string;

  @Column('text', { name: 'tool_id' })
  toolId!: string;

  @ManyToOne(() => TrainingMaterial, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'material_id' })
  material!: TrainingMaterial;

  @ManyToOne(() => Tool, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tool_id' })
  tool!: Tool;
}

@Entity({ name: 'material_systems' })
@Unique('UQ_material_systems_pair', ['materialId', 'systemId'])
@Index('IDX_material_systems_snapshot_id', ['snapshotId'])
@Index('IDX_material_systems_material_id', ['materialId'])
@Index('IDX_material_systems_system_id', ['systemId'])
export class MaterialSystem extends CatalogRelationship {
  @Column('text', { name: 'material_id' })
  materialId!: string;

  @Column('text', { name: 'system_id' })
  systemId!: string;

  @ManyToOne(() => TrainingMaterial, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'material_id' })
  material!: TrainingMaterial;

  @ManyToOne(() => System, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'system_id' })
  system!: System;
}

@Entity({ name: 'material_instructors' })
@Unique('UQ_material_instructors_pair', ['materialId', 'personId'])
@Index('IDX_material_instructors_snapshot_id', ['snapshotId'])
@Index('IDX_material_instructors_material_id', ['materialId'])
@Index('IDX_material_instructors_person_id', ['personId'])
export class MaterialInstructor extends CatalogRelationship {
  @Column('text', { name: 'material_id' })
  materialId!: string;

  @Column('text', { name: 'person_id' })
  personId!: string;

  @ManyToOne(() => TrainingMaterial, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'material_id' })
  material!: TrainingMaterial;

  @ManyToOne(() => Person, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'person_id' })
  person!: Person;
}
