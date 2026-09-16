export interface NamedCatalogItemResponseDto {
  id: string;
  name: string;
}

export interface EventEditionResponseDto {
  id: string;
  title: string | null;
  description: string | null;
  startAt: string | null;
  endAt: string | null;
  format: string | null;
  location: string | null;
}

export interface EventSeriesResponseDto {
  id: string;
  name: string;
}

export interface MaterialResourceResponseDto {
  id: string;
  title: string | null;
  type: string;
  url: string | null;
  verificationStatus: string | null;
}

export interface MaterialResponseDto {
  id: string;
  title: string | null;
  description: string | null;
  eventEditions: EventEditionResponseDto[];
  topics: NamedCatalogItemResponseDto[];
  tools: NamedCatalogItemResponseDto[];
  systems: NamedCatalogItemResponseDto[];
  instructors: NamedCatalogItemResponseDto[];
  resources: MaterialResourceResponseDto[];
}

export interface MaterialPageResponseDto {
  items: MaterialResponseDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
