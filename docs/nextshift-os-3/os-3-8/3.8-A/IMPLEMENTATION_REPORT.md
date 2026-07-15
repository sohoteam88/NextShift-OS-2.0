# OS 3.8-A E1 — Editable Content Loop Implementation Report

Date: 2026-07-15

## Scope and baseline

- Planning branch baseline: `planning/os-3.8-product-usability` at `76b573cdbf2f1bec31fe5770c080941469479d25`
- Implementation branch: `chore/os-3.8-e1-20260715120105`
- Active authority retained: `src/modules/content-engine/components/ContentCommandCenter.tsx`

This task implements E1 only. It does not add a Content Library, alter navigation, restore or delete inactive dashboards, alter Prisma/migrations, deploy, tag, or modify production.

## Delivered behavior

1. `generatePlatformPost()` creates exactly one canonical Prisma `Content` record and returns that persisted record's ID instead of the temporary generator ID.
2. The active Content Engine now offers Facebook, Instagram, TikTok, and 小红书 post generation with the existing `text_post` / `awareness` defaults.
3. The returned and refreshed draft hydrates an accessible title input and body textarea.
4. Save calls only `PATCH /api/v1/ai/content/:id` with the current title, body, and platform; it never creates another record.
5. Failed saves leave the in-memory edited values intact and expose a retry action. A successful save always advances the server-confirmed saved baseline, but only replaces the editor when the user has not typed newer title/body changes while the PATCH was in flight.
6. `content_edit_started` is emitted once per loaded canonical content ID editing session; repeated keystrokes do not duplicate it, while a newly generated or newly loaded canonical ID can start a new session.
7. Copy uses the current textarea body, reports success/failure accessibly, and records the supported content-loop telemetry without content text.
8. Browser exit, in-app link navigation, and regeneration require confirmation when the draft is dirty.
9. The existing `GET /api/v1/content-engine` `lastPost` response rehydrates the editor after refresh only from an E1-compatible canonical `text_post` on Facebook, Instagram, TikTok, or `xhs`. Shared legacy `post`, `whatsapp`, and `xiaohongshu` records are excluded rather than cast into `GeneratedPost`.
10. Content Engine generation/editor platforms and shared Content-record PATCH compatibility are separate boundaries. PATCH accepts the nine identifiers already persisted by repository producers (`facebook`, `instagram`, `tiktok`, `xhs`, `xiaohongshu`, `whatsapp`, `threads`, `email`, and `blog`) without expanding the four-option Content Command Center selector.
11. PATCH accepts only the mutable `content`, `title`, `status`, and bounded `platform` fields. Titles are bounded at 200 characters and bodies at 20,000 characters; immutable ownership/generation metadata is rejected.

## Files changed

- `src/modules/content-engine/contentEngineService.ts`
- `src/modules/content-engine/contentGenerators.ts`
- `src/modules/content-engine/types.ts`
- `src/modules/content-engine/contentDraftEditor.ts`
- `src/modules/content-engine/components/ContentCommandCenter.tsx`
- `src/modules/ai/services/content-service.ts`
- `src/app/api/v1/ai/content/[id]/route.ts`
- `src/app/api/v1/content-engine/generate/route.ts`
- `src/lib/content-platforms.ts`
- `src/lib/telemetry/tracker.ts`
- `src/modules/content-engine/contentEngineService.test.ts`
- `src/modules/content-engine/contentDraftEditor.test.ts`
- `src/__tests__/services/content-service.test.ts`
- `src/__tests__/api/content-update-route.test.ts`
- `src/lib/telemetry/tracker.test.ts`
- `tests/e2e/content-engine.spec.ts`
- `docs/nextshift-os-3/os-3-8/3.8-A/IMPLEMENTATION_REPORT.md`

## Evidence

### Canonical ID and tenancy

- `contentEngineService.generatePlatformPost` test proves `prisma.content.create` is called once and returned `GeneratedPost.id` is `content-canonical-id`, not `post-temporary-id`.
- Existing scoped `contentService.getById()` is reused by PATCH. The new negative test proves a member's guessed cross-tenant/owner ID produces non-disclosing `NOT_FOUND` and does not call `prisma.content.update`.

### State and UI coverage

