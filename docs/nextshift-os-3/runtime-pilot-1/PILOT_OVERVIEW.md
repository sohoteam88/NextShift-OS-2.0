# OS 3.3 Runtime Pilot 1 Overview

Version: 1.0

Status: Planning Complete

Last Updated: 2026-07-09

Branch: `planning/os-3.3-runtime-pilot-1`

Base Branch: `planning/os-3.3-runtime-platform`

---

## Purpose

Design the first OS 3.3 Runtime Integration pilot without implementing it.

Pilot target:

```text
Revenue Drivers Runtime Capability Adapter
```

This pilot is selected because the OS 3.3 Runtime Readiness Review identified Revenue Drivers as the safest first integration target: deterministic, already tested, low coupling, and easy to roll back.

---

## Scope

The future implementation will wrap Revenue Driver discovery and intent resolution in a runtime capability adapter.

Target source area:

- `src/modules/revenue-drivers/constants/revenue-drivers.ts`
- `src/modules/revenue-drivers/constants/revenue-driver-intents.ts`
- `src/modules/revenue-drivers/components/RevenueDriverHub.tsx`
- `src/modules/revenue-drivers/components/RevenueDriverIntentResolver.tsx`
- `src/app/api/v1/revenue-drivers/intent/route.ts`
- `src/__tests__/services/revenue-drivers.test.ts`

Runtime package anchors:

- `packages/runtime/src/context`
- `packages/runtime/src/capability`
- `packages/runtime/src/event`
- `packages/runtime/src/diagnostics`

---

## Non-Goals

- No production behavior change during planning.
- No runtime implementation during planning.
- No CI changes.
- No Prisma schema changes.
- No environment file changes.
- No deployment changes.
- No tag creation.
- No merge approval.
- No dashboard rewrite.
- No analytics runtime integration.
- No Business Brain or Decision Brain authority replacement.

---

## Current Flow

```text
UI
  |
  v
Business Service
  |
  v
Application
  |
  v
Domain
```

Current Revenue Driver behavior is implemented mostly inside the `src/modules/revenue-drivers` module:

- UI reads `REVENUE_DRIVERS` to render the hub and dashboard entry points.
- UI resolves deep-link intent through `resolveRevenueDriverIntent`.
- UI optionally sends intent audit data to `/api/v1/revenue-drivers/intent`.
- The API route validates input, requires authenticated user context, and writes an audit log through Prisma.
- Existing package-level application/domain participation is thin for this feature; the current module acts as the business-service seam.

---

## Target Flow

```text
UI
  |
  v
Revenue Runtime Adapter
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

The adapter becomes the only new seam between UI and runtime primitives. It must not replace existing behavior unless the feature flag is enabled.

---

## Feature Flag

Flag:

```text
retiredRevenueRuntimeFlag
```

Default:

```text
OFF
```

Required behavior:

- When OFF, the current Revenue Driver path remains unchanged.
- When OFF, no runtime context, runtime capability, runtime event, or runtime diagnostics object is required for the user path.
- When ON, the UI may call the Revenue Runtime Adapter for runtime metadata, runtime-safe resolution, and runtime event preparation.
- When ON and adapter execution fails, the system must fall back to current behavior.

---

## Pilot Success Definition

Pilot 1 is successful when a later implementation can prove:

- Revenue Driver intent resolution still returns the same result with the flag OFF.
- Runtime-enabled resolution returns the same user-visible result as the legacy resolver.
- Runtime context and capability metadata are created without secrets or unsafe metadata keys.
- Runtime event payloads are deterministic and safe to log.
- Invalid and fallback intents are handled explicitly.
- Existing tests remain green.
- New adapter tests cover OFF, ON, resolved, invalid, fallback, and error fallback paths.

---

## Planning Deliverables

- [Implementation Contract](IMPLEMENTATION_CONTRACT.md)
- [Architecture](ARCHITECTURE.md)
- [Data Flow](DATA_FLOW.md)
- [Acceptance Criteria](ACCEPTANCE_CRITERIA.md)
- [Execution Task](EXECUTION_TASK.md)
