# E3A Capability Revalidation — Video / Lead Magnet / Webinar

**Status:** Revalidation evidence only; no product fix is authorized by this document

**Exact baseline:** `3976a57f32014eb303bd66078f310fcf6913a9c1`

**Investigated:** 2026-07-17

**Task branch:** `test/os-3.8-e3a-capability-revalidation`

**Blueprint authority:** [OS 3.8 Blueprint](../../OS_3_8_BLUEPRINT.md), §11

## 1. Method and verdict contract

This is a fresh inspection of the exact baseline, not a copy of an earlier audit. The investigation traced each active authenticated route through its mounted component, authenticated API, service, persistence owner, authorization predicate, navigation consumer, and current executable coverage. It also searched compatibility redirects and duplicate services before classifying an operation.

The matrix uses only:

- **PASS** — mounted runtime path, reproducible code evidence, and an executable test all exist.
- **GAP** — the user loop is missing, has no stable canonical identity, cannot be positively tested, or does not preserve tenant/owner authority.
- **NOT_APPLICABLE** — the product lifecycle genuinely does not require the operation. No cell met that standard.

The focused service suite is [e3a-capability-revalidation.test.ts](../../../../src/__tests__/services/e3a-capability-revalidation.test.ts). The authenticated route, keyboard, and narrow-viewport smoke is [e3a-capability-revalidation.spec.ts](../../../../tests/e2e/e3a-capability-revalidation.spec.ts).

## 2. Runtime and ownership map

| Capability | Active route and mounted component | Authenticated API and canonical service | Canonical persistence owner | Tenant / owner authority | Navigation and mode notes |
|---|---|---|---|---|---|
| Video | `/video` → `VideoProjectsList`; `/video/new` → `VideoProductionFlow`; `/video/[id]` → `VideoProjectDetail`; `/video?view=production` → `VideoProductionDashboard` | `/api/v1/video/projects/**` → `videoProjectService`; `/video-production` and `/brand-builder/video-script` are compatibility redirects into `/video` | Prisma `VideoProject`, with stable `id`, `tenantId`, and `userId`; it is **not** the E1/E2 `Content` model | List and DELETE use tenant + user. Exact GET, script generation, scene regeneration, production/finalization paths first resolve by tenant + ID without `userId`; same-tenant cross-owner access is therefore not fail-closed | `/video` is the U3 terminal destination; both Retail and Recruitment share it. No capability feature flag or role gate beyond authenticated access was found |
| Lead Magnet | `/lead-magnet` → `LeadMagnetDashboard` | GET `/api/v1/lead-magnet`, POST `/generate`, POST `/publish` → `leadMagnetService` | `User.metadata.lead_magnet` plus `lead_magnet_tracks.{retail,recruitment}`; each generated config has a stable `lm-*` ID and timestamps; it is **not** `Content` | All reads/writes are keyed by the authenticated `user.id`; publish creates a tenant/owner-scoped Funnel | Canonical destination is `/lead-magnet`; UI explicitly renders Retail and Recruitment tracks with different copy/CTA. Readiness requires Brand DNA and Content plan. No separate role/feature flag was found |
| Webinar | `/webinar-center` → `WebinarDashboard` | GET `/api/v1/webinar-center`, POST `/generate` → `webinarService` | `User.metadata.webinar` singleton; `WebinarPackage` has no ID or timestamps; it is **not** `Content` | Reads/writes are keyed by authenticated `user.id`, but the saved object has no canonical record identity | Canonical destination is `/webinar-center`; current UI has one shared presentation and no explicit Retail/Recruitment mode. No separate role/feature flag was found |

### Duplicate/legacy surface check

- Video has older `video-production` and brand-builder video-script APIs/services, but their active page routes redirect to `/video`; they do not replace the canonical `VideoProject` loop.
- Lead Magnet and Webinar each have one mounted dashboard and one user-metadata service. No second mounted editor or library was found.
- None of these capabilities writes through the E1/E2 canonical `Content` record. Their lifecycle and evidence must therefore be evaluated against their actual owning model rather than assumed Content semantics.

## 3. 18-cell matrix

