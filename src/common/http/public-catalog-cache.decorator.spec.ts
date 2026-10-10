import { PUBLIC_CATALOG_CACHE_CONTROL } from './public-catalog-cache.decorator';

describe('public catalog cache control', () => {
  it('keeps browser freshness bounded and permits shared stale reuse', () => {
    expect(PUBLIC_CATALOG_CACHE_CONTROL).toBe(
      'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
    );
  });
});
