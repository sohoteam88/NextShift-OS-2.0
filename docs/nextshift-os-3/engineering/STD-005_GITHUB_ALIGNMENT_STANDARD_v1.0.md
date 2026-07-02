# STD-005 GitHub Alignment Standard v1.0

Version: 1.0

Status: Approved

Last Updated: 2026-07-02

---

## Purpose

Define GitHub as the Single Source of Truth for NextShift OS and ensure the local repository, GitHub, documentation, and release state remain synchronized.

---

## Single Source Of Truth

GitHub `main` is the official project state.

Local development is considered provisional until verification, push, alignment audit, and release are complete.

---

## Mandatory Release Flow

```text
Local Development
  -> Verification
  -> Git Commit
  -> Git Push
  -> GitHub Alignment Audit
  -> Release
```

No capability, platform project, or architecture milestone is considered released until the GitHub Alignment Audit passes.

---

## GitHub Alignment Checklist

## Repository

- Working tree clean
- Latest commit pushed
- Correct release tag
- Branch synchronized

## Documentation

- README updated
- MASTER_INDEX updated
- PROJECT_ROADMAP updated
- CAPABILITY_STATUS updated
- MVP_1_ALIGNMENT updated, if applicable
- MVP_1_PHASE_TRACKER updated, if applicable
- Traceability links validated

## Platform Projects

- Design System status aligned
- UI Kit status aligned
- Workspace Experience Framework status aligned

## Release

- Release Notes completed
- Audit completed
- Verification completed
- Release package completed

---

## Alignment Gate

A release may proceed only if every checklist item is PASS.

If any item fails:

1. Stop the release.
2. Fix the inconsistency.
3. Re-run the alignment audit.

---

## Engineering Rule

After every completed Slice or Capability:

1. Verify locally.
2. Push to GitHub.
3. Audit GitHub alignment.
4. Release.
5. Continue to the next Slice.

Skipping the alignment audit is not permitted.

---

## Goal

Maintain one authoritative project state across Local, GitHub, Codex, Claude, and ChatGPT.
