import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { EventSeries, System, Tool, Topic } from './catalog.entity';

abstract class CatalogAlias {
  @PrimaryColumn('text')
  alias!: string;

  @Column('text', { name: 'review_status', nullable: true })
  reviewStatus!: string | null;

  @Column('text', { nullable: true })
  source!: string | null;
}

@Entity({ name: 'event_series_aliases' })
@Index('IDX_event_series_aliases_event_series_id', ['eventSeriesId'])
@Index('UQ_event_series_aliases_normalized', { synchronize: false })
export class EventSeriesAlias extends CatalogAlias {
  @PrimaryColumn('text', { name: 'event_series_id' })
  eventSeriesId!: string;

  @ManyToOne(() => EventSeries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_series_id' })
  eventSeries!: EventSeries;
}

@Entity({ name: 'topic_aliases' })
@Index('IDX_topic_aliases_topic_id', ['topicId'])
@Index('UQ_topic_aliases_normalized', { synchronize: false })
export class TopicAlias extends CatalogAlias {
  @PrimaryColumn('text', { name: 'topic_id' })
  topicId!: string;

  @ManyToOne(() => Topic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic!: Topic;
}

@Entity({ name: 'tool_aliases' })
@Index('IDX_tool_aliases_tool_id', ['toolId'])
@Index('UQ_tool_aliases_normalized', { synchronize: false })
export class ToolAlias extends CatalogAlias {
  @PrimaryColumn('text', { name: 'tool_id' })
  toolId!: string;

  @ManyToOne(() => Tool, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tool_id' })
  tool!: Tool;
}

@Entity({ name: 'system_aliases' })
@Index('IDX_system_aliases_system_id', ['systemId'])
@Index('UQ_system_aliases_normalized', { synchronize: false })
export class SystemAlias extends CatalogAlias {
  @PrimaryColumn('text', { name: 'system_id' })
  systemId!: string;

  @ManyToOne(() => System, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'system_id' })
  system!: System;
}
