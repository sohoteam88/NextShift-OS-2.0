# Runtime Platform v1.0

Version: 1.0

Status: Frozen Engineering Platform

Last Updated: 2026-07-09

---

## Purpose

Runtime Platform v1.0 is the official engineering platform for NextShift OS Runtime Capability Adapters.

It freezes the proven pattern established by two validated adapter implementations:

- Revenue Runtime Adapter
- Analytics Runtime Adapter

Future runtime adapters for Revenue, Analytics, Dashboard, CRM, Business Brain, and Decision Brain must follow this platform unless a later governance-approved standard replaces it.

---

## Mandatory Architecture

```text
UI
  |
  v
Runtime Adapter
  |
  v
Runtime
  |
  v
Application
  |
  v
Domain
```

Runtime adapters are the only approved integration seam between UI/module triggers and runtime primitives.

---

## Release Package

- [Runtime Platform Architecture](RUNTIME_PLATFORM_ARCHITECTURE.md)
- [Reference Implementations](REFERENCE_IMPLEMENTATIONS.md)
- [Adoption Guide](ADOPTION_GUIDE.md)
- [Release Notes](RELEASE_NOTES.md)
- [Lessons Learned](LESSONS_LEARNED.md)
- [Known Limitations](KNOWN_LIMITATIONS.md)
- [Roadmap](ROADMAP.md)
- [Release Checklist](RELEASE_CHECKLIST.md)
- [Release Manifest](RELEASE_MANIFEST.md)

---

## Source Evidence

- [Runtime Adapter Standard v1.0](../runtime-standard/README.md)
- [Runtime Readiness Review Gate](../runtime-review/OS33_RUNTIME_READINESS_REPORT.md)
- [Pilot 1 Revenue Implementation Report](../runtime-pilot-1/IMPLEMENTATION_REPORT.md)
- [Pilot 1 Code Review Report](../runtime-pilot-1/CODE_REVIEW_REPORT.md)
- [Pilot 2 Analytics Implementation Report](../runtime-pilot-2-analytics/IMPLEMENTATION_REPORT.md)

---

## Engineering Workflow

Runtime Platform v1.0 requires this workflow for new runtime adapters:

```text
Planning
  |
  v
Implementation
  |
  v
Claude Code Review
  |
  v
Architecture Review
  |
  v
Refinement
  |
  v
Merge
  |
  v
Archive
  |
  v
Platform Freeze
```

---

## Runtime Package

Runtime primitives are provided by:

```text
packages/runtime/
```

Public package boundary:

```text
@nextshift/runtime
```

Adapters must import runtime primitives through the package boundary and must not import runtime package source files through relative paths.

---

## Platform Rule

No future Runtime Capability Adapter should bypass Runtime Platform v1.0.

Any exception requires a new planning review, explicit risk justification, and an update to the Runtime Adapter Standard.
