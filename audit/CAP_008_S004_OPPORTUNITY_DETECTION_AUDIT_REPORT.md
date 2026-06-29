# CAP-008 S-004 Audit Report — Opportunity Detection

**Audit Type:** Implementation Slice Audit  
**Auditor:** Claude Code (Independent Architecture Auditor)  
**Date:** 2026-06-29  
**Capability:** CAP-008 Business Brain  
**Slice:** S-004 Opportunity Detection  
**Prerequisites:** CAP-008 S-001–S-003 (PASS)  
**Engineering Baseline:** Blueprint v1.0 · Core Runtime v1.0 · Engineering Playbook v1.1

---

## Overall Result

**PASS**

S-004 delivers `DetectedOpportunity` (frozen plain interface), `OpportunityDetectionResult` (calculated model), `createOpportunityConfidence` (three-step validator, 0–1 range), `deriveOpportunityPriority` (four-band derivation from confidence), `createOpportunitySource` (validated source with allowlist check), the `OpportunityDetector` contract, and `DefaultOpportunityDetector` — a deterministic baseline that converts existing opportunities, derives insight-driven opportunities, and generates risk-mitigation opportunities using fixed confidence scores and deterministic concatenated IDs. The `opportunities` getter on `OpportunityDetectionResult` returns a defensive clone without requiring a full `toSnapshot()` call. `detect()` takes a `BusinessBrainSnapshot` (not the live aggregate) and is non-mutating. 0 typecheck errors, 29 files / 266 domain tests. No findings.

---

## Findings

### Critical

None.

### Major

None.

### Minor

None.

---

## Domain Model Audit

### `DetectedOpportunity` — Frozen Plain Interface

`DetectedOpportunity` is a plain `interface` (not a class) constructed by the exported `createDetectedOpportunity()` factory. The factory validates all fields and returns `Object.freeze({...})` with the nested `source` also frozen via `createOpportunitySource()`. Priority is derived from the validated confidence and stored in the frozen object — never externally supplied.

```ts
export function createDetectedOpportunity(input: CreateDetectedOpportunityInput): DetectedOpportunity {
  const confidence = createOpportunityConfidence(input.confidence);
  return Object.freeze({
    id:       createRequiredString(input.id, "DetectedOpportunity id") as DetectedOpportunityId,
    title:    createRequiredString(input.title, "DetectedOpportunity title"),
    summary:  createRequiredString(input.summary, "DetectedOpportunity summary"),
    priority: deriveOpportunityPriority(confidence),   // derived, not supplied
    confidence,
    source:   createOpportunitySource(input.source),
    detectedAt: createTimestamp(input.detectedAt, "detectedAt"),
  });
}
```

✅

### `OpportunityDetectionResult` — Calculated Model

```ts
export class OpportunityDetectionResult {
  private constructor(private readonly snapshot: OpportunityDetectionResultSnapshot) {}

  static create(input: CreateOpportunityDetectionResultInput): OpportunityDetectionResult

  get opportunities(): readonly DetectedOpportunity[]   // returns clone
  toSnapshot(): OpportunityDetectionResultSnapshot       // returns clone
}
```

`static create()` re-validates every supplied opportunity via `createDetectedOpportunities()` → `createDetectedOpportunity()`. The `opportunities` getter returns a defensive clone directly — callers need not call `toSnapshot()` to inspect individual items. Both `toSnapshot()` and `opportunities` deep-clone with nested source freeze. ✅

**Domain Model Audit Verdict: PASS**

---

## Validation Audit

### `createOpportunityConfidence()` — Three-Step, 0–1 Range

```ts
export function createOpportunityConfidence(value: number): number {
  if (typeof value !== "number" || Number.isNaN(value))  throw new Error("Opportunity confidence must be numeric.");
  if (!Number.isFinite(value))                           throw new Error("Opportunity confidence must be finite.");
  if (value < 0 || value > 1)                           throw new Error("Opportunity confidence must be between 0 and 1.");
  return value;
}
```

