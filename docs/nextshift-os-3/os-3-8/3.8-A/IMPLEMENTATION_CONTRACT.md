# OS 3.8-A Editable Content Loop Implementation Contract

Version: 1.0

Status: Wave W1 / E1 Contract — pending Pipeline bootstrap

Last Updated: 2026-07-15

Execution Role: Lead Software Engineer

Assigned Agent: Codex

Lifecycle Phase: Wave W1 Task E1

Inputs: Approved [OS 3.8 Blueprint](../../OS_3_8_BLUEPRINT.md), production-verified `v3.7.0`, repository state after PR #78

Outputs: E1 task PR, tests, implementation report, and Pipeline-verifiable evidence

Exit Criteria: Section 12 acceptance criteria and Section 13 validation pass; Codex stops at the task PR, then the Pipeline verifies and advances to E2

---

## 1. Objective

Implement only OS 3.8-A / E1: make the active Content Engine generate a canonical content draft that the user can edit, save, refresh, and copy.

The completed user path is:

> Generate post → Edit title/body → Save same draft → Refresh/reopen latest draft → Copy current edited body

This slice does not implement the Content Library, information architecture changes, dead-code deletion, or E3 expansion.

## 2. Repository Truth and Reuse Decision

The implementation must build on existing runtime authority:

- Active UI: `src/modules/content-engine/components/ContentCommandCenter.tsx`
- Active page: `src/app/(auth)/content-engine/page.tsx`
- Generation route: `src/app/api/v1/content-engine/generate/route.ts`
- Generation service: `src/modules/content-engine/contentEngineService.ts`
- Content types: `src/modules/content-engine/types.ts`
- Existing content collection API: `src/app/api/v1/ai/content/route.ts`
- Existing content item API: `src/app/api/v1/ai/content/[id]/route.ts`
- Existing CRUD service: `src/modules/ai/services/content-service.ts`
- Canonical storage: Prisma `Content`

Existing CRUD is sufficient for E1 and must be reused:

- `GET /api/v1/ai/content`
- `POST /api/v1/ai/content`
- `GET /api/v1/ai/content/:id`
- `PATCH /api/v1/ai/content/:id`
- `DELETE /api/v1/ai/content/:id`

Do not add duplicate content CRUD routes or a second persistence model.

## 3. Confirmed Defect

`generatePost()` creates a temporary ID such as `post-${Date.now()}`. `generatePlatformPost()` then creates a different canonical Prisma `Content` record but currently returns the temporary generated object instead of the persisted identity.

This prevents the active UI from safely updating the saved draft.

OS 3.8-A must return the canonical persisted `Content.id` from generation. The generation response must represent the saved draft, not a disposable client identity.

## 4. Required Functional Scope

### 4.1 Canonical generation response

Update `contentEngineService.generatePlatformPost()` so that it:

1. generates the post;
2. creates exactly one Prisma `Content` record;
3. captures the created record;
4. returns a `GeneratedPost` whose `id` is the Prisma Content ID;
5. returns persisted `title`, `body`, `platform`, `format`, `createdAt`, and draft-compatible status;
6. preserves existing generated fields such as hook, CTA, hashtags, funnel stage, and quality score where they remain valid.

The generation route must continue to enforce authentication, AI rate limiting, workspace context resolution, and mission progress.

### 4.2 Active editor surface

Add one focused post editor to `ContentCommandCenter`; do not restore `ContentEngineDashboard`.

Minimum controls:

- platform selector for Facebook, Instagram, TikTok, and 小红书;
- explicit Generate Post action;
- editable title input;
- editable body textarea;
- Save Draft action;
- Copy action;
- clear last-saved / unsaved state;
- retryable error state.

For this slice, generation may use the existing defaults:

- `format: text_post`
- `funnelStage: awareness`
- first available content pillar unless an existing selected pillar can be reused without expanding scope.

Retail/Recruitment calendar generation and output tabs must remain intact. This slice does not redesign content strategy or generation quality.

### 4.3 Save same record

Save must call the existing `PATCH /api/v1/ai/content/:id` endpoint with allowlisted editable fields.

Requirements:

- update the same canonical ID;
- never call POST merely to save edits to an existing generated draft;
- preserve edited client text when the PATCH fails;
- refresh local `updatedAt`/saved state from the server response;
- do not permit client mutation of `tenantId`, `ownerId`, `generatedByAi`, or `promptUsed`.

### 4.4 Refresh and reopen

`GET /api/v1/content-engine` already returns `lastPost`. Extend the active response type and UI consumption so the latest accessible post can repopulate the editor after refresh.

The editor must distinguish:

- no generated post;
- loaded saved draft;
- unsaved local edits;
- save pending;
- save failed;
- save successful.

### 4.5 Copy current value

Copy must use the current textarea value. It must not copy the original generated response after the user edits it.

Clipboard failure must produce accessible feedback and must not mark the loop complete.

## 5. State Contract

The editor must maintain at least:

- `contentId`
- `title`
- `body`
- `platform`
- `isDirty`
- generation pending/error
- save pending/error/success
- copy success/error

State transitions:

```text
empty
  -> generating
  -> saved draft loaded
  -> dirty editing
  -> saving
  -> saved draft loaded
  -> copied
```

Failure returns to the last recoverable state without discarding title/body.

## 6. Security and Tenancy

