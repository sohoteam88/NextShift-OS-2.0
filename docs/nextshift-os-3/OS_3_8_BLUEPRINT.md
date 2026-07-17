# NextShift OS 3.8 Blueprint — Product Usability Recovery

Version: 1.0

Status: Approved — PR #78 merged

Date: 2026-07-15

Owner: ChatGPT Work — Chief Product Architect / Architecture Review Board

Runtime baseline: `v3.7.0` at `28c077f115a4e43c5e11e1097ae06b8744043643`

Governance baseline: `main` after PR #78 at `e2bb12d0161a7ca73e0067001980009045a57ee8`

Parent: [Master Roadmap 2026-07](MASTER_ROADMAP_2026-07.md), Stage A+

Evidence: [Product Usability Audit 2026-07](reviews/PRODUCT_USABILITY_AUDIT_2026-07.md)

Lifecycle: Approved Blueprint; product implementation remains blocked until the one-time Wave Pipeline bootstrap is reviewed and merged.

---

## 1. Executive Decision

OS 3.8 is a recovery release, not a feature expansion release.

The release must turn the current content experience from a read-only AI demonstration into a repeatable working loop:

> Generate → Edit → Save → Reopen → Copy / Publish

No Stage B personalization, new marketplace capability, large navigation redesign, or seed-user acquisition begins before this loop is usable by Steven for seven consecutive days.

## 2. Repository Evidence

The current runtime confirms the product gap:

- `src/app/(auth)/content-engine/page.tsx` mounts `ContentCommandCenter`.
- `ContentCommandCenter.tsx` renders generated calendars, hooks, CTAs, Retail outputs, and Recruitment outputs as read-only text.
- `POST /api/v1/content-engine/generate` calls `contentEngineService.generatePlatformPost()`.
- `generatePlatformPost()` already creates a draft in the canonical Prisma `Content` model, but the active user surface does not expose that draft as an editable, recoverable asset.
- `ContentEngineDashboard.tsx` contains an older copy interaction but is not the active route. It is evidence to reuse selectively, not authority to restore the old page.
- `VideoScriptGenerator.tsx` already contains editing, copying, and draft-saving behavior. Therefore E3 must begin with revalidation instead of assuming the July static audit is still exact.
- `src/config/canonical-routes.ts` is the existing navigation authority; U2/U3 must not create a second route registry.

## 3. Product Outcome

When OS 3.8 closes, a signed-in tenant user can:

1. Generate a content item from the active Content Engine.
2. Edit the generated title and body before using it.
3. Save the edited version as a visible draft.
4. Leave the page and reopen the same draft from a Content Library.
5. Edit and save again without creating an accidental duplicate.
6. Copy the current edited value, not the original AI value.
7. Delete a draft with confirmation.
8. Understand where Content, Video, Lead Magnet, and Webinar live in one approved navigation model.

## 4. Success Gates

### 4.1 Engineering gate

- All acceptance criteria in E1 and E2 pass.
- Tenant isolation tests pass for list, read, update, and delete.
- Type check, lint, unit, integration, build, and targeted E2E pass.
- No regression to Brand DNA gating, Retail/Recruitment workspace behavior, mission progress, or existing published content.

### 4.2 Product gate

- Steven completes one real content loop in production without developer assistance.
- No output is trapped in a read-only state.
- Saved drafts survive refresh and a new browser session.

### 4.3 Dogfood gate

After production verification, Steven uses the real loop for seven consecutive days and records at least one genuine business content action per day.

Dogfood PASS requires:

- seven consecutive active days;
- at least one generated or reopened draft edited and copied/published per day;
- no Blocker or Critical usability finding left open;
- Steven explicitly confirms willingness to continue.

This gate unlocks seed-user acquisition. It does not automatically authorize Stage B.

## 5. Scope and Priority

| Priority | Workstream | Outcome | Dependency |
| --- | --- | --- | --- |
| P0 | E1 — Editable Content Output | Active generated output is editable, saveable, and copyable | Blueprint approval |
| P0 | E2 — Content Library | Saved drafts are visible, reopenable, editable, deletable, and copyable | E1 content contract |
| P0 | U2 — Information Architecture Decision | One-page route map classified as Keep / Merge / Hide | Blueprint approval; Steven decision before U3 |
| P1 | U1 — Dead-code Inventory and Removal | Duplicate/orphan surfaces are proven before removal | E1 stable; inventory before delete |
| P1 | U3 — Navigation Convergence | Navigation follows the approved U2 map | Steven approves U2 |
| P1 | U3A/U3ADR/U3B — Administration Space Separation | Freeze the complete admin inventory, resolve the AuditLog ADR gate, then migrate team and platform administration into isolated page/API namespaces | U3 complete; Steven Amendment A approved |
| P1 | E3 — Pattern Extension | Verified gaps in Video, Lead Magnet, and Webinar use the same working loop | E1/E2 pattern stable; current-state revalidation |

