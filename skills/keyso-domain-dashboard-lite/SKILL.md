---
name: keyso-domain-dashboard-lite
description: Minimal Keys.so skill for one-endpoint domain snapshot using /report/simple/domain_dashboard only. Use for ultra-fast single-domain checks with the lowest possible context footprint.
---

# keyso-domain-dashboard-lite

Use this skill only for single-domain quick checks.

## Scope

- One endpoint only: `/report/simple/domain_dashboard`
- Required input: `domain`
- Optional input: `base` (default `msk`)

If user asks anything beyond one domain snapshot (competitors, links, keyword expansion, compare, monitoring), switch to `keyso-quick-audit` or `keyso-api-router`.

## Workflow

1. Call `/report/simple/domain_dashboard`.
2. Extract only key top-level metrics.
3. Return short snapshot and one optional next-step suggestion.

## Output focus

- Domain and base
- `dr`
- `it10`, `it50`
- `vis`
- `adcost` and `adtraf` (if available)
- `aiAnswersCnt` and `aiState` (if available)

## Defaults

- If `base` not specified: `base=msk`.
- Prefer generated MCP tool for this endpoint.
- Fallback to `keyso_api_request` if needed.
