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
| [Project Context](PROJECT_CONTEXT.md) | `fff00cf7e5209ef1c99b18ff9c507f608e654859e2f897f9f0952a6faf040dc8` |
| [Repository Status](REPOSITORY_STATUS.md) | `3a7a8a70b4069263236dd41292eb1039671012315355de9e9a384cea801cf6ff` |
| [Next Action](NEXT_ACTION.md) | `e62c9386ff04f5705ca59c4d3cbb030a1fff11fb640969b6cd228ba8b72dbbfb` |
| [AI Handover](AI_HANDOVER.md) | `57eae8b9fe8cad08d4e37ae17bc028d60549019638666c32639348368650df69` |

Package checksum over the checksum manifest above:

```text
f6de352235a965a757b4c5d94054ae54ce5413ea09ea539761dbedee214fe271
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
