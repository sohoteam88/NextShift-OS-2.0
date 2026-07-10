# Version History & Restore Specification

## 1. Dependency Graph

Current runtime dependency graph:

```text
BrandDNAStudio
  -> useBrandDNA()
  -> GET /api/v1/brand-dna
  -> brandDnaService.getBrandDNA()
  -> BrandProfile (primary) / user.metadata.brand_profile (fallback)

BrandDNAStudio
  -> useSaveDNA()
  -> PUT /api/v1/brand-dna
  -> brandDnaService.saveBrandDNA()
  -> createSnapshot()
  -> user.metadata.brand_dna_versions
  -> BrandProfile upsert

BrandDNAStudio
  -> useRegenerateDNA()
  -> POST /api/v1/brand-dna/regenerate
  -> brandDnaService.regenerateBrandDNA()
  -> saveBrandDNA()
  -> createSnapshot()
  -> user.metadata.brand_dna_versions
```

Current version authority:

```text
brandDnaService.createSnapshot()
brandDnaService.getVersions()
brandDnaService.restoreVersion()
```

Notably, `BrandDNAStudio` is not currently rendering a real version history or restore UI. The safety layer exists in service code, not as a surfaced capability.

## 2. Snapshot Lifecycle

### When a snapshot is created

Snapshots are created only through `brandDnaService.saveBrandDNA()`.

That means snapshot creation currently happens on:

- manual save
- autosave
- regeneration
- publish
- restore

### What fields are stored

Each snapshot is a full `BrandDNASnapshot` object:

```ts
{
  version: number;
  snapshot: BrandDNA;
  createdAt: string;
  label?: string;
}
```

The embedded `snapshot` stores the full `BrandDNA` payload:

- `identity`
- `audience`
- `messaging`
- `content`
- `offer`
- `visual`
- `meta`

### How versions are trimmed

`createSnapshot()` appends to `user.metadata.brand_dna_versions` and then keeps only the newest 20 items:

```text
versions.push(...)
versions.slice(-20)
```

This is a rolling in-metadata history buffer, not a dedicated table.

### How versions are restored

`restoreVersion(userId, version)`:

1. reads `brand_dna_versions`
2. finds the target snapshot by version number
3. loads current DNA to get the latest version counter
4. calls `saveBrandDNA()` with the historical snapshot payload
5. increments version again
6. creates a new snapshot for the restore result

Restore is therefore a write-forward rollback, not an in-place rewind.

## 3. Restore Flow

Current restore flow in code:

```text
Restore UI
  -> not implemented yet

Potential runtime path today
  -> brandDnaService.restoreVersion(userId, version)
  -> brandDnaService.getVersions(userId)
  -> find target snapshot
  -> brandDnaService.getBrandDNA(userId)
  -> brandDnaService.saveBrandDNA(userId, restoredSnapshotWithNewVersion)
  -> BrandProfile upsert
  -> user.metadata.brand_profile update
  -> createSnapshot()
  -> user.metadata.brand_dna_versions append
```

Important consequence:

- restore changes the current `BrandProfile`
- restore also creates a new history entry
- restore does not delete intermediate versions

## 4. Compare Flow

Current state:

- `compareVersions()` does not exist
- no diff service exists
- no API exists for version comparison
- no UI exists for historical side-by-side comparison

So current compare flow is:

```text
Not implemented
```

What does exist today:

- full snapshots are stored
- enough data exists to compute diffs later
- `BrandRegenerationSnapshot.changedFields` established the first usable diff pattern in Brand Intelligence

Canonical compare capability should therefore be specified as a new projection responsibility, not as a migration of existing compare logic.

## 5. Data Source Analysis

### BrandProfile

Classification: `Required`

Why:

- it is the current canonical live state
- restore ultimately writes back into it
- version history without current state cannot determine current version context

### brand_dna_versions

Classification: `Required`

Why:

- it is the only actual history store
- restore depends on it directly
- rollback safety depends on it directly

### user.metadata

Classification: `Required`

Why:

