# Protected Files

Version: 1.0

Status: Current

Last Updated: 2026-07-08

---

## Protection Meaning

Protected does not mean frozen forever.

Protected means changes must be intentional, traceable, validated, and consistent with the authority hierarchy. Do not casually edit these files to satisfy a short-term implementation, a generated package, or a single chat suggestion.

## Tier 0 - Constitutional Authority

These define the identity and operating foundation of NextShift OS.

- `docs/nextshift-os-3/README.md`
- `docs/nextshift-os-3/SYSTEM_CONTEXT.md`
- `docs/nextshift-os-3/NEXTSHIFT_OS_3_BLUEPRINT.md`
- `docs/nextshift-os-3/MVP_1_ALIGNMENT.md`
- `docs/nextshift-os-3/MVP_1_IMPLEMENTATION_MASTER_PLAN.md`
- `docs/nextshift-os-3/MVP_1_PHASE_TRACKER.md`
- `docs/nextshift-os-3/IMPLEMENTATION_MASTER_ROADMAP.md`
- `docs/nextshift-os-3/phase-0-foundation/*`
- `docs/nextshift-os-3/constitution/*`
- `docs/nextshift-os-3/phase-2-architecture/NEXTSHIFT_REFERENCE_ARCHITECTURE.md`

## Tier 1 - Current State Authority

These state what is current, approved, released, or active.

- `docs/nextshift-os-3/MASTER_INDEX.md`
- `docs/nextshift-os-3/PROJECT_CONTEXT.md`
- `docs/nextshift-os-3/PROJECT_STATUS.md`
- `docs/nextshift-os-3/REPOSITORY_STATUS.md`
- `docs/nextshift-os-3/NEXT_ACTION.md`
- `docs/nextshift-os-3/AI_HANDOVER.md`
- `docs/nextshift-os-3/BLUEPRINT_STATUS.md`
- `docs/nextshift-os-3/RUNTIME_STATUS.md`
- `docs/nextshift-os-3/CAPABILITY_STATUS.md`
- `docs/nextshift-os-3/WORKFLOW_STATUS.md`
- `docs/nextshift-os-3/WORKFLOW_RELEASES.md`

## Tier 2 - Engineering Governance Authority

These control engineering workflow, release discipline, documentation discipline, and branch alignment.

- `docs/nextshift-os-3/engineering/ENGINEERING_PLAYBOOK.md`
- `docs/nextshift-os-3/engineering-playbook-v1.2/*`
- `docs/nextshift-os-3/engineering/ENGINEERING_STANDARDS.md`
- `docs/nextshift-os-3/engineering/ENGINEERING_AUTOMATION.md`
- `docs/nextshift-os-3/engineering/STD-003_DOCUMENTATION_STANDARD_v1.0.md`
- `docs/nextshift-os-3/engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md`
- `docs/nextshift-os-3/engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md`
- `docs/nextshift-os-3/engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.1.md`
- `docs/nextshift-os-3/engineering/STD-007_REPOSITORY_CANONICAL_RESOLUTION_STANDARD_v1.0.md`
- `docs/nextshift-os-3/docs-hygiene/*`
- `scripts/audit-markdown-authority.ts`
- `scripts/validate-doc-links.ts`
- `scripts/validate-navigation-consistency.ts`

## Tier 3 - Domain Authority

These govern major operating domains and should change through project planning, implementation evidence, verification, and audit.

- `docs/nextshift-os-3/runtime-platform/*`
- `docs/nextshift-os-3/capabilities/README.md`
- `docs/nextshift-os-3/capabilities/CAPABILITY_LIFECYCLE_STANDARD.md`
- `docs/nextshift-os-3/business-os/*`
- `docs/nextshift-os-3/ai/*`
- `docs/nextshift-os-3/design-system/*`
- `docs/nextshift-os-3/ui-kit/*`
- `docs/nextshift-os-3/workspace-experience-framework/*`

## Tier 4 - Historical Evidence

These should usually be preserved, not rewritten:

- `audit/*`
- `docs/nextshift-os-3/**/AUDIT*.md`
- `docs/nextshift-os-3/**/VERIFICATION*.md`
- `docs/nextshift-os-3/**/IMPLEMENTATION_REPORT.md`
- `docs/nextshift-os-3/**/RELEASE_NOTES.md`
- `docs/nextshift-os-3/**/RELEASE_SUMMARY.md`
- `docs/nextshift-os-3/**/APPROVAL_RECORD.md`
- generated artifact snapshots under artifact output folders

Historical files may contain older version names. That is evidence, not drift, unless a historical file is being used as current authority.
