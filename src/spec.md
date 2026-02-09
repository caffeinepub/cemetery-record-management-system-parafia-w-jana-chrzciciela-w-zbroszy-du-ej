# Specification

## Summary
**Goal:** Improve overall application performance and make grave searching faster and smoother in both public and admin interfaces.

**Planned changes:**
- Debounce grave search inputs in both public search and admin management views to avoid full filtering/re-rendering on every keystroke.
- Optimize in-memory search by precomputing and reusing normalized searchable strings/fields for grave records (public and admin) instead of re-normalizing on each filter run.
- Add backend paginated, case-insensitive grave search endpoints for public-safe results and for full admin results (matching current substring-search semantics).
- Update frontend to use backend paginated search when a non-empty query is present, while keeping existing non-search loading/browsing behavior when the query is empty.

**User-visible outcome:** Grave search feels more responsive during typing, avoids UI stalls on large datasets, and returns results faster by using server-side paginated searching when a query is entered (without exposing restricted fields in public search).
