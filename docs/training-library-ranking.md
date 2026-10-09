# Training Library pagination and ranking

`GET /api/v1/materials` defaults to `page=1&pageSize=10&sort=recommended`.
Other existing API consumers may still request a page size between 1 and 100.
The Training Library frontend always requests exactly one page of size 10.
The final page of a filtered result may contain fewer than ten records.

The response includes `items`, `page`, `pageSize`, `total`, `totalPages`,
`sort`, and `rankingVersion: "recommended-v1"`. Count, filtering, and ordering
run in PostgreSQL before LIMIT/OFFSET. Relationship hydration receives only
the selected page's IDs. No schema migration or pipeline change is required.

## recommended-v1 ordering

This is a lexicographic rank tuple, not a weighted sum. Earlier factors take
priority over every later factor:

1. Resource tier descending: 2 if any eligible canonical HTTP(S) resource has
   `content_verified` or `source_verified`; 1 if any eligible resource exists
   without those verification signals; 0 otherwise. Eligibility excludes
   `CATALOG_METADATA`, malformed/non-HTTP URLs, `/tree/unknown/` and
   `/blob/unknown/` paths, known failed/private verification, and
   error/broken/unavailable/private/deleted status. Resource count earns no
   bonus, so a large repository does not outrank a focused tutorial by volume.
2. Search relevance, when searching: for `searchMode=phrase`, exact title = 3,
   title containing the phrase = 2, description containing it = 1. The default
   `searchMode=websearch` retains the original Gateway full-text matching and
   uses PostgreSQL `ts_rank_cd` for relevance.
3. Content completeness descending, 0–2: one point for a trimmed title of at
   least five characters that is not an explicit placeholder; one for a
   description of at least forty characters that is not a known placeholder.
4. Latest linked event `start_at` descending, missing dates last. This uses
   the event date, not ingestion time or the request's current clock.
5. Metadata completeness descending, 0–4: one point each for the presence of
   topic, tool, system, and instructor relationships. No quantity bonus.
6. Lowercase original title ascending with C collation, then unique material
   ID ascending. Ties are deterministic for an unchanged active snapshot.

`sort=title` is the explicit alphabetical alternative. The frontend preserves
the selected sort in the URL through filtering and paging; recommended is
the default. The schema has no material-level featured flag. Relationship
review/extraction fields are not treated as featured-material endorsements.

## Search and filters

The frontend explicitly uses `searchMode=phrase` to retain its prior literal,
case-insensitive phrase-within-title-or-description behavior. Whitespace is
normalized and SQL wildcard characters are escaped. Default Gateway websearch
semantics remain available to existing consumers. Moving the former client
filter into the query makes counts and page boundaries agree with results.

Topic, tool, system, and instructor accept an exact catalog ID or a
case-insensitive catalog name, preserving older named-filter links. Event
series and edition accept IDs. `resourceType` retains its existing enum.
The new `date=YYYY-MM-DD` filter matches a linked event's UTC calendar date.
All predicates are combined before counting/paging and remain scoped to the
active snapshot. Catalog-wide topic/tool/system lookup endpoints supply
dropdown options independently of the current page. Changing/removing a
filter resets page 1; pagination preserves the full filter and sort query.

## Limitations and verification

Verification is stored source evidence, not a current HTTP health/public-access
check. Text completeness is an explicit heuristic, not semantic review; raw
Markdown may satisfy the length threshold. Missing event dates cannot be
reconstructed here. Snapshot changes between page requests may alter page
membership; there is no cross-request snapshot-pinning token in this change.
Correlated ranking subqueries add work compared with an alphabetical page.

Focused PostgreSQL tests are opt-in and connect only to `127.0.0.1`, database
`ranking_test`, with disposable credentials. They create and remove a dedicated
test schema; they never use configured cloud DB credentials. Example:

```powershell
$env:TRAINING_LIBRARY_TEST_PORT = '18093'
npx jest --runInBand --runTestsByPath src/training-library/persistence/training-library.repository.spec.ts src/training-library/training-library.module.spec.ts src/training-library/dto/material-query.dto.spec.ts
```

The external implementation handoff records exact commits, tests, the frozen
530-record catalog audit, and paired local benchmark results.