- `brand_dna_versions` lives inside `user.metadata`
- legacy `brand_profile` compatibility also lives there

### brandInterview

Classification: `Not Used`

Why:

- version history and restore do not read interview data
- interview data matters for regeneration, not for rollback

## 6. Projection Contracts

### BrandVersionSnapshot

Recommended canonical contract:

```ts
interface BrandVersionSnapshot {
  id: string;
  version: number;
  createdAt: string;
  label: string;
  summary: string;
  changes: string[];
  data: BrandProfile;
}
```

Implementation notes:

- `id` can initially be derived from `version` and `createdAt`
- `data` should be the full `BrandDNA` object currently used as runtime brand profile
- `summary` should be projection-generated because the raw snapshot does not contain one
- `changes` must be computed by diffing against the previous snapshot or current state

### BrandVersionHistorySnapshot

Recommended canonical contract:

```ts
interface BrandVersionHistorySnapshot {
  versions: BrandVersionSnapshot[];
  currentVersionId: string | null;
}
```

Optional later expansion:

```ts
interface BrandVersionHistorySnapshot {
  versions: BrandVersionSnapshot[];
  currentVersionId: string | null;
  totalVersions: number;
  retentionLimit: number;
}
```

## 7. Safety Rules

### Validation Rules

- restore target version must exist
- snapshot payload must be structurally valid `BrandDNA`
- restore must preserve required metadata fields
- empty or malformed `brand_dna_versions` must degrade safely to no-history state

### Rollback Rules

- restore must never mutate historical snapshots in place
- restore must write a new current version
- restore must create a new snapshot entry representing the rollback action
- rollback must preserve existing retention trimming behavior unless explicitly redesigned

### Conflict Rules

- if current live version has changed since the user opened history, restore should still be treated as a new forward write
- if retention trimming removed the requested version, restore must fail cleanly
- if metadata history and BrandProfile diverge, BrandProfile remains the live authority and history is treated as rollback source material

### Error Rules

- missing version: explicit not-found error
- malformed snapshot: fail closed, do not write partial restore
- metadata write failure: fail restore
- snapshot creation failure after save is currently non-critical in implementation, but canonical version safety should eventually tighten this because rollback without durable history weakens regeneration safety

## 8. Migration Difficulty Matrix

| Area | Difficulty | Why |
|---|---|---|
| UI | Medium | No live version UI exists, so UI work is new but bounded |
| Projection | High | History, summary, and diff contracts do not exist yet |
| Services | Medium | Core snapshot/restore primitives already exist |
| Data | High | History still lives in `user.metadata`, not a first-class table |
| Safety | High | Regeneration depends on rollback confidence, and current snapshot write is best-effort |

## 9. Migration Plan

### Phase 1

Define canonical read models in Brand Intelligence:

- `BrandVersionSnapshot`
- `BrandVersionHistorySnapshot`
- diff generation contract
- current-version identification rules

No UI cutover.
No restore UI yet.

### Phase 2

Implement Brand Intelligence projections and read APIs:

- `getBrandVersionHistorySnapshot(userId)`
- computed `summary`
- computed `changes`
- current-version mapping

Keep restore execution in legacy service at first.

### Phase 3

Add restore capability under Brand Intelligence:

- canonical restore service boundary
- explicit restore safety checks
- version history UI in `/brand-builder/intelligence`
- only then evaluate `/brand-dna` retirement

## 10. Final Recommendation

Version History is not an optional convenience feature. It is the rollback safety layer that regeneration depends on.

Current reality:

- history storage exists
- restore primitive exists
- compare flow does not exist
- surfaced history UI does not exist
- safety semantics are partially implicit inside `brandDnaService`

Canonical recommendation:

1. keep `brandDnaService` as the execution engine for now
2. build Brand Intelligence version projections first
3. formalize diff and restore contracts before any UI cutover
4. do not retire `/brand-dna` until version safety is visible and testable from the new domain

Net conclusion:

`V6.4L` is a `GO` for specification, but the actual migration path should start with projection and diff contracts, not with restore UI.
