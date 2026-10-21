import { applyDecorators, Header } from '@nestjs/common';

export const PUBLIC_CATALOG_CACHE_CONTROL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=3600';

export function PublicCatalogCache() {
  return applyDecorators(Header('Cache-Control', PUBLIC_CATALOG_CACHE_CONTROL));
}
