# D1 Logging Redaction Policy

Date: 2026-06-19
Status: READY FOR D2
Scope: Redaction and data minimization rules for logs, audit trail, telemetry, analytics, and error tracking.

## Policy

Production logs must be useful for debugging and operations without storing secrets, credentials, sensitive user content, or unnecessary personal data.

Default rule: if a value is not required to answer an operational question, do not log it.

## Never Log

The following must never be written to application logs, analytics events, audit metadata, runtime telemetry, or error properties:

- API keys.
- Access tokens.
- Refresh tokens.
- Session cookies.
- Passwords.
- Supabase service-role keys.
- Database URLs with credentials.
- OAuth authorization codes.
- Invite tokens or password reset tokens.
- Full prompts.
- Full conversations.
- Full interview transcripts.
- Full generated content bodies.
- Payment card data.
- Private customer notes.
- Raw request bodies from authenticated routes.
- Raw response bodies from AI providers.

## Sensitive Fields

Any field whose key matches these patterns must be redacted before leaving the process:

```text
password
token
secret
apiKey
api_key
authorization
cookie
session
refresh
access
service_role
database_url
direct_url
prompt
conversation
transcript
privateNote
card
payment
```

Recommended replacement value:

```text
[REDACTED]
```

For URLs that may include credentials, keep only the protocol, host, and database/provider label. Do not keep username, password, or query secrets.

## Allowed Identifiers

These identifiers may be logged when required for debugging:

- `userId`
- `tenantId`
- `actorId`
- `targetUserId`
- `planId`
- `assignmentId`
- `executionId`
- `interviewId`
- `correlationId`

Do not log email addresses in analytics or runtime telemetry unless needed for an admin audit display. Audit trail may store actor email when it is already part of the platform admin audit record.

## Content Logging Rules

| Content Type | Logging Rule |
| --- | --- |
| Interview answer | Do not log full answer. Use answer count, slot name, completion status, or hashed fingerprint if needed. |
| Brand profile | Log changed field names only unless values are explicitly non-sensitive controlled enums. |
| Prompt | Never log full prompt. Use prompt template ID, version, provider, model, and token count. |
| Generated content | Do not log full content. Use content type, platform, length, quality score, and generation ID. |
| Runtime result | Log result status, duration, and artifact ID. Do not log full result body. |
| Error stack | Send to error tracker only. Do not store stack in analytics properties. |

## Audit Metadata Rules

Audit records may include enough structured metadata to explain an action:

Allowed:

- `fromRole`
- `toRole`
- `targetType`
- `targetId`
- `changeType`
- `reasonCode`
- `affectedFieldNames`
- `requestPath`

Not allowed:

- Raw form payload.
- Raw admin notes.
- Tokens.
- Passwords.
- Full user-generated content.
- Secrets copied from environment variables.

## Redaction Process

All server-side event emitters must pass properties through a redaction function before writing to any sink.

Required behavior:

1. Recursively redact object keys matching sensitive patterns.
2. Redact nested values in arrays and objects.
3. Truncate long string values that are not on an allowlist.
4. Drop raw request/response bodies by default.
5. Preserve IDs, enums, counts, durations, booleans, and safe status codes.

Recommended maximum string length for log properties: 500 characters.

## Error Tracking Rules

Error tracker payloads may include stack traces and release metadata, but must still redact:

- Request headers containing credentials.
- Cookies.
- Authorization headers.
- Raw request body.
- Provider API responses with prompt or content.
- Environment variables.

Error fingerprints should use:

- `module`
- `errorCode`
- `requestPath`
- `provider` when applicable
- `operation`

## Client-Side Telemetry Rules

Client telemetry must be treated as public-adjacent and lower trust:

- Do not send secrets or private content from the browser.
- Do not capture page bodies automatically.
- Keep autocapture disabled unless a separate privacy review approves it.
- Prefer explicit event capture with cataloged event names.
- Do not send local storage, cookies, or auth headers.

The current `src/lib/telemetry/tracker.ts` already disables PostHog autocapture and pageview capture. D2 should preserve that posture.

## Verification Checklist

Before a new event is added:

- Event name exists in `audit/event-catalog.md` or a catalog update is included.
- Owner module is defined in `audit/logging-architecture.md`.
- Properties contain no secrets or full user content.
- Properties pass through the redaction function.
- Cross-module flows include `correlationId`.
- Audit-worthy actions are written to audit trail, not only analytics.
- Failure events include stable `errorCode`.

## D2 Requirements

D2 must include tests that prove:

- Sensitive keys are redacted recursively.
- Safe IDs and counters survive redaction.
- Long non-allowlisted strings are truncated.
- Runtime telemetry rejects or redacts prompt/conversation fields.
- Error events do not expose request bodies or authorization headers.

## Final Decision

READY FOR D2
