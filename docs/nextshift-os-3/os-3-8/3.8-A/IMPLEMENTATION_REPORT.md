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
5. Failed saves leave the in-memory edited values intact and expose a retry action. Successful saves reset dirty state and show an accessible saved status.
6. Copy uses the current textarea body, reports success/failure accessibly, and records the supported content-loop telemetry without content text.
7. Browser exit, in-app link navigation, and regeneration require confirmation when the draft is dirty.
8. The existing `GET /api/v1/content-engine` `lastPost` response now rehydrates the editor after refresh.

## Files changed

- `src/modules/content-engine/contentEngineService.ts`
- `src/modules/content-engine/contentGenerators.ts`
- `src/modules/content-engine/types.ts`
- `src/modules/content-engine/contentDraftEditor.ts`
- `src/modules/content-engine/components/ContentCommandCenter.tsx`
- `src/lib/telemetry/tracker.ts`
- `src/modules/content-engine/contentEngineService.test.ts`
- `src/modules/content-engine/contentDraftEditor.test.ts`
- `src/__tests__/services/content-service.test.ts`
- `src/lib/telemetry/tracker.test.ts`
- `tests/e2e/content-engine.spec.ts`
- `docs/nextshift-os-3/os-3-8/3.8-A/IMPLEMENTATION_REPORT.md`

## Evidence

### Canonical ID and tenancy

- `contentEngineService.generatePlatformPost` test proves `prisma.content.create` is called once and returned `GeneratedPost.id` is `content-canonical-id`, not `post-temporary-id`.
- Existing scoped `contentService.getById()` is reused by PATCH. The new negative test proves a member's guessed cross-tenant/owner ID produces non-disclosing `NOT_FOUND` and does not call `prisma.content.update`.

### State and UI coverage

- Draft-state tests cover canonical editor hydration, dirty detection, PATCH payload using edited values, and applying the server-confirmed saved state.
- Focused Playwright coverage defines the authenticated Generate → Edit → Save → Refresh → Copy path using intercepted canonical API responses. It validates PATCH body values, refreshed title/body, and the visible copy-success state.

### Validation results

| Command | Result |
| --- | --- |
| `XDG_CACHE_HOME=/tmp/nextshift-prisma-cache pnpm db:generate` | Passed. The first default-cache attempt was blocked by a sandbox `utime` permission; the writable cache succeeded. |
| `pnpm type-check` | Passed. |
| `pnpm lint` | Passed with 425 pre-existing repository warnings and no errors. |
| `pnpm vitest run src/modules/content-engine/contentEngineService.test.ts src/modules/content-engine/contentDraftEditor.test.ts src/__tests__/services/content-service.test.ts src/lib/telemetry/tracker.test.ts` | Passed: 4 files, 14 tests. |
| `pnpm test` | Passed: 93 files / 478 tests; 7 files / 44 tests skipped. |
| `pnpm build` | Passed and wrote `.next/BUILD_ID`. It logs the repository's existing lint warnings and expected static-generation database probe errors because `DATABASE_URL` is absent locally. |
| `git diff --check` | Passed. |
| `pnpm e2e tests/e2e/content-engine.spec.ts --list` | Passed: 4 tests discovered. |
| `pnpm e2e tests/e2e/content-engine.spec.ts --grep 'generates, edits, saves, reloads, and copies the current draft'` | Blocked: `ERR_CONNECTION_REFUSED` at `http://localhost:3000/login`; no local app server or E2E credentials were available. |

The blocked E2E attempt produced the diagnostic trace at `test-results/content-engine-Content-Eng-12e7d-nd-copies-the-current-draft/trace.zip`; it is an environment-failure trace, not acceptance evidence for UI states. CI must execute the committed E2E scenario with its configured server and credentials. Consequently, no runtime screenshots of empty/generated/dirty/saved/failed-save/copied states are claimed from this workstation.

## Known limitation

The current canonical `Content` Prisma model has `createdAt` but no persisted `updatedAt` field. E1 is explicitly not authorized to change the schema. The editor therefore shows the time at which the server confirms a PATCH, while generation/refresh use the persisted creation timestamp. A durable database last-updated timestamp requires a separately approved schema decision.
