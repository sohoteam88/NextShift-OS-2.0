# Runtime Feature Flag Standard

Version: 1.0

Status: Mandatory Standard

Last Updated: 2026-07-09

---

## Purpose

Define the required feature flag lifecycle for Runtime Capability Adapters.

---

## Default State

Every runtime adapter must be default OFF.

Only the exact string `true` enables the runtime path.

Examples treated as OFF:

- missing value
- empty string
- `false`
- `FALSE`
- `True`
- `1`
- `0`
- `yes`
- `on`

---

## Required Flag Name Pattern

Use:

```text
NEXT_PUBLIC_ENABLE_RUNTIME_<MODULE>
```

Examples:

- `retiredAnalyticsRuntimeFlag`
- `NEXT_PUBLIC_ENABLE_RUNTIME_CRM`
- `NEXT_PUBLIC_ENABLE_RUNTIME_DASHBOARD`
- `NEXT_PUBLIC_ENABLE_RUNTIME_BUSINESS_BRAIN`
- `NEXT_PUBLIC_ENABLE_RUNTIME_DECISION_BRAIN`

---

## Required Helper

Each adapter must isolate flag logic in a module-local helper:

```text
src/modules/<module>/runtime/runtime-<module>-flag.ts
```

Required behavior:

```ts
export function isRuntimeModuleEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.NEXT_PUBLIC_ENABLE_RUNTIME_MODULE === 'true';
}
```

The helper must accept injected env input for tests.

---

## Flag Lifecycle

1. Flag missing: runtime path disabled.
2. Flag present but not exact `true`: runtime path disabled.
3. Flag exact `true`: runtime path enabled.
4. Runtime path failure: fallback to legacy path.
5. Rollback: set flag OFF or remove it.

---

## Rules

- Do not edit env files during first-pass adapter implementation.
- Do not store secrets in public feature flags.
- Do not use feature flags to hide failing tests.
- Do not require runtime metadata when the flag is OFF.
- Do not alter legacy output when the flag is OFF.
- Add explicit falsy flag tests for every adapter.

---

## Required Tests

Every adapter must test:

- missing flag is OFF
- `false` is OFF
- `FALSE` is OFF
- `True` is OFF
- `1` is OFF
- `0` is OFF
- empty string is OFF
- exact `true` is ON

---

## Rollback Standard

Primary rollback:

```text
Set the adapter feature flag to OFF.
```

Rollback must not require:

- database migration rollback
- CI rollback
- deployment topology rollback
- runtime package rollback
