# Implementation Cycle 001 - Shared Package

Build: `packages/shared`

## Goal

Create the shared engineering kernel used by all future packages.

Do not implement business logic.

## Create Files

```text
packages/shared/
  README.md
  package.json
  tsconfig.json
  src/
    index.ts
    ids/
      index.ts
    time/
      index.ts
    result/
      index.ts
    errors/
      index.ts
    metadata/
      index.ts
    context/
      index.ts
    pagination/
      index.ts
```

## package.json

```json
{
  "name": "@nextshift/shared",
  "version": "0.1.0-alpha",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint src --ext .ts",
    "test": "echo \"No tests yet\""
  }
}
```

## tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "composite": true
  },
  "include": ["src"]
}
```

## src/index.ts

```ts
export * from "./ids";
export * from "./time";
export * from "./result";
export * from "./errors";
export * from "./metadata";
export * from "./context";
export * from "./pagination";
```

## src/ids/index.ts

```ts
export type Brand<T, BrandName extends string> = T & {
  readonly __brand: BrandName;
};

export type BusinessId = Brand<string, "BusinessId">;
export type UserId = Brand<string, "UserId">;
export type TenantId = Brand<string, "TenantId">;
export type WorkspaceId = Brand<string, "WorkspaceId">;
export type OrganizationId = Brand<string, "OrganizationId">;
export type StoryId = Brand<string, "StoryId">;
export type EventId = Brand<string, "EventId">;
export type DecisionId = Brand<string, "DecisionId">;
export type RecommendationId = Brand<string, "RecommendationId">;
export type AgentId = Brand<string, "AgentId">;
export type CorrelationId = Brand<string, "CorrelationId">;
export type CausationId = Brand<string, "CausationId">;
```

## src/time/index.ts

```ts
export type Timestamp = string;

export interface DateRange {
  readonly start: Timestamp;
  readonly end: Timestamp;
}

export interface Duration {
  readonly milliseconds: number;
}
```

## src/result/index.ts

```ts
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Failure<E> {
  readonly ok: false;
  readonly error: E;
}

export function success<T>(value: T): Success<T> {
  return { ok: true, value };
}

export function failure<E>(error: E): Failure<E> {
  return { ok: false, error };
}
```

## src/errors/index.ts

```ts
export type ErrorCode = string;

export interface NextShiftError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly cause?: unknown;
}

export interface ValidationError extends NextShiftError {
  readonly kind: "ValidationError";
}

export interface DomainError extends NextShiftError {
  readonly kind: "DomainError";
}

export interface InfrastructureError extends NextShiftError {
  readonly kind: "InfrastructureError";
}

export interface AuthorizationError extends NextShiftError {
  readonly kind: "AuthorizationError";
}

export interface ConfigurationError extends NextShiftError {
  readonly kind: "ConfigurationError";
}
```

## src/metadata/index.ts

```ts
import type { CausationId, CorrelationId } from "../ids";
import type { Timestamp } from "../time";

export interface AuditMetadata {
  readonly createdAt: Timestamp;
  readonly updatedAt?: Timestamp;
  readonly version?: number;
}

export interface SourceMetadata {
  readonly source: string;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}
```

## src/context/index.ts

```ts
import type { OrganizationId, TenantId, UserId, WorkspaceId } from "../ids";

export interface TenantContext {
  readonly tenantId: TenantId;
  readonly workspaceId?: WorkspaceId;
  readonly organizationId?: OrganizationId;
}

export interface ActorContext {
  readonly userId?: UserId;
  readonly actorType: "user" | "agent" | "system";
}
```

## src/pagination/index.ts

```ts
export interface PaginationInput {
  readonly limit: number;
  readonly cursor?: string;
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly nextCursor?: string;
}
```

## README.md

```md
# @nextshift/shared

Shared engineering kernel for NextShift OS.

This package contains shared primitive types, branded identifiers, result types, errors, metadata, context, and pagination utilities.

## Rules

- This package must remain business-agnostic.
- This package must not depend on business packages.
- Business packages may depend on this package.
- Do not implement business logic here.
```

## Acceptance Criteria

- Package exists at `packages/shared`.
- No business logic is implemented.
- Shared branded identifiers are defined.
- Result type exists.
- Error primitives exist.
- Metadata, context, and pagination types exist.
- Package exports from `src/index.ts`.
- TypeScript compiles.