## 6. Workstream E1 — Editable Content Output

### 6.1 Required behavior

- The active Content Engine provides an explicit generate-post action for the selected platform and content intent.
- The returned canonical content ID is retained by the client.
- Title and body are editable with accessible labeled controls.
- Save updates the same draft by ID; it does not silently create a second draft.
- Copy uses the current in-memory edited text.
- Unsaved changes are visible and protected before destructive navigation or regeneration.
- Saving, copying, and generation have clear pending, success, empty, and error states.
- Regenerate is explicit and cannot overwrite a user-edited draft without confirmation.

### 6.2 Default implementation decision

Reuse the existing canonical `Content` model and authenticated API conventions. No Prisma schema or migration is authorized by this Blueprint unless implementation proves the current model cannot meet an acceptance criterion and a separate architecture decision is approved.

The active `ContentCommandCenter` remains the route authority. Useful interaction details may be extracted from `ContentEngineDashboard`, but the inactive dashboard must not be restored wholesale.

### 6.3 E1 acceptance criteria

- Given an authenticated tenant user, when generation succeeds, the response contains a stable content ID and editable title/body.
- Editing title or body marks the draft dirty.
- Saving persists the exact edited values and returns an updated timestamp.
- Copying after editing places the edited value in the clipboard.
- Refreshing after save shows the saved values.
- A failed save preserves unsaved client text and offers retry.
- Another tenant or owner cannot read or mutate the draft by guessing its ID.
- Keyboard-only users can generate, edit, save, and copy.
- Existing calendar generation and Brand DNA gate still work.

## 7. Workstream E2 — Content Library

### 7.1 Required behavior

The Content Library is a user-visible view over canonical `Content` drafts, not a second storage system.

Minimum library fields:

- title or deterministic fallback title;
- platform and type;
- status;
- created and last-updated time;
- short body preview.

Minimum actions:

- list current tenant/user content with pagination or bounded loading;
- filter by status and platform;
- open and edit;
- save the same record;
- copy the current body;
- delete with confirmation and recoverable UI error handling.

### 7.2 E2 acceptance criteria

- A newly saved E1 draft appears in the library without manual database intervention.
- Opening a draft loads the latest saved title/body.
- Updating from the library changes the same record.
- Deleting removes the record from the visible list and cannot affect another tenant.
- Empty, loading, permission-denied, and server-error states are distinct.
- The library does not expose prompts, tenant IDs, or internal metadata.
- List endpoints are bounded and deterministically ordered by `updatedAt` descending.

## 8. Workstream U2 — Information Architecture Decision

U2 produces a one-page artifact before navigation code changes.

For every authenticated route, record:

- canonical route;
- user job;
- navigation entry point;
- Retail / Recruitment applicability;
- status: Keep, Merge, Hide, or Redirect;
- destination when merged or redirected;
- owner and implementation slice.

Decision rules:

- `src/config/canonical-routes.ts` remains the code authority.
- Hide means remove from navigation, not delete data or code automatically.
- Merge or redirect requires preserving deep links where practical.
- Retail and Recruitment may change content emphasis, but must not create two unrelated navigation systems.
- U3 is blocked until Steven approves the entire one-page map.

## 9. Workstream U1 — Dead-Code Governance

U1 is two-step work:

1. Produce an inventory proving route references, imports, dynamic imports, tests, stories, and documentation consumers.
2. Delete only items marked orphaned and approved in the inventory.

Initial candidates include `ContentEngineDashboard` and other duplicate Content dashboards, but the Blueprint does not pre-authorize deletion merely because a static search found no route.

Removal acceptance criteria:

- active capability is migrated or proven duplicate;
- repository search shows no runtime consumer;
- targeted tests and build pass after deletion;
- no capability disappears from the active product;
- the removal PR lists each deleted path and replacement authority.

## 10. Workstream U3 — Navigation Convergence

Implement only the approved U2 decisions.

Required outcomes:

- one canonical navigation model;
- Content Engine and Content Library are discoverable from the same product area;
- active route and page titles use consistent names;
- hidden routes remain directly reachable only when explicitly approved;
- redirects and bookmarks are tested;
- mobile and desktop navigation agree.

### 10.1 Amendment A — Three-Space Administration Isolation

Steven approved Amendment A on 2026-07-17. The member IA keeps the seven desktop destinations and five-slot mobile projection, while administration is split into two isolated backends:

