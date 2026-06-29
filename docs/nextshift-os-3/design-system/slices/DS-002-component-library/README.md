# DS-002 Component Library

## Purpose

DS-002 establishes the foundational React component library for NextShift Design System v1.0. It provides reusable UI primitives that consume DS-001 token exports from `@nextshift/shared`.

## Component List

- `Button`
- `Input`
- `Textarea`
- `Select`
- `Card`
- `Badge`
- `Alert`
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
- `Spinner`
- `EmptyState`

## Token Consumption Model

Components use token-derived style contracts from `@nextshift/shared`, including `componentTokens`, `semanticTokens`, and `nextShiftThemeTokens`. Future UI should extend these contracts instead of duplicating visual values.

## Public API Usage

```tsx
import { Button, Card, Input } from "@nextshift/ui";

export function Example() {
  return (
    <Card header="Customer">
      <Input label="Email" name="email" placeholder="buyer@example.com" />
      <Button variant="primary">Save</Button>
    </Card>
  );
}
```

## Accessibility Baseline

- Buttons support disabled and loading states.
- Form controls support labels, helper/error text, disabled state, and `aria-invalid`.
- Spinner exposes `role="status"` and an accessible label.
- Alert uses `role="status"` for non-danger variants and `role="alert"` for danger.
- EmptyState uses `role="status"`.

## Non-Goals

DS-002 does not implement dashboard frameworks, business-specific screens, data fetching, routing, authentication, authorization, database changes, chart components, theme switching, or full accessibility audit tooling.

## Extension Rule

Future DS slices should compose these primitives and style contracts. Additive component APIs are allowed; breaking prop or export changes require a migration plan.
