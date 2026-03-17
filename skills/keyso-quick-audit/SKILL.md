---
name: keyso-quick-audit
description: Ultra-light Keys.so skill for quick domain or keyword audits only. Use for fast snapshots without loading broad API routing context.
---

# keyso-quick-audit

Use this skill only for short diagnostic tasks:
- quick domain snapshot
- quick keyword snapshot
- optional one-step deepening (one extra endpoint)

If user asks monitoring, clustering, group reports, compare reports, or long multi-step research, switch to `keyso-api-router`.

## Workflow

1. Detect intent:
   - domain audit
   - keyword audit
2. Run exactly one primary endpoint first.
3. Add at most one follow-up endpoint if user explicitly asks for deeper detail.
4. Return concise result with key metrics only.

## Primary endpoints

- Domain audit: `/report/simple/domain_dashboard` (`domain`, `base`)
- Keyword audit: `/report/simple/keyword_dashboard` (`keyword`, `base`)

## Optional follow-up endpoints (choose one)

- Domain competitors: `/report/simple/organic/concurents`
- Domain top keywords: `/report/simple/organic/keywords`
- Keyword expansions: `/report/simple/similarkeys`

## Defaults

- Default `base=msk` if missing.
- Prefer specific auto-generated MCP tools.
- If tool name is unclear, use generic `keyso_api_request`.
