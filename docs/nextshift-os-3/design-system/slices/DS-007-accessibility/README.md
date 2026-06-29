# DS-007 Accessibility

## Status

Implemented.

## Scope

DS-007 adds the reusable accessibility foundation for `@nextshift/ui`.

Included:

1. Focus trap utilities
2. Focus scope management
3. Roving focus utilities
4. Landmark helpers
5. Accessible ID utilities
6. Screen reader helpers
7. Live region helpers
8. Reduced-motion helpers
9. High-contrast helpers
10. Accessibility validation utilities
11. Shared ARIA helpers

## Package Surface

The slice extends `@nextshift/ui` through:

- `src/accessibility/*`
- `src/types/accessibility-types.ts`
- `src/styles/accessibility-styles.ts`

## Compatibility

DS-007 preserves DS-001 through DS-006 exports and does not introduce runtime, routing, backend, governance, or database changes.
