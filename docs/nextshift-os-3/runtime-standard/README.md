# Runtime Adapter Standard v1.0

Version: 1.0

Status: Mandatory Standard

Last Updated: 2026-07-09

Base Evidence:

- Pilot 1 Planning
- Pilot 1 Implementation
- Pilot 1 Code Review
- OS 3.3 Runtime Review Gate

---

## Purpose

This directory defines the mandatory engineering standard for all future NextShift OS Runtime Capability Adapters.

The standard extracts the pattern proven by Pilot 1, the Revenue Drivers Runtime Capability Adapter. It does not introduce a second architecture.

---

## Standard Documents

- [Runtime Adapter Standard](RUNTIME_ADAPTER_STANDARD.md)
- [Feature Flag Standard](FEATURE_FLAG_STANDARD.md)
- [Fallback Standard](FALLBACK_STANDARD.md)
- [Metadata Contract](METADATA_CONTRACT.md)
- [Observability Standard](OBSERVABILITY_STANDARD.md)
- [Testing Standard](TESTING_STANDARD.md)
- [Code Review Checklist](CODE_REVIEW_CHECKLIST.md)
- [Architecture Checklist](ARCHITECTURE_CHECKLIST.md)
- [Migration Guide](MIGRATION_GUIDE.md)

---

## Mandatory Architecture

All future runtime adapters must preserve this flow:

```text
UI
  |
  v
Adapter
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

---

## Applies To

The standard applies to:

- Analytics Runtime Adapters
- CRM Runtime Adapters
- Dashboard Runtime Adapters
- Business Brain Runtime Adapters
- Decision Brain Runtime Adapters
- Any future Runtime Capability Adapter

---

## Core Rules

- Start with a narrow, deterministic integration surface.
- Keep the legacy behavior as the source of truth until the adapter is proven.
- Gate every adapter behind a default-OFF feature flag.
- Use `@nextshift/runtime` as the runtime package boundary.
- Do not import Prisma into adapters.
- Do not import Next.js request or response objects into adapters.
- Do not log secrets, raw headers, raw cookies, tenant payloads, user payloads, stack traces, or raw error messages.
- Do not return tenant or user identifiers to UI-facing runtime metadata.
- Use dependency injection for testable runtime artifact creation.
- Add tests for flag OFF, flag ON, fallback, invalid or degraded output, safe metadata, and legacy preservation.
