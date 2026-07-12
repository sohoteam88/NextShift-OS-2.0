# OS 3.3 Pilot 1 — Runtime Revenue Adapter Code Review Report

| Field          | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| Review Type    | Code Review (not release audit)                                    |
| Review Date    | 2026-07-09                                                         |
| Reviewer       | Claude Code (Audit Engineer)                                       |
| Repository     | sohoteam88/NextShift-OS-2.0                                        |
| PR             | #10 `feat(runtime): add revenue drivers runtime adapter`           |
| Base Branch    | `planning/os-3.3-runtime-platform`                                 |
| Head Branch    | `feature/os-3.3-runtime-revenue-adapter`                           |
| Additions      | 681                                                                |
| Deletions      | 2                                                                  |
| PR State       | DRAFT                                                              |
| Verdict        | **PASS WITH MINOR ISSUES**                                         |

---

## Files Reviewed

| File | Type | Lines |
| ---- | ---- | ------ |
| `src/modules/revenue-drivers/runtime/retired-revenue-flag-helper.ts` | New — flag isolation | 7 |
| `src/modules/revenue-drivers/runtime/RevenueRuntimeAdapter.ts` | New — adapter | 291 |
| `src/modules/revenue-drivers/runtime/index.ts` | New — barrel export | 2 |
| `src/modules/revenue-drivers/components/RevenueDriverIntentResolver.tsx` | Modified — component integration | +5 / -2 |
| `src/__tests__/services/revenue-runtime-adapter.test.ts` | New — unit tests | 226 |
| `docs/nextshift-os-3/runtime-pilot-1/IMPLEMENTATION_REPORT.md` | New — documentation | 149 |

---

## Blocking Issues

**None.**

---

## 1. Feature Flag Correctness

**PASS**

`retired-revenue-flag-helper.ts`:

```ts
export const retiredRevenueFlagConstant = 'retiredRevenueRuntimeFlag';

export function retiredRevenueFlagHelper(env: NodeJS.ProcessEnv = process.env) {
  return env[retiredRevenueFlagConstant] === 'true';
}
```

Strict `=== 'true'` comparison. Only the exact string `'true'` activates the runtime path. All of the following return `false`: `undefined`, `"false"`, `"FALSE"`, `"True"`, `"1"`, `"on"`, `"yes"`, empty string. Default is OFF. ✓

No `.env` file modified. ✓

The `env` parameter default `process.env` allows clean test injection without module mocking — correct design. ✓

---

## 2. Legacy Behavior Preservation

**PASS**

The adapter resolves legacy intent as its very first step, before inspecting the flag:

```ts
const resolution = resolveIntent({ route: input.route, intent: input.intent });
const confidence = confidenceForResolution(resolution);
const enabled = dependencies.isEnabled?.() ?? retiredRevenueFlagHelper();

if (!enabled) {
  return {
    resolution,
    runtime: { enabled: false, mode: 'legacy', source: input.source, fallback: false, confidence },
  };
}
```

When flag is OFF, the legacy resolver runs and returns the same `RevenueDriverIntentResolution` it always returned, wrapped only in the outer `resolution` field. The UI component extracts only `.resolution`:

```tsx
// Before
() => resolveRevenueDriverIntent({ route: currentRoute, intent })

// After
() => resolveRevenueRuntimeIntent({ route: currentRoute, intent, source: 'deep-link' }).resolution
```

The component receives the identical `RevenueDriverIntentResolution` type. `.runtime` is never referenced by the component. No UI output, resolver semantics, or user-facing behavior changes when flag is OFF. ✓

---

## 3. Runtime Fallback Behavior

**PASS**

Two explicit fallback triggers are handled:

**Construction failure:**

```ts
try {
  const artifacts = (...)(...)
  // ...
} catch {
  warnRuntimeFallback(dependencies.logger, input, resolution, 'runtime-adapter-fallback');
  return legacyRuntimeFallback(resolution, input.source, confidence, 'runtime-adapter-fallback');
}
```

- All runtime build exceptions are caught
- `resolution` was computed before the `try` block — guaranteed available in the catch
- `legacyRuntimeFallback()` is a pure object construction — no secondary throw possible ✓

**Incomplete metadata:**

