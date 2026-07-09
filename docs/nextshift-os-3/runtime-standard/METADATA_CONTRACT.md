# Runtime Metadata Contract

Version: 1.0

Status: Mandatory Standard

Last Updated: 2026-07-09

---

## Purpose

Define safe metadata boundaries for Runtime Capability Adapters.

---

## Metadata Boundaries

Runtime adapters must maintain two separate metadata surfaces:

1. Internal runtime context metadata.
2. UI-facing adapter metadata.

These surfaces must not be treated as interchangeable.

---

## Internal Runtime Metadata

Internal runtime metadata may include:

- module name
- source
- normalized route
- normalized intent or action
- normalized status
- known driver ID
- known tool ID
- tenant ID when required for runtime isolation
- user ID when required for runtime correlation

Tenant and user identifiers may exist only in internal runtime context metadata.

---

## UI-Facing Metadata

UI-facing adapter metadata may include:

- `enabled`
- `mode`
- `source`
- `fallback`
- `confidence`
- `contextId`
- `correlationId`
- `capabilityId`
- `capabilityRuntimeId`
- `eventId`
- `eventType`
- `diagnosticsId`
- `diagnosticsStatus`
- `warning`
- safe `errorKind`

UI-facing adapter metadata must not include:

- tenant ID
- user ID
- auth tokens
- API keys
- credentials
- passwords
- raw cookies
- raw request headers
- raw request payloads
- raw error messages
- stack traces
- full tenant objects
- full user objects

---

## Logging Boundary

Fallback warning logs must follow the UI-facing boundary, not the internal runtime boundary.

Tenant and user identifiers must not be logged by adapter fallback warnings.

---

## Event Payload Boundary

Runtime event payloads should include only deterministic, low-risk data:

- route
- normalized intent or action
- known status
- known driver ID
- known tool ID
- source

Runtime event payloads must not include:

- secrets
- credentials
- raw user input that is not normalized
- full request payloads
- tenant or user objects

---

## Forbidden Key Pattern

Adapters must avoid metadata keys matching:

```text
secret
password
token
api-key
api_key
credential
```

The runtime package also enforces forbidden secret-like metadata keys. Adapters must still sanitize before calling runtime primitives.

---

## Metadata Lifecycle

1. Adapter receives input.
2. Adapter normalizes safe fields.
3. Adapter builds internal runtime metadata.
4. Adapter creates runtime context and capability.
5. Adapter creates runtime event and diagnostics.
6. Adapter returns UI-facing metadata only.
7. Adapter logs only fallback-safe fields.

---

## Required Tests

Every adapter must test:

- UI-facing metadata excludes tenant and user identifiers.
- fallback logs exclude tenant and user identifiers.
- fallback logs exclude raw messages and stack traces.
- runtime metadata keys do not match forbidden secret-like patterns.
- runtime event payload excludes forbidden secret-like keys.
