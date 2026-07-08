# NextShift System Authority

Version: 1.0

Status: Current

Last Updated: 2026-07-08

---

## Purpose

This folder is the first-read authority router for NextShift OS.

It identifies the entry documents, protected documents, and non-negotiable rules that must not be casually rewritten, duplicated, renamed, version-bumped, or bypassed.

This folder does not replace the source documents it references. It prevents new contributors and AI assistants from treating historical evidence, generated packages, or older branch snapshots as current authority.

## Read Order

1. [Important MD Folder](important-md/README.md)
2. [Authority Boundaries](AUTHORITY_BOUNDARIES.md)
3. [Iron Laws](IRON_LAWS.md)
4. [Entry Points](ENTRYPOINTS.md)
5. [Protected Files](PROTECTED_FILES.md)
6. [Change Control](CHANGE_CONTROL.md)

After that, read the source files linked from [Entry Points](ENTRYPOINTS.md).

## Human Lookup Folder

Use [important-md](important-md/README.md) when you want to quickly check whether a ChatGPT suggestion is duplicate or already governed by an existing Markdown file.

## Folder Contract

- This folder is an authority map, not a duplicate source of truth.
- Do not copy full canonical documents into this folder.
- Do not create new architecture, governance, engineering, runtime, or capability authority without checking this folder first.
- If a source document conflicts with this folder, stop and audit the conflict instead of choosing one silently.
- Historical evidence stays historical. Do not bulk-rewrite old audit, release, verification, implementation, or generated package files just to make old version strings disappear.

## Fast Answer

The current engineering workflow authority on this branch is:

- [Engineering Playbook v1.2](../engineering/ENGINEERING_PLAYBOOK.md)
- Release evidence: `6dec2e4`
- Audit evidence: `f442e4a`

Do not propose or recreate `Engineering Orchestrator v1.0`.