```ts
if (!isRuntimeMetadataComplete(runtime)) {
  warnRuntimeFallback(..., 'runtime-adapter-invalid-output');
  return legacyRuntimeFallback(..., 'runtime-adapter-invalid-output');
}
```

- Guards all 8 required fields: `contextId`, `correlationId`, `capabilityId`, `capabilityRuntimeId`, `eventId`, `eventType`, `diagnosticsId`, `diagnosticsStatus`
- Empty string IDs from injected artifacts trigger this path (tested explicitly) ✓

Fallback metadata shape is fully deterministic:
```ts
{ enabled: true, mode: 'legacy', fallback: true, diagnosticsStatus: 'degraded', warning }
```
No partial or `undefined` fields. ✓

`warnRuntimeFallback` logs only: `warning`, `route`, `intent`, `status`, `source` — no tokens, passwords, credentials, API keys, cookies, raw headers, or user/tenant payloads. ✓

---

## 4. Layering and Coupling

**PASS**

Imports in `RevenueRuntimeAdapter.ts` are scoped to:
- `packages/runtime` — runtime primitives only
- `../constants/revenue-driver-intents` — existing revenue driver constants
- `./retired-revenue-flag-helper` — local flag helper

No Business Brain, Decision Brain, Dashboard Projection, Prisma, env file, CI, or deployment integration introduced. ✓

The UI component imports only `resolveRevenueRuntimeIntent` from the runtime barrel. No runtime types, no adapter internals, no metadata shape are referenced in the component. Coupling is contained to the function call boundary. ✓

Adapter shape: ~20 lines of core decision logic; remaining 270 lines are type definitions, pure helper functions, and the runtime artifact builder. Appropriately thin. ✓

---

## 5. Test Coverage

**PASS — 7 cases, all primary paths covered**

| Test Case | Coverage |
| --------- | -------- |
| Flag OFF — uses legacy path (`flag: undefined`) | ✓ |
| Flag ON — creates runtime metadata | ✓ |
| Invalid intent → `runtime.revenue.intent.invalid` event type, confidence 0 | ✓ |
| Fallback intent → `runtime.revenue.intent.fallback` event type, confidence 0.35 | ✓ |
| Runtime construction throws → fallback to legacy, `warning: 'runtime-adapter-fallback'` | ✓ |
| Incomplete runtime artifacts → fallback to legacy, `warning: 'runtime-adapter-invalid-output'` | ✓ |
| Safe metadata keys — no forbidden key names in `output.runtime` | ✓ |

Test implementation uses dependency injection (`RevenueRuntimeAdapterDependencies`) instead of module mocking — makes tests deterministic and avoids `vi.mock` fragility. ✓

---

## Non-Blocking Issues

### A-001 — Relative import path bypasses package boundary

**Area:** Layering / Architecture
**Severity:** Non-blocking advisory

```ts
import { ... } from '../../../../packages/runtime/src/index';
```

This reaches 4 directories up to import directly from runtime package source rather than through the workspace package name. If future adapters copy this pattern, the codebase accumulates fragile path-relative imports. Recommend adding `@nextshift/runtime` as a workspace package reference so adapters can import `from '@nextshift/runtime'` consistently. Should be resolved before the pattern is copied to a second adapter.

---

### A-002 — Flag-OFF test covers only `undefined`; explicit falsy string values untested

**Area:** Tests
**Severity:** Non-blocking advisory

The flag-OFF test uses `setRuntimeRevenueFlag(undefined)`. The following common misconfiguration values are not explicitly tested: `"false"`, `"FALSE"`, `"True"`, `"1"`, `"0"`. The strict `=== 'true'` comparison already handles them correctly, but a parametrized test would protect against a future maintainer relaxing the comparison.

Suggested addition:

```ts
it('treats non-true string values as flag OFF', () => {
  for (const value of ['false', 'FALSE', '1', 'True', '0', '']) {
    setRuntimeRevenueFlag(value);
    const output = resolveRevenueRuntimeIntent({
      route: '/content-engine',
      intent: 'facebook-post',
      source: 'deep-link',
    });
    expect(output.runtime.enabled).toBe(false);
    expect(output.runtime.mode).toBe('legacy');
  }
});
```

---

### A-003 — `catch {}` discards all error detail

**Area:** Fallback / Observability
**Severity:** Non-blocking advisory