| Capability | Generate | Edit | Save | Reopen | Copy | Delete |
|---|---|---|---|---|---|---|
| **Video** | **PASS** — V-P1 | **GAP** — E3-GAP-VIDEO-01 | **GAP** — E3-GAP-VIDEO-01 | **GAP** — E3-GAP-VIDEO-01 | **GAP** — E3-GAP-VIDEO-02 | **GAP** — E3-GAP-VIDEO-03 |
| **Lead Magnet** | **PASS** — LM-P1 | **GAP** — E3-GAP-LEAD-MAGNET-01 | **GAP** — E3-GAP-LEAD-MAGNET-01 | **PASS** — LM-P2 | **GAP** — E3-GAP-LEAD-MAGNET-02 | **GAP** — E3-GAP-LEAD-MAGNET-03 |
| **Webinar** | **GAP** — E3-GAP-WEBINAR-01 | **GAP** — E3-GAP-WEBINAR-02 | **GAP** — E3-GAP-WEBINAR-02 | **GAP** — E3-GAP-WEBINAR-01 | **GAP** — E3-GAP-WEBINAR-03 | **GAP** — E3-GAP-WEBINAR-04 |

**Totals:** PASS 3 / GAP 15 / NOT_APPLICABLE 0.

### PASS evidence

#### V-P1 — Video Generate

- Mounted entry: `/video` exposes “新建视频”; `/video/new` mounts the production flow.
- The POST route authenticates, validates the input, and calls `videoProjectService.startProject`.
- `startProject` creates one Prisma `VideoProject` with stable database ID plus the authenticated `tenantId` and `userId`.
- Focused test: “creates a stable canonical VideoProject owned by the authenticated tenant and user”.
- E2E smoke: `/video` is mounted at 390 px and its create link is keyboard-focusable.

#### LM-P1 — Lead Magnet Generate

- Mounted `/lead-magnet` presents either the readiness gate or generation control.
- Authenticated generation produces a stable `lm-*` ID, timestamps, then saves the result to the authenticated user's metadata.
- Retail and Recruitment are generated as distinct track records and preserve their exact IDs.
- Focused test: “generates a stable record identity with timestamps”.

#### LM-P2 — Lead Magnet Reopen

- GET `/api/v1/lead-magnet` loads both canonical default and per-track records using authenticated `user.id`.
- Dashboard query hydrates from that GET on mount/reload.
- Focused test performs a real service round-trip for Retail and Recruitment and asserts exact record equality.

## 4. GAP register

### E3-GAP-VIDEO-01 — Video edit/save/reopen owner boundary

- **Operations:** Edit, Save, Reopen
- **User impact:** a member cannot be guaranteed that an exact project URL or scene update is limited to their own project. The visible “继续编辑” loop exists, but it is not safe enough to classify PASS.
- **Exact path:** `/video/[id]`; `VideoProjectDetail`; GET `/api/v1/video/projects/[id]`; POST script; PATCH scene; `videoProjectService.get`, `generateFullScript`, and `regenerateScene`; Prisma `VideoProject`.
- **Reproduction:** call `get` or `regenerateScene` as user A with an ID owned by user B in the same tenant. The lookup predicate is `{ id, tenantId }`, and the focused test deterministically accepts/updates that mocked row.
- **Security/data risk:** same-tenant cross-owner disclosure or mutation.
- **Minimal E3B boundary:** require `{ id, tenantId, userId }` (or an explicitly documented privileged policy) before every exact-project read/mutation, including downstream production/finalize/publish helpers; keep update operations tied to the scoped row.
- **Acceptance tests:** owner positive path; same-tenant other-owner 404/no mutation for GET, script, scene, plan, finalize, publish, subtitle; refresh returns latest scoped value.
- **Priority:** P0 security/data authority.
- **May defer to 3.8.x:** No.

### E3-GAP-VIDEO-02 — Video has no current-value copy action

- **Operation:** Copy
- **User impact:** generated hook/script/scene output cannot be copied through a mounted, accessible control.
- **Exact path:** `/video/[id]`, `VideoProjectDetail`, `MasterScriptEditor`.
- **Reproduction:** reopen a scripted project; output is rendered, but no clipboard action or feedback exists.
- **Risk:** workflow friction; users may select stale/partial text manually.
- **Minimal E3B boundary:** add an accessible copy control for the current rendered script/scene value with success/error feedback.
- **Acceptance tests:** clipboard receives the current value after a scene update; keyboard operation and failure feedback.
- **Priority:** P1 usability.
- **May defer to 3.8.x:** No, because E3B is explicitly derived from the six-operation loop.

### E3-GAP-VIDEO-03 — Video delete is API-only

