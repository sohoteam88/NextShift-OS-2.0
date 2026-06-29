## RELEASE_TAGS

Version: 1.0

Status: Current

---

## Purpose

This document records the official release tags for NextShift OS capabilities.

Release tags provide stable engineering checkpoints that can be referenced by source control, documentation, audits, and future capability development.

This document is the authoritative registry for capability releases.

---

## Tag Strategy

Every released capability receives:

1. A semantic release tag.
2. Optional reference capability tag.

Semantic release tags identify a specific released version.

Reference tags identify the current engineering reference implementation.

---

## Current Release Registry

| Capability               | Release Tag  | Reference Tag               | Status |
| ------------------------ | ------------ | --------------------------- | ------ |
| CAP-001 Business Profile | CAP-001-v1.0 | reference-capability-cap001 | Active |

---

## CAP-001 Release

Capability: CAP-001 Business Profile

Release Tag:

```text
CAP-001-v1.0
```

Reference Tag:

```text
reference-capability-cap001
```

Version: 1.0

Release Date: 2026-06-26

Capability Status: Released

Reference Status: Current Reference Capability

---

## Release Scope

Included:

- Blueprint-aligned implementation
- Core Runtime integration
- Seven implementation slices
- Independent slice audits
- Full capability audit
- Business Twin activation
- Capability release documentation

---

## Engineering Status

Architecture: Frozen

Runtime: Released

Reference Capability: Yes

Backend / Runtime: Production Foundation

API: Deferred

UI: Deferred

Persistence: Deferred

---

## Release Governance

A capability may receive a release tag only after:

- All planned slices are complete.
- Full Capability Audit is approved.
- Critical findings = 0.
- High findings = 0.
- Blocking Medium findings = 0.
- Release documentation is complete.

---

## Reference Capability Governance

A capability may receive a reference tag only when:

- It is architecturally complete.
- It demonstrates validated engineering practices.
- It is approved for reuse by future capabilities.
- It becomes the canonical implementation example.

Only one active reference capability should exist for a given capability category.

---

## Git Tag Convention

Semantic release:

```text
CAP-001-v1.0
```

Future examples:

```text
CAP-001-v1.1
CAP-001-v2.0
CAP-002-v1.0
```

Reference tag:

```text
reference-capability-cap001
```

Future reference tags should change only when a newer capability supersedes the previous reference implementation.

---

## Future Releases

Planned:

| Capability        | Planned Release |
| ----------------- | --------------- |
| CAP-002 CRM       | Pending         |
| CAP-003 Content   | Pending         |
| CAP-004 Campaign  | Released v1.0   |
| CAP-005 Revenue   | Pending         |
| CAP-006 Analytics | Pending         |
| CAP-007 AI Coach  | Pending         |

---

## Release History

| Date       | Capability               | Version | Notes                      |
| ---------- | ------------------------ | ------- | -------------------------- |
| 2026-06-26 | CAP-001 Business Profile | 1.0     | First Reference Capability |

---

## Guiding Principle

Release tags identify stable engineering milestones.

Reference tags identify the implementation patterns that future capabilities should inherit.
