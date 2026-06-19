# V6.4K Brand Regeneration Service Boundary Report

## 1. Files Created

- `src/modules/brand-intelligence/types/brand-regeneration.ts`
- `src/modules/brand-intelligence/services/brand-regeneration-service.ts`
- `src/modules/brand-intelligence/projections/brand-regeneration-projection.ts`
- `src/modules/brand-intelligence/hooks/useBrandRegeneration.ts`
- `audit/V6_4K_BRAND_REGENERATION_SERVICE_BOUNDARY_REPORT.md`

## 2. Files Modified

- None

## 3. Service Boundary Diagram

Old runtime authority:

```text
BrandDNAStudio
  -> useRegenerateDNA()
  -> POST /api/v1/brand-dna/regenerate
  -> prisma.brandInterview.findFirst(latest extracted/confirmed)
  -> brandDnaService.regenerateBrandDNA()
  -> generateBrandDNA()
  -> saveBrandDNA()
```

New canonical boundary established:

```text
Brand Intelligence
  -> BrandRegenerationService.regenerateBrand(userId)
  -> prisma.brandInterview.findFirst(latest extracted/confirmed)
  -> brandDnaService.regenerateBrandDNA(userId, interviewId)
  -> generateBrandDNA()
  -> saveBrandDNA()
```

Projection wrapper:

```text
getBrandRegenerationPreview(userId)
  -> regenerateBrand(userId)
  -> BrandRegenerationSnapshot
```

Client hook boundary:

```text
useBrandRegeneration(userId)
  -> POST /api/v1/brand-dna/regenerate
  -> invalidate brand-dna / brand-health / brand-advisor / brand-intelligence queries
```

## 4. Regeneration Parity Verification

Parity is preserved because the new service boundary does not rewrite generation logic.

- Latest interview selection is preserved:
  - `status in ('extracted', 'confirmed')`
  - `orderBy createdAt desc`
- Execution engine is preserved:
  - `brandDnaService.regenerateBrandDNA()`
- AI generation logic is preserved:
  - `generateBrandDNA()` remains unchanged
- Merge rules are preserved:
  - all field merge logic remains inside `brandDnaService.regenerateBrandDNA()`
- Save semantics are preserved:
  - `saveBrandDNA()` remains unchanged

Coverage of preserved result categories:

- Identity
- Audience
- Offer
- Messaging
- Content Pillars

The new boundary only adds snapshot packaging:

- `before`
- `after`
- `changedFields`
- `recommendations`

## 5. Version Snapshot Verification

Version snapshot behavior is unchanged because all writes still flow through `brandDnaService.saveBrandDNA()`.

That preserves:

- `BrandProfile` upsert
- `metadata.brand_profile` compatibility write
- `createSnapshot()` execution
- `brand_dna_versions` append-and-trim behavior
- existing restore/history safety assumptions

## 6. Build Result

`pnpm build` passed.

## 7. Type-check Result

`pnpm type-check` passed.

## 8. Risk Assessment

Low to medium.

Why it is not zero:

- `getBrandRegenerationPreview()` currently uses the real regeneration execution path, so it is not a dry-run preview.
- The new client hook still posts to the legacy route because API cutover was out of scope for V6.4K.

Why it is still acceptable:

- no user-visible UI changed
- no AI generation logic changed
- no merge logic changed
- no persistence behavior changed
- no version history behavior changed

Net result:

`Brand Intelligence` now owns the canonical regeneration service boundary, while `brandDnaService.regenerateBrandDNA()` remains the execution engine.
