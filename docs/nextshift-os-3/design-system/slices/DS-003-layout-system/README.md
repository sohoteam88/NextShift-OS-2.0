# DS-003 Layout System

## Purpose

DS-003 extends `@nextshift/ui` with reusable layout primitives and token-driven layout style contracts for future NextShift application surfaces.

## Layout Primitives

- `AppShell`
- `PageShell`
- `Header`
- `Sidebar`
- `MainContent`
- `Container`
- `Stack`
- `Inline`
- `Grid`
- `SplitPanel`
- `Section`
- `PageHeader`

## Relationship To DS-001 Tokens

Layout style contracts consume DS-001 tokens from `@nextshift/shared`, including spacing, breakpoints, radius, elevation, semantic colors, border colors, and z-index.

## Relationship To DS-002 Components

DS-003 extends the same `@nextshift/ui` package created in DS-002. It keeps DS-002 component exports intact and may compose DS-002 primitives such as `Card`, `Button`, and `Badge` where appropriate.

## Accessibility Baseline

- `MainContent` renders a semantic `<main>`.
- `Header` renders a semantic `<header>`.
- `Sidebar` renders an `<aside>` with an accessible label.
- `PageHeader` renders a clear heading.
- `Section` uses a section element without adding unnecessary landmarks by default.
- `AppShell` lets consumers label sidebar areas.

## Responsive Strategy

DS-003 provides responsive-friendly inline style contracts and a minimal exported CSS string for AppShell and SplitPanel media-query behavior. It does not introduce breakpoint detection or runtime layout state.

## Non-Goals

DS-003 does not implement dashboard frameworks, business-specific pages, route-aware navigation, data fetching, authentication, authorization, charts, theme switching, backend APIs, database changes, or runtime service changes.

## Extension Model

Future Design System slices should compose these layout primitives and style contracts. Additive props are allowed; breaking public layout exports requires migration notes.

## Example Usage

```tsx
import { AppShell, Header, MainContent, PageHeader, Sidebar, Stack } from "@nextshift/ui";

export function ExampleLayout() {
  return (
    <AppShell
      header={<Header leading="NextShift" trailing="Actions" sticky />}
      sidebar={<Sidebar label="Primary navigation">Navigation</Sidebar>}
    >
      <MainContent maxWidth="xl">
        <Stack gap="lg">
          <PageHeader title="Customers" description="Manage customer relationships." />
          <div>Page content</div>
        </Stack>
      </MainContent>
    </AppShell>
  );
}
```
