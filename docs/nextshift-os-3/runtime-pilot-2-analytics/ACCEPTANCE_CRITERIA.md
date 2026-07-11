# OS 3.3 Runtime Pilot 2 Analytics Acceptance Criteria

Version: 1.0

Status: Planning Complete

Last Updated: 2026-07-09

Branch: `planning/os-3.3-runtime-pilot-2-analytics`

---

## Planning Acceptance Criteria

This planning phase is accepted when:

- Pilot target is documented as Analytics Runtime Adapter.
- Current analytics dashboard flow is documented.
- Current analytics-center projection flow is documented.
- Target runtime flow is documented.
- Adapter responsibilities are documented.
- Runtime responsibilities are documented.
- Legacy resolver and service responsibilities are documented.
- Feature flag strategy is documented.
- Fallback strategy is documented.
- Safe metadata contract is documented.
- Observability strategy is documented.
- Testing strategy is documented.
- Rollback strategy is documented.
- Claude Code Review checklist is documented.
- ChatGPT Architecture Review checklist is documented.
- Explicit out-of-scope items are documented.
- No implementation code is changed.
- No production code, CI, Prisma, env, deployment, tag, merge, or Pilot 3 work is performed.

---

## Future Implementation Acceptance Criteria

The future implementation is accepted only when all criteria below are met.

### Feature Flag

- `retiredAnalyticsRuntimeFlag` exists as the analytics runtime flag.
- Default is OFF.
- OFF preserves current analytics behavior.
- ON activates only the Analytics Runtime Adapter path.
- Any non-`true` value is treated as OFF.
- No env files are modified in the first implementation pass.

### User Behavior

- Existing analytics-center response remains valid when flag is OFF.
- Existing `/analytics` page role selection remains valid.
- Existing member analytics API behavior remains valid.
- Existing leader analytics API behavior remains valid.
- Existing operator analytics API behavior remains valid.
- Existing chart data contracts remain valid.
- Existing translation keys remain valid.
- UI does not require runtime metadata for rendering.

### Runtime Behavior

- Runtime context is created only when flag is ON.
- Runtime capability identity is created only when flag is ON.
- Runtime event type is deterministic.
- Runtime diagnostics are produced for healthy or degraded adapter execution.
- Runtime metadata contains no secret-like keys.
- Runtime errors degrade to legacy analytics behavior.

### Adapter Behavior

- Adapter uses existing analytics projection output as the source of truth.
- Adapter preserves legacy projection output.
- Adapter imports runtime through `@nextshift/runtime`.
- Adapter does not import runtime source through relative paths.
- Adapter does not import Prisma.
- Adapter does not import Next.js request or response objects.
- Adapter does not perform auth checks.
- Adapter does not perform role authorization.
- Adapter does not change chart contracts.
- Adapter does not write audit logs directly.
- Adapter does not change application or domain package APIs unless separately approved.

### Fallback

- Runtime construction errors are caught with `catch (error)`.
- Safe `errorKind` is captured when an exception is caught.
- Raw error messages are not logged.
- Stack traces are not logged.
- Runtime failure returns legacy analytics projection output.
- Incomplete runtime metadata returns legacy analytics projection output.
- Fallback output includes degraded diagnostics.

### Metadata Safety

- UI-facing metadata excludes tenant ID.
- UI-facing metadata excludes user ID.
- Fallback logs exclude tenant ID.
- Fallback logs exclude user ID.
- Fallback logs exclude raw error messages.
- Fallback logs exclude stack traces.
- Runtime event payload excludes raw payloads and secrets.

### Observability

- Runtime-enabled output exposes `correlationId`.
- Runtime-enabled output exposes `contextId`.
- Runtime-enabled output exposes `capabilityId`.
- Runtime-enabled output exposes `eventType`.
- Runtime-enabled output exposes diagnostics status.
- Logs use only safe normalized fields.
- Metrics, if added, are low cardinality.

### Rollback

- Setting `retiredAnalyticsRuntimeFlag` to OFF disables runtime behavior.
- No database rollback is required.
- No deployment topology rollback is required.
- No CI rollback is required.
- Existing legacy analytics resolver remains available.

