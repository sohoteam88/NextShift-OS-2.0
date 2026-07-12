# OS 3.3 Runtime Platform Release Notes

Version: 3.3 RC1

Status: RC Package Prepared - Awaiting Approval

Last Updated: 2026-07-10

---

## Summary

OS 3.3 Runtime Platform prepares NextShift OS for runtime adapter migration through a narrow, validated release candidate.

This RC proves the Runtime Adapter Standard with two real module integrations, turns the adapter lifecycle into a reusable factory, strengthens CI gates, records feature flag governance, and closes the first hardening loop identified by architecture review.

This is a release candidate package. It does not approve production release or create a tag.

---

## New Capabilities

### Runtime Adapter Callsites

Two pilot adapters now have real product callsites:

- Revenue Runtime Adapter
- Analytics Runtime Adapter

Both preserve legacy behavior when their flags are OFF and route through runtime metadata when enabled.

### Adapter Factory

`createRuntimeAdapter()` is now available through `@nextshift/runtime`.

Future Runtime Capability Adapters must use the factory rather than hand-writing the shared lifecycle. The factory enforces:

- feature flag evaluation
- legacy resolver execution
- runtime metadata lifecycle
- fallback warning lifecycle
- dependency injection for tests
- safe metadata output

### Runtime Adapter Standard v1.0 + Factory

The Runtime Adapter Standard now requires:

- package-boundary imports from `@nextshift/runtime`
- factory usage for new adapters
- explicit safe field enumeration in `createWarningPayload`
- code review verification that `isEnabled` calls a real feature flag helper or a test DI equivalent

### CI Gates

CI now covers:

- planning and release PRs
- root type-check, lint, and build
- root tests
- package tests
- E2E secret detection
- graceful E2E skip when secrets are not configured

### Runtime Flag Registry

Runtime flags are centrally registered in `src/lib/runtime-flags.ts`.

Current flags:

| Flag | Module | Default |
| --- | --- | --- |
| `retiredRevenueRuntimeFlag` | `revenue-drivers` | OFF unless exactly `"true"` |
| `retiredAnalyticsRuntimeFlag` | `analytics` | OFF unless exactly `"true"` |

Flag usage:

```text
retiredRevenueRuntimeFlag=true
retiredAnalyticsRuntimeFlag=true
```

Any value other than exactly `true` keeps the runtime path OFF.

### Hardening

The RC includes:

- image remote domain allowlist narrowed from global wildcard to approved domains
- rate limiting on public slug check and public invite lookup endpoints
- ESLint module-boundary rule introduced at warn level
- 192-warning module-boundary baseline recorded
- Layer Roadmap P0 moved into docs
- legacy runtime package boundaries documented

---

## Known Limitations

### E2E Secrets Not Configured

CI can detect missing E2E secrets and skip the Playwright E2E job safely.

This is acceptable for RC package validation, but production release should configure the documented E2E secrets if E2E must become a hard gate.

### D-001 Deployment IP Header Confirmation

The new public endpoint rate limits use the first value of `x-forwarded-for`.

This requires deployment topology confirmation:

- Cloudflare should prefer `cf-connecting-ip`.
- Self-managed nginx should replace, not append, forwarded IP headers.

This is non-blocking for the RC package but should be handled before production hardening.

### Adapter Migration Coverage

Runtime adapter migration currently covers 2 of 68 modules:

- Revenue
- Analytics

Architecture review explicitly recommends RC status because the platform pattern is proven, but broad module migration is not complete.

### Legacy Runtime Packages

`runtime-core`, `runtime-adapters`, `runtime-orchestrator`, and `workspace-runtime` remain in the repository because they contain real workflow logic and tests.

They are not the adapter platform. New Runtime Capability Adapters must use `@nextshift/runtime`.

---

## Upgrade Notes

Before approving OS 3.3 release:

1. Review the RC package.
2. Confirm whether `v3.3.0-rc1` should be created.
3. Confirm whether the Runtime Platform should be frozen or remain RC.
4. Decide whether E2E secrets must be configured before tag creation.
5. Confirm deployment IP header behavior for D-001.

---

## Release Decision

```text
OS 3.3 RC package prepared, awaiting approval
```
