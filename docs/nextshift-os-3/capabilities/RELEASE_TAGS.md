## RELEASE_TAGS

Version: 1.0

Status: Current

---

## Purpose

This document records the official release tags for NextShift OS capabilities.

Release tags provide stable engineering checkpoints that can be referenced by source control, documentation, audits, and future capability development.

This document is the authoritative registry for capability releases and the governance reference for future workflow release tags.

---

## Tag Strategy

Every released capability receives:

1. A semantic release tag.
2. Optional reference capability tag.

Semantic release tags identify a specific released version.

Reference tags identify the current engineering reference implementation.

---

## Current Release Registry

| Capability | Release Artifact | Recorded Release Tag | Reference Tag | Status |
| --- | --- | --- | --- | --- |
| CAP-001 Business Profile | Capability release recorded | CAP-001-v1.0 | reference-capability-cap001 | Active reference capability |
| CAP-002 CRM | [CAP-002 CRM Release](CAP-002_CRM_RELEASE.md) | CAP-002-v1.0 | None | Released; Git tag not verified in local repository |
| CAP-003 Content | [CAP-003 Content Release](CAP-003_CONTENT_RELEASE.md) | CAP-003-v1.0 | None | Released; Git tag not verified in local repository |
| CAP-004 Campaign | [CAP-004 Campaign Release](CAP-004_CAMPAIGN_RELEASE.md) | CAP-004-v1.0 | None | Released; Git tag not verified in local repository |

Registry governance note:

- CAP-002, CAP-003, and CAP-004 are released by documentation artifact.
- Local Git tag verification found no `CAP-*` tags at the time of RM-001 S-002 synchronization cleanup.
- Future Git tag creation must use the recorded release tag names above and follow STD-004 and STD-005 release alignment gates.

Workflow release records are maintained in [Workflow Releases](../WORKFLOW_RELEASES.md).

Workflow release records do not automatically create Git tags. A workflow Git tag may be added only after release governance approval and must be reflected in both this document and [Workflow Releases](../WORKFLOW_RELEASES.md).

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

Workflow release tags, if approved, should use:

```text
WF-003-v1.0
WF-004-v1.0
```

Workflow tags must point to the approved workflow release commit or an approved workflow release checkpoint commit.

Until workflow Git tags are explicitly created, the authoritative workflow release references are the implementation and audit commit pairs recorded in [Workflow Releases](../WORKFLOW_RELEASES.md).

---

## Future Releases

Planned and governed:

| Capability        | Planned Release |
| ----------------- | --------------- |
| CAP-002 CRM       | Released v1.0; Git tag pending verification or creation |
| CAP-003 Content   | Released v1.0; Git tag pending verification or creation |
| CAP-004 Campaign  | Released v1.0; Git tag pending verification or creation |
| CAP-005 Revenue   | In progress     |
| CAP-006 Analytics | Pending         |
| CAP-007 AI Coach  | Pending         |

---

## Release History

| Date       | Capability               | Version | Notes |
| ---------- | ------------------------ | ------- | ----- |
| 2026-06-26 | CAP-001 Business Profile | 1.0     | First Reference Capability |
| 2026-06-27 | CAP-002 CRM              | 1.0     | Released by [CAP-002 CRM Release](CAP-002_CRM_RELEASE.md); Git tag pending verification or creation |
| 2026-06-27 | CAP-003 Content          | 1.0     | Released by [CAP-003 Content Release](CAP-003_CONTENT_RELEASE.md); Git tag pending verification or creation |
| 2026-06-28 | CAP-004 Campaign         | 1.0     | Released by [CAP-004 Campaign Release](CAP-004_CAMPAIGN_RELEASE.md); Git tag pending verification or creation |

---

## Guiding Principle

Release tags identify stable engineering milestones.

Reference tags identify the implementation patterns that future capabilities should inherit.