- **Operation:** Delete
- **User impact:** the canonical service and DELETE route exist, but the mounted list/detail provides no delete action or confirmation.
- **Exact path:** `/video`, `/video/[id]`; DELETE `/api/v1/video/projects/[id]`; `videoProjectService.delete`.
- **Reproduction:** list or open a project; no delete control is available.
- **Risk:** abandoned projects cannot be managed; exposing the endpoint later without confirmation could cause accidental loss.
- **Minimal E3B boundary:** owner-scoped delete UI with explicit confirmation, pending/error state, and list invalidation/navigation.
- **Acceptance tests:** cancel leaves record; confirm deletes exact ID; other-owner denial; keyboard/focus restoration.
- **Priority:** P1 lifecycle completeness.
- **May defer to 3.8.x:** No.

### E3-GAP-LEAD-MAGNET-01 — Lead Magnet output is read-only

- **Operations:** Edit, Save
- **User impact:** generated Retail/Recruitment resources can be viewed and regenerated/published, but users cannot edit the current title/body/CTA and save the same canonical ID.
- **Exact path:** `/lead-magnet`; `LeadMagnetDashboard`; `leadMagnetService`; `User.metadata.lead_magnet_tracks`.
- **Reproduction:** generate or reopen a track; output cards contain no edit form or explicit same-record save control.
- **Risk:** user corrections require regeneration and cannot be proven to preserve identity/current value.
- **Minimal E3B boundary:** controlled editor plus same-ID, current-user save for each track; preserve server-confirmed baseline and unsaved edits on errors.
- **Acceptance tests:** edit/save/reload same ID, failed save retains input, Retail/Recruitment isolation, current-value race protection.
- **Priority:** P1 working-loop completeness.
- **May defer to 3.8.x:** No.

### E3-GAP-LEAD-MAGNET-02 — Lead Magnet has no copy action

- **Operation:** Copy
- **User impact:** current resource/CTA text has no mounted clipboard action.
- **Exact path:** `/lead-magnet`, generated track output cards.
- **Reproduction:** reopen either track and inspect controls; no copy button or clipboard feedback exists.
- **Risk:** manual copying is error-prone and can miss current edits after E3B introduces editing.
- **Minimal E3B boundary:** copy current editor value with accessible status.
- **Acceptance tests:** current value copied for each track; error feedback; keyboard operation.
- **Priority:** P1 usability.
- **May defer to 3.8.x:** No.

### E3-GAP-LEAD-MAGNET-03 — Lead Magnet has no delete lifecycle

- **Operation:** Delete
- **User impact:** neither the mounted UI nor API/service exposes record deletion/reset with confirmation.
- **Exact path:** `/lead-magnet`; `/api/v1/lead-magnet`; `leadMagnetService`; user metadata.
- **Reproduction:** generate/reopen both tracks; no delete/reset action or DELETE handler exists.
- **Risk:** users cannot remove obsolete resources; careless metadata deletion could affect the other track.
- **Minimal E3B boundary:** current-user, exact-track delete/reset with confirmation and isolation.
- **Acceptance tests:** cancel, exact-track deletion, other track retained, refresh empty state, error recovery.
- **Priority:** P1 lifecycle completeness.
- **May defer to 3.8.x:** No.

### E3-GAP-WEBINAR-01 — Webinar lacks canonical record identity

- **Operations:** Generate, Reopen
- **User impact:** generation and metadata reload exist, but there is no stable webinar ID or timestamps, so an exact generated record cannot be addressed or proven to reopen.
- **Exact path:** `/webinar-center`; POST `/api/v1/webinar-center/generate`; GET `/api/v1/webinar-center`; `webinarService`; `User.metadata.webinar`; `WebinarPackage`.
- **Reproduction:** generate a package. The focused test proves the returned/saved object has no `id`, `createdAt`, or `updatedAt` even after a save/get round-trip.
- **Risk:** identity, concurrency, audit, and exact-record recovery are ambiguous.
- **Minimal E3B boundary:** introduce a stable canonical identity and timestamps without a Prisma migration unless architecture review proves metadata cannot support it; preserve owner scoping.
- **Acceptance tests:** generated stable ID; save/reopen exact same ID; refresh; repeat generation has explicit replace/new semantics.
- **Priority:** P0 lifecycle authority.
- **May defer to 3.8.x:** No.

### E3-GAP-WEBINAR-02 — Webinar output is read-only and auto-save only

