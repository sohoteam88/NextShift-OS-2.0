# Context Checksum

Version: 1.0

Status: Current

Last Updated: 2026-07-09

---

## Purpose

Record integrity checks for the Project Context System.

This file is maintained by [Project Context](PROJECT_CONTEXT.md).

---

## Checksum Scope

The checksum scope includes:

- [Project Context](PROJECT_CONTEXT.md)
- [Repository Status](REPOSITORY_STATUS.md)
- [Next Action](NEXT_ACTION.md)
- [AI Handover](AI_HANDOVER.md)

This file is excluded from the combined checksum to avoid self-referential checksum churn.

---

## Current Checksums

| File | SHA-256 |
| --- | --- |
| [Project Context](PROJECT_CONTEXT.md) | `9cd1ec00e869b8882995eff40ca8787bfd18c4a71d4bbd6e959df3fcacae0900` |
| [Repository Status](REPOSITORY_STATUS.md) | `c631102fffac7cff25bc096ed9a0a2fd6142e83e3e32208826da0ffefda8a739` |
| [Next Action](NEXT_ACTION.md) | `6ed9f6c1d6f00ec02196e3edb74e302847a536f174ff6adfdb90314d9bf31810` |
| [AI Handover](AI_HANDOVER.md) | `c6367ac6a015abccd607f6a517511fe3666c92bc6482fd3a8ecbf0dd633e18c1` |

Package checksum over the checksum manifest above:

```text
777d5f258c57d3209e48356a9e75b1f4cf74e7f52e7ada63a5601130be7204ef
```

---

## Recalculation Command

```bash
shasum -a 256 docs/nextshift-os-3/PROJECT_CONTEXT.md docs/nextshift-os-3/REPOSITORY_STATUS.md docs/nextshift-os-3/NEXT_ACTION.md docs/nextshift-os-3/AI_HANDOVER.md
```

Package checksum:

```bash
shasum -a 256 docs/nextshift-os-3/PROJECT_CONTEXT.md docs/nextshift-os-3/REPOSITORY_STATUS.md docs/nextshift-os-3/NEXT_ACTION.md docs/nextshift-os-3/AI_HANDOVER.md | shasum -a 256
```
