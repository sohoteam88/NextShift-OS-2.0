# V6.3D AI Route Canonicalization

Scope: align AI-generated actions and recommendations with canonical routes. I updated only the two files called out by the task:

- `src/app/api/v1/ai/coach/recommend/route.ts`
- `src/modules/ai/agents/crm-manager.ts`

I also scanned:

- `src/modules/ai/**`
- `src/modules/business-intelligence/**`
- `src/modules/advisors/**`
- `src/modules/recommendations/**`

for remaining legacy AI route outputs.

## Final Conclusion

AI-generated actions now point at canonical destinations when a canonical route exists:

- `/ai` was replaced with `/content-engine`
- `/crm-center` was replaced with `/crm`

I did not find remaining AI-generated route outputs for:

- `/brand-dna`
- `/team/growth`
- `/customers`

within the inspected AI and business-intelligence directories.

## Files Modified

- `src/app/api/v1/ai/coach/recommend/route.ts`
- `src/modules/ai/agents/crm-manager.ts`

## AI Route Changes

### AI Coach recommendation API

Before:

- `actionHref: '/ai'`

After:

- `actionHref: '/content-engine'`

### CRM Manager agent

Before:

- `route: '/crm-center'`

After:

- `route: '/crm'`

## Canonical Route Mapping

- Content / AI content workspace -> `/content-engine`
- CRM / lead management / customer management -> `/crm`
- Brand identity / profile -> `/brand-builder/profile`
- Team -> `/team`

## Remaining Legacy AI References

I found no remaining legacy route outputs in the inspected AI directories after the update.

What remains in `src/modules/ai/**` and `src/modules/business-intelligence/**` is mostly:

- module path imports containing `ai`
- API paths under `/api/v1/ai/*`
- non-route references to brand context helpers using `brand-dna` module names

Those are not AI-generated navigation outputs.

## Repository Scan Results

### `/ai`

Remaining hits in the inspected directories are not navigation outputs:

- module imports such as `@/modules/ai/...`
- API endpoints under `/api/v1/ai/...`
- AI workflow helpers and content history utilities

### `/crm-center`

No remaining route-output hits in the inspected AI directories after the update.

### `/brand-dna`

Remaining hits are module imports into `brand-dna` context and types, not emitted routes.

### `/team/growth`

No remaining hits in the inspected AI directories.

### `/customers`

No remaining hits in the inspected AI directories.

## Validation

- `pnpm type-check` passed
- `pnpm build` passed

## Risk Assessment

Low. The change only rewired AI-produced destinations. The main residual risk is external documentation or legacy UI pages still showing old routes, but the AI emission paths called out in this task now target canonical routes directly.