- **Operations:** Edit, Save
- **User impact:** output is rendered in sections with no editor and no explicit same-record save action.
- **Exact path:** `/webinar-center`; `WebinarDashboard`; `webinarService.save`.
- **Reproduction:** generate/reopen the package; there are no input controls for package content and no save feedback/error recovery.
- **Risk:** user correction is impossible; auto-save cannot satisfy the edit/save loop.
- **Minimal E3B boundary:** current-value editor and same-ID save after canonical identity is established.
- **Acceptance tests:** edit/save/reload, failed-save input retention, save race protection, current-user isolation.
- **Priority:** P1 working-loop completeness.
- **May defer to 3.8.x:** No.

### E3-GAP-WEBINAR-03 — Webinar has no copy action

- **Operation:** Copy
- **User impact:** scripts, slides, registration copy, and follow-up messages have no mounted clipboard controls.
- **Exact path:** `/webinar-center`, `WebinarDashboard` output sections.
- **Reproduction:** open a generated package; no copy control or feedback is rendered.
- **Risk:** manual selection can copy incomplete or stale content.
- **Minimal E3B boundary:** accessible copy for the current selected section/value.
- **Acceptance tests:** exact current value, keyboard, success/error feedback.
- **Priority:** P1 usability.
- **May defer to 3.8.x:** No.

### E3-GAP-WEBINAR-04 — Webinar has no delete lifecycle

- **Operation:** Delete
- **User impact:** no UI, API, or service delete/reset exists.
- **Exact path:** `/webinar-center`; user metadata `webinar` key.
- **Reproduction:** reopen a package; no delete action or DELETE route exists.
- **Risk:** obsolete package cannot be removed; future reset must not damage unrelated metadata.
- **Minimal E3B boundary:** current-user exact-record delete/reset with confirmation after canonical identity is established.
- **Acceptance tests:** cancel, confirm exact record, unrelated metadata retained, refresh empty state, error recovery.
- **Priority:** P1 lifecycle completeness.
- **May defer to 3.8.x:** No.

## 5. UI, state, and accessibility observations

- **Loading/empty/error:** Video list has loading and empty states; generation/detail mutations generally have local pending state but limited error recovery. Lead Magnet has readiness/loading/generation-error states. Webinar has a loading state but generation failure is not surfaced to the user.
- **Keyboard/narrow viewport:** the E3A Playwright smoke validates all three mounted authenticated surfaces at 390 px and keyboard focus on the primary available action. This is a smoke, not a substitute for the operation-specific E3B acceptance tests.
- **Retail/Recruitment:** Lead Magnet explicitly persists separate track configurations. Video and Webinar use one shared surface and do not expose a track switch.
- **Copy semantics:** no current-value clipboard implementation was found in these mounted surfaces.
- **Delete confirmation:** no mounted delete control exists for any of the three; Video alone has a backend DELETE operation.

## 6. Existing and added executable evidence

Before E3A, repository-wide tests exercised shared auth/navigation and the `/video-production` compatibility redirect, but no focused service or E2E suite covered the six-operation capability matrix for these three surfaces.

E3A adds:

- **8 focused Vitest tests:** Lead Magnet identity and two-track reopen; Webinar missing-ID reproduction and metadata round-trip; Video canonical create, owner-scoped list/delete, exact-read owner gap, and scene-update owner gap.
- **1 Playwright test:** authenticated mounted-route, narrow viewport, and keyboard-focus smoke across Video, Lead Magnet, and Webinar.

Negative gap tests deliberately pass by asserting the exact current unsafe/missing contract. They are regression evidence, not a claim that the gap is fixed.

## 7. E3B scope derived only from proven GAPs

E3B is not empty. Its maximum authorized proposal from this revalidation is:

1. **P0:** close owner scoping on every Video exact-project read/mutation path.
2. **P0:** give Webinar a stable canonical identity and explicit replace/new semantics.
3. **P1:** add same-record Edit/Save with error/race protection for Video (where applicable), Lead Magnet, and Webinar.
4. **P1:** add current-value Copy controls with accessible feedback.
5. **P1:** add exact-record/track Delete with confirmation, owner isolation, and refresh/cache behavior.

E3B must not expand into Stage B, CRM, marketplace, billing, WhatsApp, new content types, or unrelated navigation. It must retain the existing Prisma schema unless a separately reviewed decision explicitly authorizes a migration.

## 8. Non-actions

This revalidation does not repair any gap. It does not alter product source, Prisma, migrations, Pipeline, Manifest state, CI, deployment, or production. E3A remains pending until separate governance adoption records the exact-head evidence.
