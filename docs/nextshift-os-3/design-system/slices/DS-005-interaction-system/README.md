# DS-005 Interaction System

## Purpose

DS-005 extends `@nextshift/ui` with reusable interaction infrastructure. It provides primitive overlays, feedback components, disclosure contracts, keyboard utilities, focus ring helpers, motion helpers, and interaction state helpers.

## Primitives And Contracts

- `LoadingOverlay`
- `ProgressIndicator`
- `Toast`
- `Modal`
- `Dialog`
- `Dropdown`
- `Tooltip`
- Focus ring helpers
- Interaction state helpers
- Motion helpers
- Keyboard interaction utilities
- Framework-local hooks: `useDisclosure`, `useKeyboardActivation`

## Token Model

Interaction styles consume DS-001 tokens from `@nextshift/shared`, including semantic colors, z-index, motion duration/easing, state opacity, focus ring values, radius, elevation, spacing, and semantic overlay/scrim tokens.

## Composition Model

DS-005 reuses DS-002 primitives such as `Button`, `Spinner`, and `EmptyState`. It remains compatible with DS-003 layout primitives and DS-004 dashboard primitives without coupling to routing, persistence, or business state.

## Accessibility Baseline

- Loading and progress components expose status/progress semantics.
- Toast uses `role="status"` or `role="alert"` based on tone.
- Modal renders `role="dialog"` with `aria-modal` and uses `aria-labelledby` when a title is provided. Consumers can pass `aria-label` when no title is provided.
- Dropdown injects `aria-haspopup="menu"` and `aria-expanded` onto a valid trigger element. Non-element trigger content is rendered as a safe fallback.
- Tooltip renders `role="tooltip"` when open and uses a per-instance `React.useId()` value for `id` and `aria-describedby`.
- Keyboard helpers normalize activation, cancellation, and navigation intents.

## Non-Goals

DS-005 does not implement global toast orchestration, focus trapping, route-aware behavior, persistence, backend APIs, business logic, or a new UI framework dependency.

## Audit Patch Notes

- Dropdown ARIA attributes are applied to the real trigger element when the trigger is a valid React element.
- Tooltip IDs are unique per instance.
- Modal and Dialog surfaces expose accessible names through `aria-labelledby` or consumer-provided `aria-label`.
- Loading overlay and modal scrim colors consume DS-001 overlay tokens.

## Example Usage

```tsx
import { Button, Modal, Toast, useDisclosure } from "@nextshift/ui";

export function InteractionExample() {
  const modal = useDisclosure();

  return (
    <>
      <Button onClick={modal.show}>Open</Button>
      <Toast tone="success" title="Saved" description="Changes were saved." />
      <Modal open={modal.open} title="Confirm" onClose={modal.hide}>
        Confirm this action.
      </Modal>
    </>
  );
}
```
