# OS 3.8-B E2 — Content Library Execution Task

## Synchronization gate

1. Fetch `origin` and require `origin/planning/os-3.8-product-usability` to equal `448ddb477fc1287ccc1fa4620477ffa802d49d58`.
2. Require PR #81 to be merged with that merge SHA.
3. Require a clean worktree and create `feature/os-3.8-e2-content-library` from the exact remote baseline.
4. Do not reset, stash, clean, overwrite, or delete user work if the gate fails.

## Evidence inventory

Read the OS 3.8 Blueprint, E1 report, Prisma schema, active Content Engine page/Command Center, existing Content CRUD routes/service, shared platforms, canonical routes, telemetry, pagination, Dialog, query, and test patterns before editing.

## Implementation order

1. Add and validate the approved additive `Content.updatedAt` schema/migration and indexes.
2. Replace unsafe Content-row responses with generic safe list/item DTOs.
3. Enforce strict list query parsing, ownership-composed filters, bounded pagination, and deterministic ordering.
4. Adapt E1 generate/refresh/save to use server-persisted `updatedAt` and invalidate Library data without weakening save-race protection.
5. Compose a standalone Content Library into `/content-engine` with open/edit/save/copy/delete and complete state handling.
6. Add privacy-safe telemetry and focused migration, service, API, state, telemetry, and Playwright coverage.
7. Run Prisma, database fixture, targeted, repository-wide, build, and E2E validations.
8. Create one Draft PR titled `OS 3.8 E2: content library` targeting the authorized planning branch and wait for all required checks.

## Acceptance evidence

- clean-DB migration and existing-row backfill;
- Prisma PATCH advances `updatedAt` on the same ID;
- member and tenant-manager predicates and negative isolation tests;
- safe list/item/PATCH response shapes;
- invalid query rejection and deterministic ordering;
- Library state, dirty/save-race, retry, accessible confirmation, narrow viewport, and privacy telemetry coverage;
- accurate local and GitHub validation results.

## Forbidden actions

Do not run `scripts/os-pipeline`, edit `PIPELINE_MANIFEST.json`, generate AR-W1, enter W2, add routes/navigation, create a second Content model/API, run a production migration, deploy, tag, release, or modify production.