- Identity comes only from `requireAuthApi`.
- Reuse `contentService.getById()` ownership checks for PATCH.
- Do not accept tenant or owner identity from the client.
- Do not expose prompt text, tenant ID, owner ID, or internal metadata in editor telemetry.
- Add a negative service or route test proving another tenant/owner cannot update a guessed ID.
- Operator/platform-admin behavior must remain consistent with the existing service; do not broaden it in E1.

## 7. Analytics

Record only events supported by the existing telemetry pattern:

- `content_edit_started` once per loaded draft editing session;
- `content_saved` after a successful PATCH;
- `content_copied` after clipboard success;
- `content_loop_completed` when the same draft has been saved and then copied.

Do not include title, body, prompt, clipboard contents, or personal data in event properties.

If the current telemetry helper cannot support these events without unrelated architecture work, implement a narrowly scoped typed helper or document the limitation in the implementation report. Do not introduce a second analytics SDK.

## 8. Accessibility and UX Requirements

- Title input and body textarea have visible labels.
- Buttons expose pending and disabled state without relying only on color.
- Save is disabled when there is no canonical content ID, no valid body, no dirty change, or a save is pending.
- Copy is disabled for an empty body.
- Success messages use an accessible live region.
- Keyboard-only operation covers platform selection, generate, edit, save, and copy.
- Body whitespace and line breaks are preserved.
- Navigating or regenerating while dirty must require confirmation or an equivalent safe guard.

## 9. Expected File Scope

Expected modifications:

```text
src/modules/content-engine/contentEngineService.ts
src/modules/content-engine/components/ContentCommandCenter.tsx
src/modules/content-engine/types.ts                 # only if contract normalization requires it
src/app/api/v1/content-engine/generate/route.ts     # only if response normalization is needed
```

Expected tests may be added under the repository's existing test conventions for:

```text
content-engine service generation persistence
content CRUD tenant/owner isolation
ContentCommandCenter editor behavior
targeted E2E content loop
```

Do not modify Prisma schema, migrations, environment files, deployment configuration, release tags, navigation, or inactive dashboards.

## 10. Required Tests

### Service / integration

- generation creates exactly one Content row;
- returned ID equals the created Content ID, not the temporary generated ID;
- returned status and timestamps reflect the persisted draft;
- PATCH updates the same row;
- unauthorized tenant/owner update returns non-disclosing not-found behavior;
- existing GET/list/delete behavior remains compatible.

### Component

- Generate populates ID, title, and body;
- editing marks dirty;
- Save sends PATCH to the canonical ID;
- failed Save retains edited title/body;
- Copy uses edited body;
- latest saved post hydrates after query load;
- calendar generation and Brand DNA gate do not regress.

### E2E

One focused authenticated path:

```text
open Content Engine
  -> generate text post
  -> edit body
  -> save
  -> refresh
  -> verify edited body
  -> copy
```

E2E must not depend on inspecting clipboard contents if the environment cannot grant clipboard permission; in that case verify the copy handler outcome at component/integration level and use E2E for the visible success state.

## 11. Validation Commands

Run the repository-authoritative commands discovered from `package.json` and CI. At minimum report:

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm build
git diff --check
```

Run the narrowest relevant Playwright/E2E command for the new content loop and report the exact command.

Do not claim a command passed if it was skipped, unavailable, or blocked by missing secrets.

## 12. Acceptance Criteria

OS 3.8-A is complete only when:

- the active Content Engine, not a legacy dashboard, owns the editor;
- generation returns the canonical persisted Content ID;
- the user can edit title and body;
- Save PATCHes the same record;
- refresh restores the edited saved body;
- Copy uses the current edited body;
- save/copy failures have recoverable UI;
- dirty edits are guarded from accidental loss;
- tenant/owner isolation has negative test evidence;
- required validation passes;
- an implementation report lists files, tests, limitations, and evidence;
- no E2, U1, U2, U3, or E3 work is smuggled into the slice.

## 13. Deliverables

Required outputs:

1. Code and tests for Section 4.
2. `IMPLEMENTATION_REPORT.md` in this slice directory.
3. Screenshots or trace evidence for empty, generated, dirty, saved, failed-save, and copied states.
4. Exact validation results.
5. PR limited to 3.8-A.

## 14. Risks and Rollback

- Duplicate drafts: prevented by returning canonical ID and PATCHing that ID.
- Lost edits: prevented by dirty state, failure retention, and navigation/regenerate guard.
- Tenant leakage: prevented by server-derived identity and existing scoped service.
- Calendar regression: protected by focused regression tests.
- Rollback: revert the E1 UI/service changes; never delete Content records as rollback.

## 15. Stop Condition

Codex stops after implementation, validation, implementation report, evidence, and draft task PR creation.

Codex must not merge the PR, start E2 itself, trigger Architecture Review, run the independent Audit, deploy, tag, or release.

After Codex stops, the Wave Pipeline:

1. runs the required verification and checks scope;
2. merges the task PR into `planning/os-3.8-product-usability` only when every gate passes;
3. records the E1 evidence and commit in the Pipeline Manifest;
4. generates the E2 contract/task if still absent;
5. starts E2 automatically.

There is no Architecture Review between E1 and E2. AR-W1 is requested only after both tasks pass and the Pipeline has produced the cumulative W1 review package.

Do not implement E2 Content Library inside the E1 PR, U2 information architecture, navigation changes, dead-code deletion, E3 expansion, Prisma changes, deployment, release tag, or production rollout.

Do not trigger an independent technical Audit for E1 or W1. The single OS 3.8 Audit runs only after every Wave checkpoint and human gate has passed.