- Draft-state tests cover canonical editor hydration, dirty detection, PATCH payload using edited values, and applying the server-confirmed saved state.
- Save-race tests prove the submitted server-confirmed snapshot becomes `savedDraft`, while title/body changes made during the request remain in `editorDraft` and keep the editor dirty. When the current editor still equals the submitted snapshot, it is replaced by the server-confirmed response.
- Edit-session tests prove the same canonical content ID produces one `content_edit_started` event candidate across repeated keystrokes and that a different ID can start a new session.
- Focused Playwright coverage defines the authenticated Generate → Edit → Save → Refresh → Copy path using intercepted canonical API responses. It also delays a PATCH to prove in-flight edits survive and verifies that returning to the submitted value matches the new server-confirmed saved baseline.
- Failed-save Playwright coverage returns 503 on the first PATCH, proves the user's title/body and retry affordance remain visible, then succeeds with the same canonical URL and identical allowlisted payload.

### Safe refresh hydration

- `getLastPost()` asks Prisma only for `type = text_post`, the four E1 Command Center platforms, and a recognized editor status, ordered by newest creation time.
- A second runtime boundary rejects incompatible adapter/mock results instead of coercing arbitrary Content `type`, `platform`, or `status` strings into `GeneratedPost`.
- Service tests prove a supported canonical `text_post` refresh-hydrates its exact ID/title/body, while legacy `post`, `whatsapp`, `xiaohongshu`, and missing-platform records return `null`.
- The existing authenticated Playwright Generate → Edit → Save → Refresh scenario remains the browser-level evidence that a supported `instagram` / `text_post` hydrates after reload.

### PATCH input boundary

- `CONTENT_UPDATE_LIMITS` documents and shares the 200-character title and 20,000-character body limits between the editor and server route.
- `CONTENT_RECORD_PATCH_PLATFORMS` is a neutral shared-record compatibility enum. It contains the seven Content Engine identifiers plus the existing `xiaohongshu` and `whatsapp` producer values; it is not reused as a generator or selector allowlist.
- The PATCH route uses that runtime enum and a strict Zod object rather than accepting arbitrary platform strings or silently forwarding unknown keys.
- Route tests accept both exact length boundaries and all nine supported persisted identifiers, explicitly including `xiaohongshu` and `whatsapp`, while rejecting max+1 values, an unknown platform, and `tenantId`, `ownerId`, `generatedByAi`, and `promptUsed`.

### Validation results

| Command | Result |
| --- | --- |
| `pnpm type-check` | Passed. |
| `pnpm lint` | Passed with 425 existing repository warnings and no errors. |
| `pnpm vitest run src/modules/content-engine/contentEngineService.test.ts src/modules/content-engine/contentDraftEditor.test.ts src/__tests__/services/content-service.test.ts src/lib/telemetry/tracker.test.ts src/__tests__/api/content-update-route.test.ts` | Passed: 5 files, 40 tests. |
| `pnpm test` | Passed: 94 files / 504 tests; 7 files / 44 tests skipped. |
| `pnpm build` | Passed and wrote `.next/BUILD_ID`. It logs the repository's existing lint warnings and expected static-generation database probe errors because `DATABASE_URL` is absent locally. |
| `pnpm lint:boundaries:check` | Passed; generated boundary configuration is in sync. |
| `git diff --check` | Passed. |
| `pnpm e2e tests/e2e/content-engine.spec.ts --list` | Passed: 6 tests discovered, including save-race and failed-save retry scenarios. |
| Runtime `tests/e2e/content-engine.spec.ts` | Not claimed locally: this worktree has no `.env.local`/`.env.e2e`, E2E credentials, or configured local application server. Runtime execution is delegated to the configured GitHub E2E job; the exact post-push head, run, and result are recorded in PR #81. |

No runtime screenshots of empty/generated/dirty/saved/failed-save/copied states are claimed from this workstation. Local Playwright discovery proves the six scenarios compile; GitHub E2E remains the runtime acceptance environment.

## Known limitation

The current canonical `Content` Prisma model has `createdAt` but no persisted `updatedAt` field. E1 is explicitly not authorized to change the schema. The editor therefore shows the time at which the server confirms a PATCH, while generation/refresh use the persisted creation timestamp. A durable database last-updated timestamp requires a separately approved schema decision.
