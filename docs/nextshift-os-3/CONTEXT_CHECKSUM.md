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
| [Repository Status](REPOSITORY_STATUS.md) | `25d3fa8b59ec20a6eaf70980521f5f3f11c7956ca1103536bc46fed445cb1af6` |
| [Next Action](NEXT_ACTION.md) | `0bcd04c830c9f5e046c3968033f6f33ffed7c95a436e3f8559c8eafb9c94f4e2` |
| [AI Handover](AI_HANDOVER.md) | `36a69bb4da1fcbdad578e2cf6d524ffa02838775713a9aa69c83f1ef53cd96f8` |

Package checksum over the checksum manifest above:

```text
db67f4d5b99a5babf5338ff2ea8355bf77f334c89030046cc8502b2dec32df32
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