```ts
} catch {
  warnRuntimeFallback(...);
  return legacyRuntimeFallback(...);
}
```

The empty catch silences the original error entirely — no message, class name, or stack trace reaches the log. This is correct for production safety but makes runtime failures difficult to diagnose in development or staging. Consider capturing the error class name only, which adds no sensitive data:

```ts
} catch (err) {
  warnRuntimeFallback(dependencies.logger, input, resolution, 'runtime-adapter-fallback', {
    errorKind: err instanceof Error ? err.constructor.name : 'unknown',
  });
```

---

### A-004 — `tenantId` / `userId` flow into runtime context metadata

**Area:** Security / Documentation
**Severity:** Non-blocking advisory

`safeRuntimeMetadata()` includes `tenantId` and `userId` when present:

```ts
if (input.tenantId) metadata.tenantId = input.tenantId;
if (input.userId) metadata.userId = input.userId;
```

This metadata is passed to `RuntimeContext`, `RuntimeCapability`, and `RuntimeDiagnostics` internally. Neither field appears in the returned `RevenueRuntimeMetadata` type or the logged warning payload — they are correctly excluded from both surfaces. However, whether `packages/runtime` itself logs `context.metadata` is outside this PR's scope. Recommend documenting in the pilot notes that runtime `metadata` may carry tenant context and verifying `packages/runtime` does not log it unguarded before propagating this pattern to subsequent adapters.

---

## 6. Security and Tenant Safety

**PASS**

| Security Check | Result |
| -------------- | ------ |
| `tenantId` absent from returned `RevenueRuntimeMetadata` | ✓ |
| `userId` absent from returned `RevenueRuntimeMetadata` | ✓ |
| `tenantId` / `userId` absent from `warnRuntimeFallback` log payload | ✓ |
| `safeRuntimeMetadata()` contains no tokens, secrets, credentials, or headers | ✓ |
| `eventPayload()` contains no tenant or user identifiers | ✓ |
| Metadata key test guards against `secret`, `password`, `token`, `api[-_]?key`, `credential` names | ✓ |
| No raw error message logged in fallback | ✓ |

See A-004 for advisory on `tenantId`/`userId` in internal runtime context metadata.

---

## 7. Runtime Architecture Fit

**PASS — suitable precedent for future Runtime Capability Adapters**

Three-file layout is clean and replicable:

```
retired-revenue-flag-helper.ts       flag isolation (1 exported function, injected env)
RevenueRuntimeAdapter.ts      adapter logic (DI via AdapterDependencies, pure helpers)
index.ts                      barrel export
```

Patterns worth establishing as the standard for subsequent adapters:

| Pattern | Value |
| ------- | ----- |
| `XxxAdapterDependencies` with `isEnabled`, `createRuntimeArtifacts`, `logger` | Unit tests without module mocking |
| `safeRuntimeMetadata()` as a named function | Makes safe/unsafe boundary explicit |
| `isRuntimeMetadataComplete()` guard | Completeness enforcement before returning runtime output |
| `legacyRuntimeFallback()` helper | Deterministic fallback shape |
| `warnRuntimeFallback()` helper | Safe, normalized log pattern |
| `confidenceForResolution()` / `eventTypeForResolution()` | Pure, named, independently testable |

**Architecture debt introduced by this pilot:**

1. Relative import path (A-001) — must be resolved before second adapter.
2. `catch {}` without error classification (A-003) — guidance needed for subsequent adapters.
3. `tenantId`/`userId` in runtime context metadata (A-004) — pattern needs documented safety contract.

---

## Merge Recommendation

**Safe to merge.** No blocking findings.

The adapter correctly gates runtime behavior behind a strict flag, preserves full legacy behavior and types when flag is OFF, handles both failure modes (construction throw + incomplete metadata) safely without secondary errors, logs no sensitive data, and introduces no prohibited dependencies. The dependency injection pattern (`RevenueRuntimeAdapterDependencies`) produces a clean, mock-free test suite that is straightforward to extend.

**Before implementing the second Runtime Capability Adapter:** resolve A-001 (package alias for `@nextshift/runtime`), document the `metadata` tenant-context contract (A-004), and establish whether A-003 (error class capture) should be included in the standard adapter template.
