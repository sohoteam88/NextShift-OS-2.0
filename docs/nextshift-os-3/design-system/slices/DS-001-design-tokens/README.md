# DS-001 Design Tokens

## Purpose

DS-001 establishes the canonical NextShift Design System token foundation. It provides strongly typed primitive tokens, semantic tokens, component-facing aliases, theme tokens, and token resolution helpers for future UI surfaces.

## Token Categories

- Colors: primitive neutral, brand, success, warning, danger, info, and surface scales; semantic foreground, background, border, status, muted, disabled, and focus tokens.
- Typography: system font stacks, sizes, weights, line heights, letter spacing, and heading/body/label/caption scales.
- Layout: spacing, radius, elevation, breakpoints, and z-index.
- Interaction: hover, active, selected, disabled, focus, error, and loading state tokens.
- Data visualization: categorical and sequential palettes plus chart indicator, grid, axis, and tooltip slots.

## Consumption Rule

Future components should consume `nextShiftThemeTokens`, `semanticTokens`, or `componentTokens` from `@nextshift/shared`. Components should avoid hardcoding visual constants when a token exists.

```ts
import { nextShiftThemeTokens, resolveToken } from "@nextshift/shared";

const background = resolveToken(nextShiftThemeTokens, "color.background");
const cardRadius = nextShiftThemeTokens.component.card.radius;
```

## Backward Compatibility Rule

Existing token names are stable public API. Additive token changes are allowed. Renaming or removing token paths requires a design-system compatibility plan and migration notes.

## Theming Extension Rule

New themes should preserve the `ThemeTokens` structure and override semantic values rather than changing primitive token contracts. Component aliases should continue to resolve to concrete values.

## Non-Goals

DS-001 does not implement React components, dashboard layouts, chart components, runtime theme switching, backend APIs, database changes, or business capability workflows.
