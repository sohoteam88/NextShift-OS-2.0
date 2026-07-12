# OS 3.3 Runtime Pilot 1 Data Flow

Version: 1.0

Status: Planning Complete

Last Updated: 2026-07-09

Branch: `planning/os-3.3-runtime-pilot-1`

---

## Current Data Flow

```text
Revenue Driver Hub
  |
  | reads REVENUE_DRIVERS
  v
Driver cards and action links
  |
  | user clicks href with ?intent=
  v
Revenue Driver Intent Resolver UI
  |
  | calls resolveRevenueDriverIntent(route, intent)
  v
Revenue Driver Intent Resolution
  |
  | optional audit fetch
  v
/api/v1/revenue-drivers/intent
  |
  | requireAuthApi + zod validation
  v
Prisma auditLog.create
```

Current resolver outputs:

- `resolved`
- `invalid`
- `fallback`

Current resolved output includes:

- `driverId`
- `route`
- `intent`
- `toolId`
- `titleKey`
- `descriptionKey`
- `focusTargetId`
- `state`

---

## Target Runtime Data Flow

```text
Revenue Driver Hub or Intent Resolver UI
  |
  | route + intent + source
  v
Revenue Runtime Adapter
  |
  | feature flag check
  +--------------------------+
  |                          |
  | OFF                      | ON
  v                          v
Legacy Resolver              Runtime Context
  |                          |
  v                          v
Legacy Resolution            Runtime Capability
                             |
                             v
                         Legacy Resolver
                             |
                             v
                         Runtime Event
                             |
                             v
                         Diagnostics
                             |
                             v
                         Runtime Resolution Output
```

The user-visible resolution must remain equivalent in both branches.

---

## Runtime-Enabled Sequence

1. UI passes `route`, `intent`, and `source` to the adapter.
2. Adapter checks `retiredRevenueRuntimeFlag`.
3. Adapter creates a capability-scoped runtime context.
4. Adapter creates a revenue capability identity.
5. Adapter calls the existing `resolveRevenueDriverIntent` function.
6. Adapter maps the result to a runtime event type.
7. Adapter creates diagnostics for success, invalid, fallback, or degraded outcome.
8. Adapter returns existing resolution plus runtime metadata.
9. UI continues rendering the same translation keys and focus target behavior.
10. Existing audit route remains optional and non-blocking.

---

## Flag OFF Data Contract

Input:

```json
{
  "route": "/content-engine",
  "intent": "facebook-post",
  "source": "deep-link"
}
```

Output requirement:

```json
{
  "resolution": {
    "status": "resolved",
    "driverId": "content",
    "route": "/content-engine",
    "intent": "facebook-post",
    "toolId": "content.facebook-post"
  },
  "runtime": {
    "enabled": false
  }
}
```

The exact output may include existing fields, but it must not require runtime IDs when disabled.

---

## Flag ON Data Contract

Input:

```json
{
  "route": "/content-engine",
  "intent": "facebook-post",
  "source": "deep-link"
}
```

Output requirement:

```json
{
  "resolution": {
    "status": "resolved",
    "driverId": "content",
    "route": "/content-engine",
    "intent": "facebook-post",
    "toolId": "content.facebook-post"
  },
  "runtime": {
    "enabled": true,
    "contextId": "runtime-context-id",
    "correlationId": "runtime-correlation-id",
    "capabilityId": "revenue.driver.intent.resolve",
    "eventType": "runtime.revenue.intent.resolved",
    "diagnosticsStatus": "healthy"
  }
}
```

The exact generated IDs will vary. Tests should assert shape and invariants, not hard-coded generated IDs.

---

## Invalid Intent Flow

Input:

```json
{
  "route": "/webinar-center",
  "intent": "invalid-intent",
  "source": "deep-link"
}
```

Expected resolution status:

```text
invalid
```

Expected runtime event:

```text
runtime.revenue.intent.invalid
```

Expected user behavior:

- Show existing invalid-intent UI copy.
- Do not throw.
- Do not navigate away.
- Audit remains non-blocking.

---

## Missing Intent Flow

Input:

```json
{
  "route": "/webinar-center",
  "intent": null,
  "source": "hub"
}
```

Expected resolution status:

```text
fallback
```

Expected runtime event:

```text
runtime.revenue.intent.fallback
```

Expected user behavior:

- If there is no intent, current UI may render nothing.
- Runtime adapter must not force the banner to appear.
- No user-visible behavior change when the flag is OFF.

---

## Degraded Runtime Flow

When runtime object creation fails:

```text
Adapter catches runtime error
  |
  v
Calls or returns legacy resolver output
  |
  v
Returns runtime.enabled true with diagnosticsStatus degraded
  |
  v
UI remains functional
```

Degraded flow must be testable by injecting or mocking a failing runtime factory.

---

## Data Safety

Allowed runtime metadata:

- normalized route
- normalized intent
- status
- known driver ID
- known tool ID
- source
- module name

Forbidden runtime metadata:

- auth token
- session token
- password
- API key
- credential
- raw cookie
- raw request header
- full tenant object
- full user object

Runtime primitives already reject secret-like metadata keys. The adapter must avoid such keys before calling runtime constructors.

---

## Audit Data Flow

The existing audit route stays outside the runtime adapter core.

Future behavior:

- UI may continue sending audit fetch exactly as it does today.
- Adapter may expose runtime correlation ID for future audit enrichment only if a later implementation explicitly scopes it.
- Pilot 1 must not require Prisma changes.

---

## Observability Data Flow

Runtime-enabled adapter output should create a traceable chain:

```text
correlationId
  |
  +-- contextId
  +-- capabilityId
  +-- eventType
  +-- diagnosticsStatus
```

This chain should be available in tests and safe logs.
