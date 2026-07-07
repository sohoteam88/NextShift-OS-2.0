# AG-003 Engineering Playbook Automation Extension

Status: Implemented

Project Area: Developer Platform / Engineering Governance

Lifecycle Stage: Stop A

Target Authority: [Engineering Playbook v1.1](../../../engineering/ENGINEERING_PLAYBOOK.md)

---

## Purpose

AG-003 connects the approved Engineering Playbook v1.1 with the existing developer-platform automation tools:

- AG-001 Artifact Generator
- AG-002 Chat Bootstrap Generator

The extension documents how automation supports engineering handoff, package generation, evidence transfer, and AI continuity without replacing governance.

## Scope

Implemented scope:

- Confirmed AG-002 checklist wording includes `继续`.
- Added Engineering Playbook automation guidance.
- Added dedicated Engineering Automation guide.
- Clarified Artifact Generator authority boundaries.
- Added engineering preparation command alias.
- Updated AI bootstrap/session context entrypoints.
- Updated engineering and master navigation.
- Documented implementation evidence.

Out of scope:

- No Engineering Orchestrator v1.0.
- No new architecture layer.
- No new runtime package.
- No replacement of AG-001 or AG-002.
- No generated ZIP committed.
- No release package.
- No commit.
- No push.

## Authority Boundary

AG-003 is an automation documentation extension.

It does not change the mandatory lifecycle:

```text
Planning
  -> Implementation
  -> Verification
  -> Audit
  -> Release
```

Stop A, Stop B, and Stop C remain convenience handoff labels only. They do not supersede Engineering Playbook v1.1.

## Operator Workflow

Use:

```bash
pnpm artifact:generate
pnpm chat:prepare
pnpm engineering:prepare
```

Only generate packages when a handoff, audit continuation, release package, deployment evidence package, or fresh AI window needs them.

Generated outputs remain under:

```text
artifacts/
```

and must not be committed.

## Implementation Evidence

- [Implementation Report](IMPLEMENTATION_REPORT.md)
- [Engineering Automation](../../../engineering/ENGINEERING_AUTOMATION.md)
- [Artifact Generator](../../../ARTIFACT_GENERATOR.md)

## Release Documentation

- [Release Notes](RELEASE_NOTES.md)
- [Release Checklist](RELEASE_CHECKLIST.md)
- [Approval Record](APPROVAL_RECORD.md)
- [Release Summary](RELEASE_SUMMARY.md)
