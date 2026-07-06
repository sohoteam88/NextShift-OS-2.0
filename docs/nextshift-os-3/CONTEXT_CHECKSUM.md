# Context Checksum

Version: 1.0

Status: Current

Last Updated: 2026-07-06

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
| [Project Context](PROJECT_CONTEXT.md) | `922ac405734061b41298e4a36f82945b2773b8d20d5f3850537a0c0d9ab720f7` |
| [Repository Status](REPOSITORY_STATUS.md) | `928a2846f62ea2cb30fc1fbab5a9df98915c6cc012f772e820647c9f8bc6ce69` |
| [Next Action](NEXT_ACTION.md) | `568079861c3ddbc15cb612541e582efa3bb93714a2ffbc1e5c4c2f5951bd650a` |
| [AI Handover](AI_HANDOVER.md) | `23c7005470223c607ae9e93e935e1922eea3a9f96fb3681a0cadb648e3f1a507` |

Package checksum over the checksum manifest above:

```text
e132d44d79b0e83a565dfccea49b24af3298be29a35437c8eea665827ae0a742
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
