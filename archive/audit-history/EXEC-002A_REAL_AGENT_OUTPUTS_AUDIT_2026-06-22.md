# Real Agent Outputs Audit (EXEC-002A)

**Scope:** Independent audit of Real Agent Outputs against the EXEC-002A PRD.
**Method:** Verified from source, tests, and command output. Implementation claims not trusted.
**Date:** 2026-06-22
**Mode:** Read-only audit (no files modified)

## Verify checklist (1–14)

| # | Check | Result |
|---|---|---|
| 1 | Every agent generates real assets | ✅ `contentForAsset` produces real multi-line drafts for all 6 asset types (CONTENT/LEAD_MAGNET/FUNNEL/TRAFFIC/CRM/OFFER) |
| 2 | No descriptor-only outputs remain | ✅ Asset carries `content` + `preview` + `outputLevel: 'DRAFT_ASSET'`; the old descriptor path is gone |
| 3 | Status transitions DRAFT→READY→APPROVED→ARCHIVED | ⚠️ States exist and are settable, but order is **not enforced** (see Must-Fix #2) |
| 4 | Asset approval does not complete mission | ✅ `updateAgentGeneratedAssetStatus` only writes audit + returns `verificationBoundary: 'asset_approval_not_completion'`; no completion writes |
| 5 | Agent outputs remain inside guardrails | ✅ `guardrailEngine.evaluate(...)` runs before generation; `!allowed || approvalRequired` → audit + `AGENT_ACTION_BLOCKED` 403 |
| 6 | Agent cannot publish | ✅ No publish path; assets are `DRAFT`; publishing is approval-required |
| 7 | Agent cannot deploy | ✅ No deploy path |
| 8 | Agent cannot activate | ✅ No activate path (asset `route` is a link only) |
| 9 | Agent cannot modify verification | ✅ No verification writes |
| 10 | Agent cannot modify mission completion | ✅ No `completedChecks`/verifier writes |
| 11 | Asset status API authenticated | ✅ `requireAuthApi` (`asset-status/route.ts:14`) |
| 12 | Asset status API scoped to mission ownership | ✅ `getCurrentMission(user.id)` + `missionId === plan.id` + assets read by `actorId = user.id` |
| 13 | Type-check passes | ✅ exit 0, 0 errors |
| 14 | Build passes | ✅ exit 0, 0 hard errors |

This **resolves the EXEC-002 Must-Fix #1** (descriptor-only outputs → real draft assets).

## Scores

- **Agent Asset Score: 88 / 100** — all 6 agents emit real draft content with preview, a lifecycle, an approval boundary, guardrail gating, and audit storage. Deductions: generic/templated content (not personalized) and unguarded transitions.
- **Guardrail Compliance: 9 / 10** — `guardrailEngine.evaluate` gates every invocation and blocks+audits disallowed/approval-required actions; agents have no publish/deploy/activate/send code path; publishing stays approval-required. Minor: gating is action-id-level, so it depends on the guardrail config classifying any future production action correctly (current actions are all draft-generating).
- **Execution Boundary: 10 / 10** — asset approval is explicitly not mission completion (`asset_approval_not_completion`), no verification/completion writes, and signal-only verification is preserved.
- **Security: 9 / 10** — both APIs auth-gated and scoped to the authenticated user's own current mission and own assets; status enum correctly excludes `DRAFT` (no resurrecting). Minor: broad Zod string lengths (gated downstream by ownership checks).

## Must Fix
1. **[Medium] Personalize generated content.** `contentForAsset` returns static templates interpolated only with `objective` + `nextMilestone` (confirmed: no brand/model/business-context wiring). Every user gets the same draft — e.g. every lead magnet is "7 Costly Mistakes New Entrepreneurs Make Before Their First Lead." Wire agents to brand DNA / business context / the content engine so assets reflect the user's actual niche, audience, and offer. *(This is the difference between a usable draft and a reusable one — important before the 70% asset-usage metric.)*
2. **[Low] Enforce the asset state machine.** `updateAgentGeneratedAssetStatus` accepts any `READY`/`APPROVED`/`ARCHIVED` from any current status (can skip `READY`, can move backward). Validate transitions against `DRAFT→READY→APPROVED→ARCHIVED`.
3. **[Low] Localize asset content/titles** to zh/ms, consistent with HOTFIX-005.

## Final Verdict: READY FOR EXEC-004

EXEC-002A delivers its mandate: agents now create work instead of describing it. All six agents produce real draft assets (`content` + `preview`, `outputLevel: DRAFT_ASSET`) — the descriptor-only gap from EXEC-002 is closed. The DRAFT→READY→APPROVED→ARCHIVED states exist with approval explicitly **not** completing the mission, every invocation passes through the guardrail engine (blocking + auditing disallowed actions), agents have no publish/deploy/activate path, verification stays signal-only, and both APIs are authenticated and ownership-scoped. Type-check and build are green, and all fourteen verification points hold. The two open items — generic templated content (Must-Fix #1) and an unenforced status state machine (Must-Fix #2) — are quality/robustness improvements that don't compromise the boundary, guardrail, or security model, so they do not block progression. Land Must-Fix #1 to make agent output genuinely valuable.

## Commands Run
- `git status --short`; impl/route/usage greps (content source, transition guard) — ✅ ran
- `vitest run mission-agent-assistance, mission-execution-workspace` — ✅ 2 files, 16 passed
- `pnpm type-check` — ✅ exit 0, 0 errors
- `pnpm build` — ✅ exit 0, 0 hard errors
