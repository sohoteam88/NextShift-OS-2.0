# Dead Navigation Report

Date: 2026-06-19

## Static Checks

Command pattern coverage:

- `href="#"`
- `onClick={() => {}}`
- `onClick` containing only `console.log`
- hard-coded `disabled={true}`
- visible `Coming Soon`
- visible `coming soon`

Result after remediation: no matches in `src/app`, `src/modules`, or `src/components` for the high-risk patterns above.

## Dead Navigation Findings

| Severity | Surface | Button / Control | Current Result | Remediation | Status |
| --- | --- | --- | --- | --- | --- |
| P0 | Admin Command Center | Passive KPI cards: `本周新增`, `租户` | Rendered as buttons but had no click handler | Render as `div` when no `onClick` exists | FIXED |
| P0 | Funnel Preview | Preview form submit | Rendered as a button without submit behavior | Render as non-interactive preview element | FIXED |
| P0 | Funnel Preview | Preview hero / CTA buttons without `onCtaClick` | Rendered as buttons without behavior | Render as non-interactive preview elements when no handler exists | FIXED |
| P0 | Legacy public funnel route | Public CTA / form rendering | Used preview renderer, so form and CTA behavior could be dead | Switched to `PublicSectionRenderer` | FIXED |
| P2 | Content Engine calendar | Generate 30 / 90 / 180 days | Generation succeeded but content was not visible in the UI | Added generated item preview list | FIXED |

## Verified Navigation Paths

| Route | Destination / Action | Status |
| --- | --- | --- |
| `/dashboard` | Current mission route mapping from mission stage | PASS |
| `/journey` | Current journey action routing | PASS |
| `/content-engine` | Post generation, calendar generation, copy | PASS |
| `/brand-builder/step/complete` | Completion API calls and `/dashboard` push | PASS |
| `/brand-builder/intelligence` | Back to Brand Builder link | PASS |
| `/admin` command center | Admin quick actions and back navigation | PASS |
| `/ai-workforce` | Team and agent execution mutations | PASS |
| `/settings` | Language, password, logout actions | PASS |

## Residual Risk

This pass was source-level and static. It proves the known dead-button patterns are removed, but it does not replace a full authenticated browser click-through across every tenant/data state.
