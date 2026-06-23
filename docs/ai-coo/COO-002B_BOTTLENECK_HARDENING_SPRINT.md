# COO-002B Bottleneck Hardening Sprint

Version: V8
Status: P0
Owner: AI COO System
Sprint Type: Architecture Hardening

## Depends On

- COO-002 Bottleneck Engine PRD
- COO-002A Bottleneck Signal Matrix
- COO-002 Bottleneck Engine Audit 2026-06-22

## Objective

Increase Bottleneck Engine accuracy, auditability, and trustworthiness before introducing the Priority Engine.

This sprint focuses on:

- Evidence integrity
- Signal accuracy
- Single Bottleneck Authority
- Test coverage
- Projection security

## Workstreams

### 1. Evidence Integrity Hardening

Every evidence item must be generated from live signal values. Evidence must prove the selected bottleneck and must not contain hardcoded false values.

### 2. Revenue Signal Integration

Connect live revenue and retention signals:

- `revenue`
- `repeatPurchaseCount`
- `retentionRate`
- `averageOrderValue`
- `customerLifetimeValue`

`NO_TEAM` must evaluate from real revenue. `NO_RETENTION` must evaluate from real retention metrics.

### 3. Projection Security

Dashboard payload may receive:

- `bottleneck`
- `severity`
- `explainability`
- `mission`

Dashboard payload must not receive:

- `evidence`
- `confidence`
- signal tables
- candidate rankings

### 4. Test Coverage Expansion

All 13 matrix bottlenecks must have dedicated tests validating:

- bottleneck
- severity
- confidence
- evidence
- explainability

### 5. Single Bottleneck Authority

Only Bottleneck Engine may determine bottlenecks. `BottleneckAuthority` may remain only as a thin stage/business-state adapter.

### 6. Signal Accuracy Audit

Validate each signal rule, severity, evidence, explainability, and mission mapping against COO-002A.

### 7. NO_SYSTEM Standardization

Every signal failure path must produce:

- `bottleneck = NO_SYSTEM`
- `severity = High`
- `confidence = 80`
- `explainability = Business signals unavailable.`
- `evidence = Business signals unavailable.`

## Out Of Scope

Do not build:

- Priority Engine
- Autonomous Execution
- Forecasting Engine
- Team Scaling Engine
- Predictive Analytics
- Multi-Bottleneck Resolution

## Exit Criteria

- All audit Must Fix items resolved.
- All 13 bottlenecks tested.
- Revenue and retention signals live.
- Single Bottleneck Authority established.
- Dashboard no longer receives internal evidence.
- Classification: READY FOR COO-003 Priority Engine.
