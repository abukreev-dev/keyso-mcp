# Keys.so API Use Cases

Use this file only after the task intent is known.

## Quick routing

- Domain snapshot and overview: `/report/simple/domain_dashboard`
- Keyword snapshot and SERP mix: `/report/simple/keyword_dashboard`
- Organic keywords/pages/competitors: `/report/simple/organic/*`
- Context ads/competitors/keywords: `/report/simple/context/*`
- Backlinks/outlinks analytics: `/report/simple/links/*`
- Group reports lifecycle: `/report/group`, `/report/group/state/<rid>`, `/report/group/*/<rid>`
- Comparison reports: `/report/compare?view=organic|context|backlinks`
- SERP projects: `/serp`, `/serp/<id>/*`
- Monitoring projects: `/monitoring`, `/monitoring/<id>/*`
- AI tracker projects: `/ai_tracker`, `/ai_tracker/<id>/*`
- Wordstat projects: `/wordstat/*`
- Tools (batch processing and expansions): `/tools/*`

## Minimal workflows

### 1) Domain quick audit

1. `/report/simple/domain_dashboard` with `domain`, `base`.
2. Optional deep dive:
   - `/report/simple/organic/keywords`
   - `/report/simple/organic/concurents`
   - `/report/simple/links/backlinks`

### 2) Keyword quick audit

1. `/report/simple/keyword_dashboard` with `keyword`, `base`.
2. Expand semantics if needed:
   - `/report/simple/similarkeys`
   - `/tools/suggest`

### 3) Competitor overlap by domain

1. `/report/simple/organic/concurents`.
2. `/report/compare?view=organic` for direct side-by-side.

### 4) Paid search snapshot

1. `/report/simple/context/keywords`
2. `/report/simple/context/concurents`
3. `/report/simple/direct/domain`

### 5) Link profile snapshot

1. `/report/simple/links/backlinks`
2. `/report/simple/links/backlinks-domains`
3. `/report/simple/links/outlinks`

## Notes

- Most list endpoints support `sort`, `page`, `per_page`, and `filter`.
- Use `base=msk` unless user asks another region/base.
- For path placeholders like `<id>`, pass tool arg `id`.
