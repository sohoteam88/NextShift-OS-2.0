# OS 3.8-B E2 — Content Library Implementation Contract

Status: Authorized for implementation

Authorized baseline: `planning/os-3.8-product-usability@448ddb477fc1287ccc1fa4620477ffa802d49d58`

Predecessor: E1 PR #81, merged at the authorized baseline

## Outcome

The existing `/content-engine` product area composes the active Content Command Center with a standalone Content Library over the canonical Prisma `Content` model:

```text
E1 draft → Library → reopen → edit → save same ID → reopen → copy → confirmed delete
```

No new canonical route, navigation entry, CRUD API, or storage model is introduced.

## Authorized data decision

Steven approved one additive `Content.updatedAt` migration on 2026-07-15. It must:

- add `updated_at TIMESTAMPTZ(6)` without deleting or renaming data;
- backfill each existing row from its own `created_at`;
- set `DEFAULT CURRENT_TIMESTAMP` and `NOT NULL` after backfill;
- let Prisma `@updatedAt` advance the value on mutation;
- index member tenant/owner ordering and tenant-manager ordering;
- never be applied to production by this task.

## API and security contract

- Reuse `GET /api/v1/ai/content` and `GET/PATCH/DELETE /api/v1/ai/content/:id`.
- Member predicates are always `tenantId + ownerId`.
- Operator and platform-admin predicates are always the authenticated `tenantId`.
- Status and platform filters are strict allowlists and combine with ownership predicates.
- Pagination is integer-only, bounded to `1..50`, and rejects malformed input.
- Ordering is `updatedAt DESC, id DESC`.
- List DTOs contain only identity, display fields, a bounded preview, and timestamps.
- Item/PATCH DTOs add the full body but omit tenant, owner, prompts, and AI audit fields.
- Cross-scope IDs return a non-disclosing not-found response.

## UX contract

- Library logic lives under `src/modules/content-library/`; the page only composes features.
- Loading, true empty, permission-denied, server-error, and retry states are distinct.
- Status/platform filters reset pagination.
- Full body is fetched only when a record opens.
- Title/body edits are dirty until the same canonical ID is saved.
- Failed saves and deletes retain the record and retry path.
- Dirty close/switch/delete actions require an explicit accessible dialog decision.
- Delete never uses `window.confirm`.
- Dialogs trap focus, support Escape, restore focus, and expose labels/live feedback.
- The mobile editor uses a bottom action area and remains usable at a narrow viewport.

## Telemetry privacy

The Library may emit `content_reopened`, `content_saved`, `content_copied`, `content_deleted`, and `content_loop_completed` with content ID, platform, type, and user identity already used by the tracker. It must not send title, body, preview, prompt, clipboard contents, tenant ID, or personal data.

## Stop boundary

This contract does not authorize Pipeline changes, Manifest changes, AR-W1, W2, U1/U2/U3/E3, navigation redesign, production migration, deployment, tag, release, or production access.