Same three-step pattern as S-003's `createHealthScore()`, but 0–1 range (not 0–100). Three distinct error messages. Exported; used internally by `createDetectedOpportunity()` and `deriveOpportunityPriority()`. ✅

### `deriveOpportunityPriority()` — Four-Band Priority

```ts
export function deriveOpportunityPriority(confidence: number): OpportunityPriority {
  const validatedConfidence = createOpportunityConfidence(confidence);
  if (validatedConfidence < 0.4)  return "low";
  if (validatedConfidence < 0.7)  return "medium";
  if (validatedConfidence < 0.9)  return "high";
  return "critical";
}
```

| Confidence Range | Priority |
|---|---|
| [0.0, 0.4) | `"low"` |
| [0.4, 0.7) | `"medium"` |
| [0.7, 0.9) | `"high"` |
| [0.9, 1.0] | `"critical"` |

Re-validates confidence internally. Test #3 asserts all 8 boundary cases. ✅

### `createOpportunitySource()` — Allowlist + Field Validation

```ts
export function createOpportunitySource(source: OpportunitySource): OpportunitySource {
  if (!isOpportunitySourceType(source.type)) throw new Error(`Unsupported opportunity source type: ${source.type}.`);
  return Object.freeze({
    type: source.type,
    referenceId: createRequiredString(source.referenceId, "Opportunity source referenceId"),
    summary:     createRequiredString(source.summary, "Opportunity source summary"),
  });
}
```

`OpportunitySourceType`: `"observation" | "insight" | "risk" | "health" | "manual" | "system"` — 6 values. Validated via `isOpportunitySourceType()` type guard using `Array.includes()`. Returns frozen object. ✅

**Validation Audit Verdict: PASS**

---

## Domain Service Audit

### `OpportunityDetector` — Contract

```ts
export interface OpportunityDetector {
  detect(snapshot: BusinessBrainSnapshot): OpportunityDetectionResult;
}
```

Synchronous. Takes `BusinessBrainSnapshot` — reads from a snapshot, never touches the live aggregate. Returns `OpportunityDetectionResult`. ✅

### `DefaultOpportunityDetector` — Deterministic Baseline

**Detection logic:**

1. **No signals** (all four collections empty) → return empty result with standard empty message.
2. **Existing opportunities** → convert each using `confidence: 0.8` → `priority: "high"`. Source type: `"manual"`. ID: `"detected-opportunity:manual:{opportunity.id}"`.
3. **Insight-derived** (only if `insights.length > 0` AND `opportunities.length === 0`) → convert last insight using `confidence: 0.65` → `priority: "medium"`. Source type: `"insight"`. ID: `"detected-opportunity:insight:{insight.id}"`.
4. **Risk-mitigation** (only if `risks.length > opportunities.length`) → convert last risk using `confidence: 0.7` → `priority: "high"` (0.7 is in [0.7, 0.9)). Source type: `"risk"`. ID: `"detected-opportunity:risk:{risk.id}"`.

`detectedAt = snapshot.updatedAt`. Does not call any mutation method on the aggregate. ✅

**Deterministic IDs:** `"detected-opportunity:${sourceType}:${referenceId}"` — no random generation, results are repeatable across multiple calls with the same snapshot. ✅

**Fixed confidence scores used by the detector:**

| Signal source | Confidence | Priority |
|---|---|---|
| Existing opportunity | 0.8 | `"high"` |
| Insight-derived | 0.65 | `"medium"` |
| Risk-mitigation | 0.7 | `"high"` |

**Domain Service Audit Verdict: PASS**

---

## Barrel Audit

### `packages/domain/src/business-brain/index.ts` (lines 4–5)

```ts
export * from "./opportunity-detection";
export * from "./opportunity-detector";
```

Both new files added to the slice barrel. All S-002/S-003 exports preserved. Test #6 (`DefaultOpportunityDetector` suite) imports from `"../src"` root barrel and verifies reference equality. ✅

**Barrel Audit Verdict: PASS**

---

## Testing Audit

**`test/opportunity-detection.test.ts`** — two `describe` blocks (11 tests total)

### `Opportunity detection model` (5 tests)