- `/admin/*` and `/api/v1/admin/*` are tenant administration for `leader`/`operator`, with route-level least privilege and session-derived tenant scope only;
- `/superadmin/*` and `/api/v1/superadmin/*` are platform administration for `platform_admin` only;
- member-facing navigation exposes no administration links;
- legacy platform page GET routes use terminal one-hop 301 redirects; mutation APIs never rely on 301/302;
- every superadmin write is audited, and platform-global audit storage requires a separate ADR before any Prisma change.

The implementation is split into U3A (Admin Space Inventory and Security Contract), U3ADR (exact-head Architecture Review and adoption of the machine-readable [AuditLog ADR gate](os-3-8/3.8-C/U3_AUDITLOG_ADR_GATE.json)), and U3B (Three-Space Admin Migration). Historical U3 evidence remains completed and immutable. U3B remains Manifest `blocked` while the ADR artifact is missing, pending, non-PASS, stale, SHA-mismatched, or missing required option-C proof; only a separate exact-head PASS governance adoption may transition it to pending. E3A remains blocked until U3B completes.

## 11. Workstream E3 — Pattern Extension

E3 begins only after U3B completes. It starts with a fresh capability matrix against the authorized planning baseline because Video already demonstrates editing and draft saving.

For each of Video, Lead Magnet, and Webinar:

1. Verify Generate, Edit, Save, Reopen, Copy, and Delete.
2. Reuse the E1/E2 interaction and API pattern where a gap exists.
3. Do not rebuild a capability already present and working.
4. Use the canonical Content Library when the output is a Content record; otherwise document the owning canonical model.

E3 may be reduced or split into OS 3.8.x follow-ups based on the revalidation evidence.

## 12. API and Data Contract

Expected resource contract:

```text
POST   /api/v1/content-engine/generate
GET    /api/v1/content
GET    /api/v1/content/:id
PATCH  /api/v1/content/:id
DELETE /api/v1/content/:id
```

Exact route reuse is an implementation decision after inventory; duplicate APIs must not be added if equivalent authenticated endpoints already exist.

All read and mutation queries must constrain ownership using authenticated user and tenant context. Client-supplied `tenantId` or `ownerId` is never authority.

Update requests use explicit schemas, bounded field lengths, and an allowlist of mutable fields. Prompt and AI-generation audit fields are not client-editable.

## 13. Analytics and Privacy

Minimum events:

- `content_generated`
- `content_edit_started`
- `content_saved`
- `content_reopened`
- `content_copied`
- `content_deleted`
- `content_loop_completed`

Event properties may include content ID, platform, type, workspace type, and status. They must not include full content body, prompt text, personal data, or secrets.

The Dogfood dashboard must distinguish a generated event from a completed loop; generation alone is not success.

## 14. Verification Plan

### Unit

- request schema and mutable-field allowlist;
- dirty-state and copy-current-value behavior;
- content ownership predicates;
- deterministic list ordering and filters.

### Integration

- generate creates one canonical draft;
- update persists edited fields to the same record;
- list/read/update/delete enforce tenant and owner scope;
- failed update does not erase client work;
- mission progress remains idempotent.

### E2E

- Steven path: generate → edit → save → leave → library → reopen → edit → save → copy;
- delete confirmation and cancellation;
- another-tenant access returns a non-disclosing denial;
- Retail and Recruitment paths;
- keyboard and narrow viewport smoke tests.

### Visual QA

Capture active Content Engine, editor states, library states, confirmation dialog, errors, and mobile navigation. Screenshots are evidence, not a replacement for interaction tests.

## 15. Wave Delivery Plan and Stop Points

OS 3.8 executes through the machine-readable [Pipeline Manifest](os-3-8/PIPELINE_MANIFEST.json) and the [Wave Execution Contract](os-3-8/WAVE_EXECUTION_CONTRACT.md).

Before product implementation starts, Codex must complete the one-time [Pipeline Upgrade Execution Task](os-3-8/PIPELINE_UPGRADE_EXECUTION_TASK.md) in a separate bootstrap PR. That PR creates the canonical runner under `scripts/os-pipeline/`; this Blueprint PR does not add or run executable pipeline code.

