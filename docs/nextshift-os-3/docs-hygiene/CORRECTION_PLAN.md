# Markdown Authority Correction Plan

This plan is based on [Markdown Authority Audit](MARKDOWN_AUTHORITY_AUDIT.md).

## Current Findings

| Finding | Count / Scope | Action |
| --- | ---: | --- |
| Markdown files scanned | 1877 | Keep audit script as repeatable inventory |
| Canonical branch version conflicts | 1 | Local branch now carries v1.2; remote branches still need synchronization |
| Active files with old engineering authority references | 0 | Current active docs no longer point to retired engineering authority as current |
| Historical files preserving old Engineering Playbook baselines | 140 | Preserve; do not bulk replace |
| Duplicate title groups with multiple versions | 17 | Classify into evolution chain vs true duplicate |
| Duplicate filename groups with multiple versions | 19 | Review generic names; avoid false positives for skills/checklists |

## Priority 1 - Resolve Authority Branch Split

Problem:

`docs/nextshift-os-3/engineering/ENGINEERING_PLAYBOOK.md` has conflicting canonical versions across branches.

| Branch | Version |
| --- | --- |
| `origin/main` | 1.1 |
| `origin/release/v3.2` | 1.1 |
| `origin/planning/os-3.3-runtime-platform` | 1.2 |

Approved v1.2 evidence:

- Release commit: `6dec2e4`
- Audit commit: `f442e4a`
- Audit result: PASS

Correction status:

1. Local working branch now includes the v1.2 authority package from `origin/planning/os-3.3-runtime-platform`.
2. Included the canonical playbook, v1.2 docs folder, audit report, validation scripts, and scoped `MASTER_INDEX.md` updates.
3. Remaining work: push/merge this branch so remote default branches no longer report v1.1 as the canonical authority.

## Priority 2 - Update Active Authority References

Completed active-file authority updates:

- `docs/nextshift-os-3/design-system/README.md`
- `docs/nextshift-os-3/design-system/PROJECT_PLANNING.md`
- `docs/nextshift-os-3/ui-kit/README.md`
- `docs/nextshift-os-3/ui-kit/PROJECT_PLANNING.md`
- `docs/nextshift-os-3/ui-kit/slices/UK-001-design-language/PLANNING.md`
- `docs/nextshift-os-3/ui-kit/slices/UK-002-design-principles/PLANNING.md`
- `docs/nextshift-os-3/ui-kit/slices/UK-003-component-catalog/DOCUMENTATION_IMPLEMENTATION_PROMPT.md`
- `docs/nextshift-os-3/workspace-experience-framework/README.md`
- `docs/nextshift-os-3/workspace-experience-framework/PROJECT_KICKOFF.md`
- `docs/nextshift-os-3/workspace-experience-framework/PROJECT_PLANNING.md`
- `docs/nextshift-os-3/ARTIFACT_GENERATOR.md`
- `docs/nextshift-os-3/engineering/ENGINEERING_AUTOMATION.md`
- `docs/chatgpt-system-context/DUPLICATE_PREVENTION.md`

Keep branch-aware/guardrail wording in:

- `AGENTS.md`
- `docs/chatgpt-system-context/README.md`
- `docs/chatgpt-system-context/CHATGPT_BOOTSTRAP_PROMPT.md`
- `docs/chatgpt-system-context/DUPLICATE_PREVENTION.md`
- `docs/nextshift-os-3/docs-hygiene/README.md`
- `docs/nextshift-os-3/engineering/ENGINEERING_PLAYBOOK.md`

## Priority 3 - Preserve Historical Evidence

Do not bulk-replace old baselines in historical evidence. These files record what was true when the audit/release was produced.

Examples:

- `audit/*`
- `docs/nextshift-os-3/capabilities/*_RELEASE.md`
- `docs/nextshift-os-3/capabilities/*_VERIFICATION*.md`
- `docs/nextshift-os-3/capabilities/*_IMPLEMENTATION*.md`
- design-system slice `RELEASE_NOTES.md`, `SLICE_RELEASE.md`, `VERIFICATION.md`, and `COMMIT_MESSAGE.md`

Correction:

1. Keep original version references.
2. Move or index old evidence behind evidence/archive navigation if it clutters the active docs.
3. Add `Historical baseline` notes only when a historical file is easy to mistake for current authority.

## Priority 4 - Duplicate Topic Decisions

### Architecture Freeze Reports

Detected chain:

- `audit/ARCHITECTURE_FREEZE_REPORT_2026-06-26.md`
- `audit/ARCHITECTURE_FREEZE_REPORT_V2_2026-06-26.md`
- `audit/ARCHITECTURE_FREEZE_REPORT_V3_2026-06-26.md`
- `audit/ARCHITECTURE_FREEZE_REPORT_V4_2026-06-26.md`

Decision:

- Treat `ARCHITECTURE_FREEZE_REPORT_V4_2026-06-26.md` as the final approved report.
- Preserve V1-V3 as historical audit trail.
- Add archive/evidence index entries instead of deleting them.

### Interview Authority Consumer Summaries

Detected pair:

- `audit/interview-authority-consumer-summary.md`
- `audit/interview-consumer-summary.md`

Decision:

- Treat `interview-authority-consumer-summary.md` as discovery inventory.
- Treat `interview-consumer-summary.md` as readiness/cutover summary.
- Rename only if a future cleanup commit includes link updates; otherwise index both with their distinct roles.

### Design System / UI Kit README and Planning

Detected pairs:

- `docs/nextshift-os-3/design-system/README.md`
- `docs/nextshift-os-3/design-system/PROJECT_PLANNING.md`
- `docs/nextshift-os-3/ui-kit/README.md`
- `docs/nextshift-os-3/ui-kit/PROJECT_PLANNING.md`

Decision:

- Keep README as current project entry.
- Keep PROJECT_PLANNING as planning evidence.
- Update authority references after Engineering Playbook v1.2 sync.

### Skills and Checklists

Detected high-volume filename groups:

- `SKILL.md`
- `checklist.md`

Decision:

- Not duplicates. These are expected per-skill files.
- Exclude from deletion/move candidates.

## Priority 5 - Recurring Validation

Run before broad documentation changes:

```bash
pnpm docs:audit-authority
```

Expected behavior:

- Historical evidence with old baselines may remain.
- Active stale authority references should trend toward zero after branch sync.
- Canonical branch conflicts should be zero after v1.2 reaches the default working branch.