| # | Test | Key Coverage | Result |
|---|---|---|---|
| 1 | Creates detected opportunities with derived priority | Full object equality; `isFrozen(opportunity)`, `isFrozen(opportunity.source)` | ✅ |
| 2 | Validates confidence | `NaN` → numeric; `+Infinity` → finite; `1.01` → between 0 and 1 | ✅ |
| 3 | Derives priority from confidence bands | 8 boundary cases: 0, 0.39, 0.4, 0.69, 0.7, 0.89, 0.9, 1 | ✅ |
| 4 | Validates opportunity source fields | Unsupported type; blank `referenceId`; blank `summary` | ✅ |
| 5 | Validates detection result fields and protects result mutation | Timestamp validation; summary validation; `isFrozen(snapshot.opportunities)`, `isFrozen(snapshot.opportunities[0]?.source)` | ✅ |

### `DefaultOpportunityDetector` (6 tests)

| # | Test | Key Coverage | Result |
|---|---|---|---|
| 1 | Converts existing opportunities | Exact ID, title, confidence 0.8, priority "high", source type "manual" | ✅ |
| 2 | Generates insight-derived opportunity when no opportunities exist | ID `"detected-opportunity:insight:insight-1"`, confidence 0.65, priority "medium" | ✅ |
| 3 | Generates risk-mitigation opportunity when risks outnumber opportunities | 2 results; last risk used; confidence 0.7, priority "high" | ✅ |
| 4 | Returns empty result when no signals exist | Full equality including empty `opportunities`, empty message | ✅ |
| 5 | Uses deterministic IDs and does not mutate BusinessBrain | `first === second` (deep equal); `businessBrain.toSnapshot()` unchanged before/after | ✅ |
| 6 | Exports through public barrels | `PublicOpportunityDetectionResult === OpportunityDetectionResult` etc. | ✅ |

### Regression

| Before S-004 | After S-004 | Result |
|---|---|---|
| 28 files / 255 tests | 29 files / 266 tests | ✅ No regression |

**Testing Audit Verdict: PASS**

---

## Type Safety Audit

| Check | Result |
|---|---|
| `@nextshift/domain typecheck` — 0 errors | ✅ PASS |
| `DetectedOpportunity` plain interface — `priority` never in input, always derived | ✅ PASS |
| `createOpportunityConfidence` returns `number` (not branded) — consistent with S-003 `createHealthScore` | ✅ PASS |
| `isOpportunitySourceType` type guard — `value is OpportunitySourceType` | ✅ PASS |
| `DefaultOpportunityDetector implements OpportunityDetector` | ✅ PASS |
| `DetectedOpportunityId` — `Brand<string, "DetectedOpportunityId">` | ✅ PASS |

**Type Safety Audit Verdict: PASS**

---

## Audit Summary

| Area | Status |
|---|---|
| `DetectedOpportunity` — frozen plain interface, factory-validated | ✅ PASS |
| `OpportunityDetectionResult` — calculated model, `opportunities` getter + `toSnapshot()` | ✅ PASS |
| `createOpportunityConfidence()` — three-step (numeric/finite/range), 0–1 | ✅ PASS |
| `deriveOpportunityPriority()` — four bands, re-validates confidence | ✅ PASS |
| `createOpportunitySource()` — 6-value allowlist + field validation | ✅ PASS |
| `OpportunityDetector` contract — synchronous, snapshot-in | ✅ PASS |
| `DefaultOpportunityDetector` — three signal paths, deterministic IDs, non-mutating | ✅ PASS |
| Barrel updated — `opportunity-detection` + `opportunity-detector` added | ✅ PASS |
| Tests — 29 files / 266 total | ✅ PASS |
| Typecheck — 0 errors | ✅ PASS |
| S-002/S-003 exports fully preserved | ✅ PASS |

---

## Findings Summary

None.

---

## Exit Decision

**PASS — Slice S-004 accepted. Eligible to proceed to CAP-008 S-004 Slice Release.**

---

## Next Phase

**CAP-008 S-004 Slice Release → CAP-008 S-005 Business Insight Engine.**
