# Business Profile API Specification

Version: 1.0

Status: Draft

Capability ID: CAP-001

Capability Name: Business Profile

## Purpose

This document defines the public API specification for the Business Profile capability.

The API exposes the application use cases defined in [Business Profile Application Specification](BUSINESS_PROFILE_APPLICATION_SPEC.md).

The API must not introduce new business behavior.

## API Design Principles

Business behavior belongs to the Application Layer.

The API exposes application behavior.

The API does not contain business logic.

## Base Path

```text
/api/v1/business-profile
```

## Authentication

All endpoints require:

- Authenticated user
- Tenant context
- Workspace context, if applicable

Authorization is handled before invoking the Application Layer.

## API Endpoints

### Create Business Profile

Method:

`POST`

Endpoint:

```text
/api/v1/business-profile
```

Application Use Case:

`CreateBusinessProfileUseCase`

Purpose:

Create the initial Business Profile.

Request:

```json
{
  "identity": {},
  "brand": {},
  "offer": {},
  "customer": {},
  "goals": {}
}
```

Response:

```json
{
  "businessId": "...",
  "status": "created"
}
```

Published Event:

`BusinessProfileCreated`

### Get Business Profile

Method:

`GET`

Endpoint:

```text
/api/v1/business-profile
```

Application Use Case:

`GetBusinessProfileUseCase`

Purpose:

Retrieve the current Business Profile.

Response:

```json
{
  "profile": {}
}
```

### Update Business Profile

Method:

`PATCH`

Endpoint:

```text
/api/v1/business-profile
```

Application Use Case:

`UpdateBusinessProfileUseCase`

Purpose:

Update one or more profile sections.

Response:

```json
{
  "status": "updated"
}
```

Published Event:

`BusinessProfileUpdated`

### Review Business Identity

Method:

`POST`

Endpoint:

```text
/api/v1/business-profile/review
```

Application Use Case:

`ReviewBusinessIdentityUseCase`

Purpose:

Generate the AI's current understanding of the business.

Response:

```json
{
  "summary": "...",
  "confidence": 0.92
}
```

### Complete Business Profile

Method:

`POST`

Endpoint:

```text
/api/v1/business-profile/complete
```

Application Use Case:

`CompleteBusinessProfileUseCase`

Purpose:

Request AI guidance for completing missing profile information.

Response:

```json
{
  "missingSections": [],
  "nextQuestions": []
}
```

Published Event:

`BusinessProfileCompletenessChanged`

## Error Responses

Errors should use canonical runtime error types.

Example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Business name is required."
  }
}
```

The API must not invent custom error formats.

## Idempotency

`POST` requests creating resources should support idempotency where appropriate.

`PATCH` requests should be idempotent for identical payloads.

## Versioning

Current version:

```text
v1
```

Future breaking changes should create:

```text
/api/v2/business-profile
```

The API version must remain independent of runtime package versions.

## Events

Successful API operations publish events through the Event Bus.

The API never publishes events directly.

Application Layer coordinates event publication.

## Runtime Mapping

```text
HTTP Request
  -> API Controller
  -> Application Use Case
  -> Business Brain
  -> Business Twin
  -> Event Bus
  -> Learning System
```

The API must never bypass the Application Layer.

## Security

Validate:

- Authentication
- Authorization
- Tenant ownership
- Input validation

before invoking application logic.

## Observability

Every request should include:

- `CorrelationId`
- `RequestId`
- `TenantId`
- `BusinessId`, when available

These values should propagate through the runtime.

## Out Of Scope

This document does not define:

- HTTP framework
- Controller implementation
- Database persistence
- UI behavior
- SDK generation

These belong to implementation.

## Success Criteria

The API succeeds when:

- Every endpoint maps to exactly one application use case.
- No business behavior exists outside the Application Layer.
- Events remain application-driven.
- Business Brain remains the owner of business understanding.

## Guiding Principle

The API is the public interface.

The Application Layer owns business behavior.

The Business Brain owns business understanding.
