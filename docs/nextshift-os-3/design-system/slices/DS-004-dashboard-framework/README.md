# DS-004 Dashboard Framework

## Purpose

DS-004 extends `@nextshift/ui` with reusable dashboard infrastructure primitives. It provides shell, page, grid, panel, widget, toolbar, filter, empty, and loading patterns for future dashboard surfaces.

## Primitives

- `DashboardShell`
- `DashboardPage`
- `DashboardGrid`
- `DashboardPanel`
- `WidgetContainer`
- `WidgetHeader`
- `WidgetBody`
- `WidgetFooter`
- `DashboardToolbar`
- `DashboardFilterBar`
- `DashboardEmptyState`
- `DashboardLoadingState`

## Token And Composition Model

Dashboard style contracts consume DS-001 tokens from `@nextshift/shared`. Components reuse DS-002 primitives such as `Button`, `EmptyState`, and `Spinner`, and compose DS-003 primitives such as `AppShell`, `MainContent`, `PageHeader`, `Header`, and `Sidebar`.

## Non-Goals

DS-004 does not implement business dashboards, CRM views, revenue screens, analytics widgets, charts, data fetching, routing, backend APIs, authorization, persistence, or dashboard business logic.

## Accessibility Baseline

- `DashboardPage` composes semantic main content through DS-003.
- `DashboardLoadingState` exposes `role="status"` and an accessible label.
- Empty states reuse DS-002 `EmptyState` semantics.
- Widget and panel containers use structural section elements.

## Example Usage

```tsx
import {
  DashboardGrid,
  DashboardPage,
  DashboardPanel,
  WidgetBody,
  WidgetContainer,
  WidgetHeader,
} from "@nextshift/ui";

export function DashboardExample() {
  return (
    <DashboardPage title="Overview">
      <DashboardGrid columns="auto">
        <DashboardPanel>
          <WidgetContainer>
            <WidgetHeader title="Widget" />
            <WidgetBody>Reusable dashboard content slot.</WidgetBody>
          </WidgetContainer>
        </DashboardPanel>
      </DashboardGrid>
    </DashboardPage>
  );
}
```