| Wave | Ordered tasks | Automatic continuation | Stop point |
| --- | --- | --- | --- |
| W1 — Content Working Loop | E1 editable/save/copy loop → E2 Content Library | After each task PR passes required verification, the Pipeline merges it into the planning branch and selects the next pending task | AR-W1 cumulative Architecture Review after E2 |
| W2 — Product Structure Decision | U1A dead-code inventory → U2 one-page IA | U2 starts automatically after the inventory task passes | AR-W2 cumulative Architecture Review, then Steven approves the complete IA map |
| W3 — Convergence and Extension | U1B approved removals → U3 navigation → U3A admin-space inventory/security contract → U3ADR AuditLog decision gate → U3B three-space admin migration → E3A capability revalidation → E3B proven gap fixes | U3ADR requires fresh exact-head PASS evidence before U3B; E3A is blocked on U3B and E3B scope is derived from E3A evidence | AR-W3 cumulative Architecture Review |
| Final | Full verification → independent technical Audit → release evidence | No automatic release or deployment | One Claude Code Audit, then explicit Steven release approval |

Rules:

- A task remains a focused PR with its own tests, evidence, and implementation report.
- Codex stops after opening each task PR. The Pipeline owns verification, merge into the planning branch, state update, and selection of the next task.
- The Pipeline must not request Architecture Review between tasks inside a Wave.
- At Wave end, it records the Wave start SHA, cumulative end SHA, task results, validation evidence, and changed-file summary in an Architecture Review Request artifact, sets the checkpoint to `awaiting_review`, and exits cleanly.
- ChatGPT Work records the Architecture Review result. The Pipeline must never self-approve or substitute Claude for this decision.
- A failed review creates a bounded remediation task. After two failed remediation attempts, the Wave becomes `needs_human`.
- W3 cannot begin until AR-W2 passes and Steven records the U2 IA approval.
- Independent technical Audit occurs exactly once, after AR-W1, AR-W2, AR-W3, and the Steven IA gate have passed.
- Release tagging and production deployment are never automatic.

The restart-safe state machine, artifact paths, task order, and gates are authoritative in the Pipeline Manifest. Markdown checkboxes are explanatory, not the execution state source.

## 16. Release and Rollback

- Use small PRs aligned to one slice.
- Preserve existing feature flags where the touched module already uses them; do not add a broad OS 3.8 flag without a concrete rollback need.
- No release tag, Prisma migration, environment change, or production deployment without separate approval.
- If E1 production verification fails, revert the affected UI/API slice while preserving existing stored Content records.
- Never solve rollback by deleting user content.

## 17. Risks

| Risk | Mitigation |
| --- | --- |
| Silent duplicate drafts | Stable content ID; PATCH same record; integration test |
| Cross-tenant access | Server-derived identity; owner/tenant predicates; negative tests |
| Losing user edits | Dirty state, retry, navigation/regenerate guard |
| Repeating old UI architecture | Keep active Command Center; extract behavior only |
| Overbuilding Content Library | Minimum fields/actions first; bounded list |
| Navigation churn | U2 approval stop before U3 |
| Audit drift | Revalidate E3 against current `main` |
| Scope creep into Stage B | Non-goals and release gate enforced in review |

## 18. Non-Goals

- Stage B Twin/Memory personalization of generated content.
- New CRM, funnel, marketplace, billing, WhatsApp, or Success Engine capability.
- Full redesign of all authenticated pages.
- A second content persistence model.
- Prisma schema changes by default.
- Automated publishing to external social platforms.
- Seed-user recruitment before Dogfood PASS.
- Deleting routes or components before evidence and approval.

## 19. Approval and Human Gate Checklist

- [x] Steven approved E1 and E2 as OS 3.8 P0 by merging PR #78.
- [x] Steven approved U2 in parallel with E1; U3 remains blocked until the one-page IA is approved.
- [x] Steven approved E3 as revalidation-first, with fixes only for proven gaps.
- [x] Steven approved reuse of canonical `Content` with no Prisma change by default.
- [x] Steven approved the complete OS 3.8 Blueprint scope and ordering.
- [x] Steven approved Amendment A: isolated member, team-admin, and platform-admin spaces, implemented through U3A/U3ADR/U3B before E3A.
- [x] Invite-link environment hardening and audit A-1/A-3 remain deferred unless directly touched or proven to be a release blocker.
- [ ] Steven approves the U2 one-page IA after AR-W2.
- [ ] Steven approves OS 3.8 release after final independent Audit and release evidence.

## 20. Authorization Record

Blueprint decision: **APPROVED** by Steven through merged PR #78.

Wave governance decision: awaiting Steven merge of the Wave contract/bootstrap documentation PR.

Product implementation authorization: **BLOCKED** until the one-time Pipeline Upgrade PR is implemented, reviewed, and merged.

After the Pipeline bootstrap passes, it may execute only the tasks and order encoded in `os-3-8/PIPELINE_MANIFEST.json`. It must pause at every Architecture Review or Steven gate, and it may not release or deploy automatically.
