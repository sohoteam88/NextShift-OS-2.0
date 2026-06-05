# 14 — UI/UX Architecture

> NextShift OS front-end design system, component library, and layout conventions.

---

## 1. Purpose

Define the visual language, component hierarchy, layout system, and interaction patterns so every screen built by any developer (human or AI) looks and feels like a single product.

## 2. Scope

- Design tokens (colors, typography, spacing, shadows)
- Component library (atoms → molecules → organisms → templates)
- Page layout system
- Responsive strategy
- Accessibility baseline
- Loading / empty / error states
- Dark mode readiness

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Component framework | React + Tailwind CSS | Utility-first, tree-shakeable, fast iteration |
| Component library base | shadcn/ui (Radix primitives) | Accessible, unstyled primitives with copy-paste ownership |
| Icons | Lucide React | Consistent, MIT-licensed, tree-shakeable |
| Charts | Recharts | React-native, declarative, lightweight |
| Forms | React Hook Form + Zod | Performant, schema-driven validation |
| State management | Zustand (client) + React Query (server) | Minimal boilerplate, cache-first data fetching |
| Animation | Framer Motion (sparingly) | Page transitions and micro-interactions only |
| Dark mode | CSS variables + Tailwind `dark:` | Ship light-first; dark-ready from day one |

---

## 4. Design Tokens

```
/* /styles/tokens.css */

:root {
  /* Brand */
  --color-primary:     #2563eb;   /* Blue-600 */
  --color-primary-hover:#1d4ed8;  /* Blue-700 */
  --color-accent:      #10b981;   /* Emerald-500 */
  --color-danger:      #ef4444;   /* Red-500 */
  --color-warning:     #f59e0b;   /* Amber-500 */

  /* Neutral */
  --color-bg:          #ffffff;
  --color-surface:     #f9fafb;   /* Gray-50 */
  --color-border:      #e5e7eb;   /* Gray-200 */
  --color-text:        #111827;   /* Gray-900 */
  --color-text-muted:  #6b7280;   /* Gray-500 */

  /* Spacing scale (4px base) */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.125rem;
  --text-xl:   1.25rem;
  --text-2xl:  1.5rem;
  --text-3xl:  1.875rem;

  /* Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;

  /* Shadow */
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.05);
  --shadow-md:  0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg:  0 10px 15px rgba(0,0,0,0.1);
}
```

---

## 5. Component Hierarchy

### 5.1 Atoms

Smallest building blocks — no business logic.

| Component | File | Notes |
|-----------|------|-------|
| Button | `ui/Button.tsx` | Variants: primary, secondary, ghost, danger. Sizes: sm, md, lg |
| Badge | `ui/Badge.tsx` | Status colors: green/yellow/red/gray/blue |
| Avatar | `ui/Avatar.tsx` | Image with initials fallback |
| Input | `ui/Input.tsx` | Text, email, password, search |
| Textarea | `ui/Textarea.tsx` | Auto-resize option |
| Select | `ui/Select.tsx` | Single + multi-select |
| Checkbox | `ui/Checkbox.tsx` | — |
| Toggle | `ui/Toggle.tsx` | — |
| Spinner | `ui/Spinner.tsx` | Sizes: sm, md, lg |
| Skeleton | `ui/Skeleton.tsx` | Loading placeholder |
| Label | `ui/Label.tsx` | Form label with optional required indicator |

### 5.2 Molecules

Composed atoms with a single responsibility.

| Component | Purpose |
|-----------|---------|
| FormField | Label + Input + Error message |
| SearchBar | Input + icon + debounced onChange |
| StatCard | Icon + label + value + trend |
| LeadCard | Avatar + name + score badge + stage |
| ActionItem | Checkbox + text + due date |
| LanguageSwitcher | Select with zh/en/ms flags |
| EmptyState | Illustration + message + CTA button |
| ConfirmDialog | Title + message + Cancel/Confirm buttons |

### 5.3 Organisms

Multi-molecule compositions with business logic.

| Component | Purpose |
|-----------|---------|
| LeadTable | Sortable, filterable lead list with bulk actions |
| PipelineBoard | Kanban drag-drop columns |
| FunnelEditor | Section-based funnel page builder |
| AIPromptPanel | Template selector + variable inputs + generate button + output |
| ChatTimeline | WhatsApp-style message thread |
| ActivityFeed | Chronological list of CRM activities |
| OnboardingWizard | Multi-step form with progress bar |
| TeamTree | Sponsor hierarchy visualization |

### 5.4 Templates (Layouts)

See § 6 below.

---

## 6. Layout System

### 6.1 App Shell

