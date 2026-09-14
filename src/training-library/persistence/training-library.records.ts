import {
  ContentResource,
  EventEdition,
  Person,
  System,
  Tool,
  Topic,
  TrainingMaterial,
} from '../../database/entities/catalog.entity';
import { ResourceType } from '../../database/entities/persistence.enums';

export interface MaterialFilters {
  search?: string | undefined;
  topic?: string | undefined;
  tool?: string | undefined;
  system?: string | undefined;
  eventSeries?: string | undefined;
  eventEdition?: string | undefined;
  instructor?: string | undefined;
  resourceType?: ResourceType | undefined;
  page: number;
  pageSize: number;
}

export interface MaterialRecord {
  material: TrainingMaterial;
  eventEditions: EventEdition[];
  topics: Topic[];
  tools: Tool[];
  systems: System[];
  instructors: Person[];
  resources: ContentResource[];
}

export interface MaterialPageRecord {
  items: MaterialRecord[];
  total: number;
}
