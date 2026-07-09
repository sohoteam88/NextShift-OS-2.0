# Runtime Fallback Standard

Version: 1.0

Status: Mandatory Standard

Last Updated: 2026-07-09

---

## Purpose

Define mandatory fallback behavior for Runtime Capability Adapters.

Runtime failures must not break the user path.

---

## Fallback Principle

The legacy resolver or service remains the source of truth until runtime integration is proven.

Runtime adapters may add context, capability metadata, events, diagnostics, and observability. They must not make the user path depend on runtime success.

---

## Required Fallback Triggers

Adapters must fallback when:

- runtime context creation throws
- runtime capability creation throws
- runtime event creation throws
- runtime diagnostics creation throws
- runtime metadata is incomplete
- runtime output is invalid
- dependency injection provides failing runtime factories during tests

---

## Required Fallback Output

Fallback output must include:

```ts
runtime: {
  enabled: true,
  mode: 'legacy',
  fallback: true,
  diagnosticsStatus: 'degraded',
  warning: '<adapter-warning>'
}
```

When an exception was caught, fallback output may include safe `errorKind`.

Fallback output must not include:

- raw error message
- stack trace
- tenant ID
- user ID
- raw request payload
- raw headers
- raw cookies
- tokens
- API keys
- credentials

---

## Catch Standard

Do:

```ts
} catch (error) {
  const errorKind = classifyRuntimeAdapterError(error);
  warnRuntimeFallback(logger, input, resolution, 'runtime-adapter-fallback', errorKind);
  return legacyRuntimeFallback(resolution, source, confidence, 'runtime-adapter-fallback', errorKind);
}
```

Do not:

```ts
} catch {
  return legacyRuntimeFallback(...);
}
```

---

## Error Classification

Allowed:

- `error.constructor.name`
- `unknown`

Forbidden:

- `error.message`
- `error.stack`
- serialized error objects
- raw runtime payloads

---

## Fallback Logging

Fallback warnings may include:

- warning code
- safe `errorKind`
- normalized route or adapter operation
- normalized intent or action when low risk
- status
- source

Fallback warnings must not include:

- tenant ID
- user ID
- headers
- cookies
- tokens
- credentials
- API keys
- raw payloads
- raw error messages
- stack traces

---

## Required Tests

Every adapter must test:

- runtime construction throw falls back to legacy output
- incomplete runtime metadata falls back to legacy output
- fallback metadata is deterministic
- fallback warning excludes tenant and user identifiers
- fallback warning excludes raw error message and stack
- fallback warning includes safe `errorKind` for exceptions
