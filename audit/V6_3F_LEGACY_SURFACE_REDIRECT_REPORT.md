# V6.3F Legacy Surface Redirect Report

Scope: convert legacy CRM and Team surfaces into redirect-only compatibility routes.

Modified files:

- `src/app/(auth)/customers/page.tsx`
- `src/app/(auth)/team/growth/page.tsx`

No other routes were touched. `brand-dna` was explicitly left active.

## 1. Files Modified

- `src/app/(auth)/customers/page.tsx`
- `src/app/(auth)/team/growth/page.tsx`

## 2. Redirect Mapping

| Legacy Route | New Behavior | Canonical Target |
| --- | --- | --- |
| `/customers` | Server redirect | `/crm` |
| `/team/growth` | Server redirect | `/team` |

Implementation detail:

- Both pages now call `redirect(...)` from `next/navigation`.
- No client-side navigation was introduced.
- No middleware or route-handler changes were made.

## 3. Type-check Result

- `pnpm type-check` passed

## 4. Build Result

- `pnpm build` passed
- Build output shows `/customers` and `/team/growth` as small redirect-sized pages, which matches the intended implementation.
- `/brand-dna` still builds as a live page and was not converted.

## 5. CRM Redirect Verification

Verified from source and build output:

- `src/app/(auth)/customers/page.tsx` now redirects to `/crm`
- Build output shows `/customers` as a 584 B page, consistent with a redirect-only route

Result: `/customers` lands on `/crm`.

## 6. Team Redirect Verification

Verified from source and build output:

- `src/app/(auth)/team/growth/page.tsx` now redirects to `/team`
- Build output shows `/team/growth` as a 584 B page, consistent with a redirect-only route

Result: `/team/growth` lands on `/team`.

## 7. Brand-DNA Verification

Verified unchanged:

- `src/app/(auth)/brand-dna/page.tsx` still renders `BrandDNAStudio`
- Build output shows `/brand-dna` remains a live page

Result: `/brand-dna` still renders normally.

## 8. Risk Assessment

Low to medium.

What changes:

- Old bookmarks and shared links to `/customers` and `/team/growth` continue to work through redirects.

Residual risk:

- External docs and AI-generated references may still mention legacy routes, but the runtime surface now forwards to canonical routes.
- Any client code that assumed the legacy pages rendered local content will now reach the canonical pages instead.

## 9. Rollback Procedure

If rollback is needed:

1. Restore the previous implementations of:
   - `src/app/(auth)/customers/page.tsx`
   - `src/app/(auth)/team/growth/page.tsx`
2. Re-run:
   - `pnpm type-check`
   - `pnpm build`
3. Redeploy the previous build.

Rollback is localized to these two pages. No redirect handlers, middleware, or domain services were changed, so the revert surface is small.
