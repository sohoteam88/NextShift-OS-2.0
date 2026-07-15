# OS 3.8-A Editable Content Loop Execution Task

Version: 1.0

Status: Stop A Draft — awaiting Steven merge approval

Last Updated: 2026-07-15

Execution Role: Lead Software Engineer

Assigned Agent: Codex

Lifecycle Phase: Implementation

Inputs: [Implementation Contract](IMPLEMENTATION_CONTRACT.md), approved [OS 3.8 Blueprint](../../OS_3_8_BLUEPRINT.md)

Outputs: E1 code/tests, implementation report, and a reviewable PR

Exit Criteria: Contract acceptance criteria pass; stop before E2

---

## 1. Task

Implement only OS 3.8-A E1: the active Content Engine must generate one canonical draft, let the user edit title/body, save the same record, restore it after refresh, and copy the current edited body.

## 2. Implementation Branch

After this Stop A documentation is merged, create from updated `main`:

```text
feature/os-3-8-a-editable-content
```

Do not implement on the documentation branch.

## 3. Mandatory Reading

Read before editing:

1. `docs/nextshift-os-3/OS_3_8_BLUEPRINT.md`
2. this slice's `IMPLEMENTATION_CONTRACT.md`
3. `src/modules/content-engine/components/ContentCommandCenter.tsx`
4. `src/modules/content-engine/contentEngineService.ts`
5. `src/modules/content-engine/contentGenerators.ts`
6. `src/modules/content-engine/types.ts`
7. `src/app/api/v1/content-engine/generate/route.ts`
8. `src/app/api/v1/content-engine/route.ts`
9. `src/app/api/v1/ai/content/route.ts`
10. `src/app/api/v1/ai/content/[id]/route.ts`
11. `src/modules/ai/services/content-service.ts`
12. relevant test, telemetry, and UI patterns discovered in the repository

## 4. Execution Steps

1. Record the implementation baseline SHA and confirm the worktree does not contain unrelated changes.
2. Inspect repository-authoritative package scripts and CI commands; record the exact validation plan.
3. Add a failing service/integration test proving generation must return the persisted Prisma Content ID.
4. Update `generatePlatformPost()` to return the created Content identity and persisted draft state while creating exactly one row.
5. Preserve authentication, AI rate limit, workspace context, Brand DNA, mission progress, and existing calendar behavior.
6. Extend the active Content Engine response/client type to consume `lastPost` for refresh hydration.
7. Add the focused platform selector, Generate Post action, editable title, and editable body to `ContentCommandCenter`.
8. Add Save Draft using existing `PATCH /api/v1/ai/content/:id`; never POST a duplicate on edit.
9. Add Copy using the current textarea body.
10. Add dirty state and protect regeneration/navigation from accidental loss.
11. Add loading, empty, error, retry, saved, and copied states with accessible labels/live feedback.
12. Add or extend telemetry without content text or personal data.
13. Add negative tenant/owner isolation coverage for update.
14. Add component coverage for generate, dirty, save, failed save retention, refresh hydration, and copy-current-value.
15. Add one focused E2E path where the environment supports it.
16. Run required validation and fix only failures caused by this slice.
17. Create `IMPLEMENTATION_REPORT.md` in this directory.
18. Review the final diff for scope leakage.
19. Commit, push, and open a draft implementation PR; do not merge it.
20. Stop and return the evidence listed in Section 9.

## 5. Required Behavior

- Active authority stays `ContentCommandCenter`.
- Generated response ID equals persisted Content ID.
- Generate creates one draft.
- Save updates that draft through existing PATCH.
- Refresh restores latest saved title/body.
- Copy uses edited body.
- Failed save preserves edits.
- Dirty changes cannot be silently lost.
- Tenant/owner checks remain server-side.
- Retail/Recruitment calendars and Brand DNA gate continue working.

## 6. Explicit Non-Goals

Do not:

- build the Content Library;
- create new content CRUD routes;
- restore `ContentEngineDashboard`;
- delete inactive components;
- redesign navigation;
- change `canonical-routes.ts`;
- implement U1/U2/U3 or E3;
- modify Prisma schema or migrations;
- change environment or deployment configuration;
- create a release tag;
- deploy to production;
- add Stage B personalization;
- refactor unrelated modules.

## 7. Expected Files

Primary expected files:

```text
src/modules/content-engine/contentEngineService.ts
src/modules/content-engine/components/ContentCommandCenter.tsx
```

Conditional files:

```text
src/modules/content-engine/types.ts
src/app/api/v1/content-engine/generate/route.ts
targeted unit/integration/component/E2E tests
typed telemetry helper using the existing telemetry system
docs/nextshift-os-3/os-3-8/3.8-A/IMPLEMENTATION_REPORT.md
```

Any file outside this scope must be justified in the implementation report before it is included.

## 8. Required Validation

Run and report:

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm build
git diff --check
```

Also run the repository's targeted component/integration test command and the narrowest applicable E2E command.

If a command is blocked by environment or secrets, report it as blocked with evidence; do not relabel it as passed.

## 9. Return Format

Return:

1. Baseline commit and implementation branch.
2. Files changed.
3. Functional behavior delivered.
4. Canonical ID evidence: generated ID equals persisted Content ID.
5. Tenant/owner isolation evidence.
6. Unit/integration/component/E2E commands and results.
7. Typecheck, lint, test, build, and diff-check results.
8. Screenshots/trace evidence.
9. Known limitations or blocked checks.
10. Implementation report path.
11. Commit SHA and draft PR URL.
12. Explicit confirmation that E2/U1/U2/U3/E3, Prisma, deployment, and production were not changed.

## 10. Stop Condition

Stop after the draft implementation PR and evidence report.

Do not merge, deploy, tag, begin E2, or continue to audit without a separate Architecture Review decision.
