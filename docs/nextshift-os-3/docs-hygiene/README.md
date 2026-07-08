# Docs Hygiene

This folder tracks Markdown authority, duplicate-topic, and version-drift audits for NextShift OS.

## Current Audit

- [Markdown Authority Audit](MARKDOWN_AUTHORITY_AUDIT.md)
- [Correction Plan](CORRECTION_PLAN.md)
- [Machine-readable audit JSON](markdown-authority-audit.json)

Regenerate with:

```bash
pnpm docs:audit-authority
```

## Cleanup Rules

1. Treat canonical docs and historical evidence differently.
2. Do not bulk-replace old version strings inside audit, verification, release, or implementation evidence.
3. Update active authority docs, README files, navigation indexes, and AI onboarding context when the current authority changes.
4. If a newer version exists only on another branch, record the branch and release/audit commits before changing local docs.
5. Archive or index superseded planning/update artifacts instead of deleting them.

## Current Authority State

Engineering Playbook v1.2 has approved evidence on `planning/os-3.3-runtime-platform`:

- Release commit: `6dec2e4`
- Audit commit: `f442e4a`

This local branch now carries the v1.2 authority package. Remote branches that still declare older playbook versions should be treated as stale for that authority until they are synchronized or explicitly scoped to historical evidence.