---

## Required Tests For Future Implementation

Future implementation must include focused tests for:

- missing flag is OFF
- `false` is OFF
- `FALSE` is OFF
- `True` is OFF
- `1` is OFF
- `0` is OFF
- empty string is OFF
- exact `true` is ON
- flag OFF returns legacy analytics projection output
- flag ON returns runtime metadata
- runtime construction throw falls back to legacy analytics projection output
- incomplete runtime artifacts fallback to legacy analytics projection output
- fallback metadata is deterministic
- fallback warning includes safe `errorKind`
- fallback warning excludes tenant ID
- fallback warning excludes user ID
- fallback warning excludes raw error message
- fallback warning excludes stack trace
- UI-facing metadata excludes forbidden secret-like keys
- legacy projection semantics remain unchanged

Recommended test file:

```text
src/__tests__/services/analytics-runtime-adapter.test.ts
```

Existing regression test file:

```text
src/__tests__/services/analytics-projection-adapter.test.ts
```

---

## Required Validation For Future Implementation

Future implementation must run:

```bash
pnpm type-check
pnpm test
pnpm -r --filter './packages/*' test
pnpm docs:links
git diff --check
git diff --cached --check
```

---

## Planning Validation

This planning branch must run:

```bash
pnpm docs:links
pnpm docs:navigation
git diff --check
git diff --cached --check
git tag --points-at HEAD
```

---

## Claude Code Review Checklist

Claude Code Review must verify:

- [ ] Adapter imports runtime through `@nextshift/runtime`.
- [ ] Adapter does not import runtime package source through relative paths.
- [ ] Adapter has module-local feature flag helper.
- [ ] Feature flag defaults OFF and only exact `true` enables runtime.
- [ ] Flag OFF preserves legacy analytics output.
- [ ] Flag ON adds runtime metadata without changing projection semantics.
- [ ] Runtime errors are caught with `catch (error)`.
- [ ] Only safe `errorKind` is captured.
- [ ] Raw error messages are not logged.
- [ ] Stack traces are not logged.
- [ ] Tenant ID and user ID are excluded from UI metadata.
- [ ] Tenant ID and user ID are excluded from fallback warning logs.
- [ ] Adapter does not import Prisma.
- [ ] Adapter does not import Next.js request or response objects.
- [ ] Adapter does not perform auth or role checks.
- [ ] Tests cover flag lifecycle, runtime path, fallback path, safe metadata, and safe logging.
- [ ] No Prisma schema, env, deployment, CI, tag, or unrelated module changes are included.

---

## ChatGPT Architecture Review Checklist

ChatGPT Architecture Review must verify:

- [ ] Pilot follows `UI / Analytics Trigger -> Analytics Runtime Adapter -> Runtime -> Application -> Domain`.
- [ ] Pilot uses Runtime Adapter Standard v1.0 and Pilot 1 pattern.
- [ ] Pilot starts with analytics projection seam.
- [ ] Pilot does not rewrite the dashboard analytics service graph.
- [ ] Application and domain package boundaries remain stable.
- [ ] Runtime responsibility is limited to context, capability, event, diagnostics, correlation, and metadata safety.
- [ ] Adapter responsibility is limited to feature flag, legacy projection wrapping, runtime artifact creation, fallback, and metadata.
- [ ] Legacy analytics remains the source of truth.
- [ ] Rollback is possible by disabling the feature flag.
- [ ] Explicit out-of-scope items remain untouched.

---

## Explicit Rejection Criteria

Reject future implementation if it:

- changes Prisma schema
- modifies env files
- modifies deployment configuration
- changes CI
- creates a tag
- starts Pilot 3
- requires runtime path while the flag is OFF
- changes user-visible analytics behavior while the flag is OFF
- imports Prisma into the adapter
- imports Next.js request or response objects into the adapter
- makes runtime errors fatal to analytics rendering
- stores tenant ID or user ID in UI-facing metadata
- logs tenant ID, user ID, raw messages, stack traces, headers, cookies, tokens, API keys, credentials, or raw payloads
