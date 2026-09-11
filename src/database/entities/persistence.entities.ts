import {
  EventSeriesAlias,
  SystemAlias,
  ToolAlias,
  TopicAlias,
} from './catalog-alias.entity';
import {
  EventMaterial,
  EventSeriesEdition,
  MaterialInstructor,
  MaterialResource,
  MaterialSystem,
  MaterialTool,
  MaterialTopic,
} from './catalog-relationship.entity';
import { CatalogSnapshot } from './catalog-snapshot.entity';
import {
  ContentResource,
  ContentResourceFile,
  EventEdition,
  EventSeries,
  Person,
  System,
  Tool,
  Topic,
  TrainingMaterial,
} from './catalog.entity';
import { ChunkEmbedding } from './chunk-embedding.entity';
import { ContentChunk } from './content-chunk.entity';
import { SnapshotImportError } from './snapshot-import-error.entity';
import { SnapshotImportRun } from './snapshot-import-run.entity';

export const persistenceEntities = [
  CatalogSnapshot,
  SnapshotImportRun,
  SnapshotImportError,
  EventSeries,
  EventEdition,
  TrainingMaterial,
  ContentResource,
  ContentResourceFile,
  Person,
  Topic,
  Tool,
  System,
  EventSeriesAlias,
  TopicAlias,
  ToolAlias,
  SystemAlias,
  EventSeriesEdition,
  EventMaterial,
  MaterialResource,
  MaterialTopic,
  MaterialTool,
  MaterialSystem,
  MaterialInstructor,
  ContentChunk,
  ChunkEmbedding,
] as const;
