# Engineering Automation

Version: 1.0

Status: Current

Last Updated: 2026-07-07

---

## Purpose

Engineering Automation documents how existing generator tools support NextShift engineering handoff, evidence packaging, and AI continuity.

This guide covers:

- AG-001 Artifact Generator
- AG-002 Chat Bootstrap Generator
- Standard package types
- Standard handoff flow
- Stop A / Stop B / Stop C convenience packaging
- Git hygiene and secret safety

## Authority

[Engineering Playbook v1.1](ENGINEERING_PLAYBOOK.md) remains the lifecycle authority.

This guide is operational documentation. It does not define lifecycle policy, approve release state, or replace:

- Planning
- Implementation
- Verification
- Audit
- Release

It must not be used to create or revive Engineering Orchestrator v1.0.

## Lifecycle Alignment

The approved lifecycle remains:

```text
Planning
  -> Implementation
  -> Verification
  -> Audit
  -> Release
```

Automation may package evidence for a lifecycle stage, but package generation does not prove the stage is complete.

## AG-001 Artifact Generator

AG-001 packages repository Markdown sources into standardized artifact ZIP files.

Command:

```bash
pnpm artifact:generate
```

Generate a context package:

```bash
pnpm artifact:generate -- --type context --id <id>
```

Generate a release package from an explicit source:

```bash
pnpm artifact:generate -- --type release --id <id> --source <repo-relative-md-file>
```

Supported package types:

- `context`
- `execution`
- `audit`
- `release`
- `deployment`

AG-001 is a packaging utility. It does not define whether a package is approved, audited, released, or complete.

## AG-002 Chat Bootstrap Generator

AG-002 prepares a fresh AI window to continue from repository evidence.

Command:

```bash
pnpm chat:prepare
```

Engineering alias:

```bash
pnpm engineering:prepare
```

The bootstrap package includes:

- `context-latest.zip`
- `repository-latest.zip`
- `CHAT_BOOTSTRAP_MANIFEST.md`
- `CHAT_UPLOAD_CHECKLIST.md`

The upload checklist must instruct the operator to type:

```text
继续
```

after the bootstrap files are uploaded and the next chat has loaded the manifest and context package.

## Standard Handoff Flow

1. Confirm branch and working tree status.
2. Identify the project, platform, capability, slice, or release package in scope.
3. Update source documentation or implementation evidence.
4. Run the narrowest relevant validation.
5. Generate handoff packages only when needed.
6. Upload the manifest first in the next chat.
7. Load the context package before inspecting repository files.
8. Type `继续` to resume.

## Stop Point Mapping

Stop A, Stop B, and Stop C are convenience packaging labels only.

They do not supersede the approved lifecycle.

| Stop Point | Convenience Use | Lifecycle Boundary |
| --- | --- | --- |
| Stop A | Planning-to-implementation handoff package | Planning before Implementation |
| Stop B | Verification and audit handoff package | Verification before Audit |
| Stop C | Release and next-phase handoff package | Audit before Release / next phase |

## Generated Artifact Policy

Generated artifacts are written under:

```text
artifacts/
```

Rules:

- `artifacts/` must remain ignored by Git.
- Generated ZIP files must not be committed.
- Generated bootstrap manifests and upload checklists under `artifacts/` must not be committed.
- Generator source code and documentation are tracked.
- Repository Markdown sources remain the source of truth.

## Git Hygiene

Before editing:

```bash
git status --short
```

During implementation:

- Keep AG work scoped to the approved files.
- Do not stage unrelated worktree changes.
- Do not revert user or unrelated generated changes.
- Do not commit unless explicitly authorized.
- Do not push unless explicitly authorized.

Before handoff:

```bash
git diff --check
git diff --cached --check
```

## Secret Safety

Automation must not package live secrets.

Do not include:

- `.env`
- `.env.local`
- `.env.production`
- database URLs with passwords
- Supabase service-role keys
- API keys
- local credential files

AG-001 accepts Markdown source files only. AG-002 uses Git-visible, non-ignored repository files for repository snapshots, so local ignored secret files must remain ignored.

## When To Regenerate Chat Bootstrap Packages

Run `pnpm chat:prepare` or `pnpm engineering:prepare` when:

- handing off to a fresh Codex, Claude, or ChatGPT window;
- preparing an audit or re-audit handoff;
- transferring long-context work;
- refreshing repository state after material documentation changes;
- preparing a continuation package after validation.

Do not regenerate solely to mark work complete.

## Known Limitations

- ZIP generation depends on the local `zip` command.
- Bootstrap package generation can update generated context-package files.
- Repository snapshots include Git-visible, non-ignored files, including untracked files that are not ignored.
- Generated packages are convenience handoff artifacts, not approval records.