```
┌──────────────────────────────────────────────┐
│  TopBar (logo, search, lang, notifications,  │
│          avatar menu)                        │
├────────┬─────────────────────────────────────┤
│        │                                     │
│ Side-  │         Main Content                │
│ bar    │         (scrollable)                │
│ (nav)  │                                     │
│        │                                     │
│ 240px  │         flex-1                      │
│ fixed  │                                     │
├────────┴─────────────────────────────────────┤
│  (mobile: bottom tab bar replaces sidebar)   │
└──────────────────────────────────────────────┘
```

### 6.2 Responsive Breakpoints

| Name | Min-width | Sidebar | Layout |
|------|-----------|---------|--------|
| mobile | 0 | Hidden; bottom tabs | Single column |
| tablet | 768px | Collapsible overlay | Single column |
| desktop | 1024px | Always visible 240px | Sidebar + main |
| wide | 1440px | 240px | Sidebar + main (max-width 1280px content) |

### 6.3 Page Template Patterns

1. **List Page** — Title + filters + table/cards + pagination
2. **Detail Page** — Breadcrumb + header + tabbed sections
3. **Form Page** — Breadcrumb + form + sticky footer with Save/Cancel
4. **Dashboard Page** — Stat cards row + chart grid + recent activity
5. **Kanban Page** — Pipeline board (full-width, horizontal scroll)
6. **Builder Page** — Left panel (tools) + center canvas + right panel (properties)

---

## 7. Sidebar Navigation Structure

Sidebar items are **role-filtered** at render time via `user.role`.

```
Member:
  Dashboard
  My Leads         → CRM
  My Funnels       → Funnel
  Daily Actions    → Member
  Training         → Member
  AI Tools         → AI
  Settings

Leader (adds):
  Team Overview    → Team
  Team Members     → Team
  Approve Members  → Admin-lite

Operator (adds):
  Admin Dashboard  → Admin
  Manage Users     → Admin
  Manage Templates → Admin
  AI Prompts       → Admin
  Analytics        → Analytics
  Settings (Tenant)→ Admin

Platform Admin:
  All Tenants
  System Health
  Global Settings
```

---

## 8. State Patterns

### 8.1 Loading States

Every data-fetching component must handle three states:

| State | UI |
|-------|----|
| Loading | Skeleton placeholder matching final layout shape |
| Empty | EmptyState component with contextual CTA |
| Error | Inline error banner with retry button |

### 8.2 Optimistic Updates

Apply for: lead stage drag, checkbox toggles, note creation. Revert on server error with toast notification.

### 8.3 Toast Notifications

Position: top-right. Auto-dismiss: 4s. Types: success (green), error (red), info (blue), warning (amber).

---

## 9. Accessibility Baseline

- All interactive elements: keyboard focusable, visible focus ring
- ARIA labels on icon-only buttons
- Color contrast: WCAG AA minimum (4.5:1 text, 3:1 large text)
- Form errors: linked via `aria-describedby`
- Screen reader: logical heading hierarchy (h1 → h2 → h3)
- Language attribute: `<html lang={currentLocale}>`

---

## 10. Folder Structure

```
src/
├── components/
│   ├── ui/              # Atoms (Button, Input, Badge…)
│   ├── molecules/       # FormField, StatCard, SearchBar…
│   ├── organisms/       # LeadTable, PipelineBoard…
│   └── layouts/         # AppShell, AuthLayout, PublicLayout
├── hooks/               # useLeads, useFunnel, useAI…
├── stores/              # Zustand stores
├── styles/
│   ├── tokens.css       # Design tokens
│   └── globals.css      # Tailwind base + overrides
└── lib/
    └── cn.ts            # clsx + tailwind-merge utility
```

---

## 11. Risks / Tradeoffs

| Risk | Mitigation |
|------|------------|
| shadcn components diverge from upstream | Pin version; review changelogs before updating |
| Tailwind class sprawl | Extract repeated patterns into component variants |
| Mobile experience as afterthought | Design mobile-first; test at 375px during every PR |
| Accessibility regressions | Lint with eslint-plugin-jsx-a11y; periodic axe audits |

---

## 12. Future Expansion

- Theming per tenant (operator uploads brand colors → CSS variable override)
- Design token export to Figma via Style Dictionary
- Storybook for component documentation
- E2E visual regression tests (Playwright + screenshot diffing)

---

**Cross-references:** `05_USER_ROLES_AND_PERMISSIONS.md` (role-based nav), `15_I18N_ARCHITECTURE.md` (LanguageSwitcher), `09_AI_ARCHITECTURE.md` (AIPromptPanel)
