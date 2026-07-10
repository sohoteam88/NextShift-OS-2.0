# Runtime Platform Roadmap

Version: 1.0

Status: Frozen

Last Updated: 2026-07-09

---

## Current State

Runtime Platform v1.0 is frozen after two validated adapters:

1. Revenue Runtime Adapter
2. Analytics Runtime Adapter

The platform is ready to guide future adapter planning and implementation.

---

## Recommended Next Targets

### 1. CRM Runtime Adapter Planning

CRM should be considered if a narrow, deterministic service boundary can be identified without Prisma or deployment changes.

### 2. Dashboard Runtime Adapter Planning

Dashboard remains high value but high risk.

Planning should isolate a small dashboard projection slice rather than integrating the full dashboard service graph.

### 3. Business Brain Runtime Adapter Planning

Business Brain should wait until package tests and integration contracts improve.

Planning must explicitly separate internal runtime context metadata from UI-facing metadata.

### 4. Decision Brain Runtime Adapter Planning

Decision Brain may be a good candidate after recommendation-specific contracts are stable.

It should not become a broad decision authority without a narrow pilot.

---

## Required Workflow For Each Target

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

## Roadmap Guardrails

Future work must not:

- bypass Runtime Platform v1.0
- skip default-OFF feature flags
- place runtime routing in callers
- expose tenant or user identifiers in UI-facing metadata
- log sensitive payloads or raw errors
- use relative imports into `packages/runtime/src`
- introduce Prisma, env, deployment, or CI changes without explicit scope approval
