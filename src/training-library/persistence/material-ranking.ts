/** recommended-v1: lexicographic ordering, evaluated by PostgreSQL before LIMIT.
 * Link verification is catalog evidence, not a live availability guarantee.
 * No clock, randomness, ingestion timestamp, or unsupported featured signal.
 */
export const RESOURCE_TIER_SQL = `coalesce((
  SELECT max(CASE WHEN lower(resource.verification_status) IN ('content_verified', 'source_verified') THEN 2 ELSE 1 END)
  FROM material_resources mr JOIN content_resources resource ON resource.id = mr.resource_id
  WHERE mr.material_id = material.id AND mr.snapshot_id = :snapshotId AND resource.snapshot_id = :snapshotId
    AND resource.resource_type <> 'CATALOG_METADATA'
    AND btrim(coalesce(resource.canonical_url, '')) ~* '^https?://[^/[:space:]]+(/[^[:space:]]*)?$'
    AND resource.canonical_url !~* '/(tree|blob)/unknown(/|$)'
    AND lower(coalesce(resource.status, '')) NOT IN ('error', 'broken', 'unavailable', 'private', 'deleted')
    AND lower(coalesce(resource.verification_status, '')) NOT IN ('failed', 'broken', 'unavailable', 'private')
), 0)`;

export const COMPLETENESS_SQL = `(CASE
  WHEN length(btrim(coalesce(material.title, ''))) >= 5
    AND lower(btrim(material.title)) NOT IN ('untitled', 'untitled material', 'unknown', 'n/a', 'material', 'repository', 'readme')
  THEN 1 ELSE 0 END + CASE
  WHEN length(btrim(coalesce(material.description, ''))) >= 40
    AND lower(btrim(material.description)) NOT IN ('no description available', 'description unavailable')
  THEN 1 ELSE 0 END)`;

export const LATEST_EVENT_DATE_SQL = `(SELECT max(event.start_at)
  FROM event_materials em JOIN event_editions event ON event.id = em.event_edition_id
  WHERE em.material_id = material.id AND em.snapshot_id = :snapshotId AND event.snapshot_id = :snapshotId)`;

export const METADATA_COMPLETENESS_SQL = [
  'material_topics',
  'material_tools',
  'material_systems',
  'material_instructors',
]
  .map(
    (table) =>
      `CASE WHEN EXISTS (SELECT 1 FROM ${table} meta WHERE meta.material_id = material.id AND meta.snapshot_id = :snapshotId) THEN 1 ELSE 0 END`,
  )
  .join(' + ');
