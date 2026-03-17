---
name: keyso-api-router
description: Route Keys.so API tasks to minimal relevant endpoints without loading full API context. Use when user asks SEO/domain/keyword/SERP/monitoring analytics via Keys.so and you need focused endpoint selection.
---

# keyso-api-router

Use this skill when tasks involve Keys.so API and the full endpoint surface is too large for context-efficient work.

## Goal

Select the smallest relevant endpoint set for the user task, call only those endpoints, and avoid loading full API docs unless required.

## Default workflow

1. Identify task intent in one of these buckets:
   - domain overview
   - keyword analysis
   - organic competitors/keywords/pages
   - context ads
   - links/backlinks
   - report groups / compare reports
   - monitoring / ai tracker / serp / wordstat
2. Read `references/use-cases.md` and pick the minimum endpoint set (1-3 endpoints first).
3. Execute API calls via MCP tools.
   - Prefer specific auto-generated tools when obvious.
   - Fallback to `keyso_api_request` when tool name is unclear.
4. Expand only if the first result is insufficient.
5. Return concise analytical answer with key numbers and assumptions.

## Context control rules

- Do not load all endpoint docs by default.
- Use `references/endpoint-groups.tsv` first to find the right API family.
- Open `references/endpoints.txt` only for exact endpoint lookup.
- If user asks a narrow question, use one endpoint first.
- If user asks broad audit, start with dashboard endpoint, then deepen selectively.

## Files

- `references/use-cases.md`: routing by task intent and minimal workflows.
- `references/endpoint-groups.tsv`: compact map of endpoint families and counts.
- `references/endpoints.txt`: full endpoint list extracted from OpenAPI.

## Practical defaults

- Default `base=msk` when base is required and user did not specify one.
- For placeholders like `<id>` / `<uid>` / `<rid>`, map to tool args `id` / `uid` / `rid`.
- If API returns async `state`, poll corresponding `.../state/...` endpoint before fetching report data.
