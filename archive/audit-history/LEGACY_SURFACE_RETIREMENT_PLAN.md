# Legacy Surface Retirement Plan

Scope: inspect `src/app/**`, redirect handlers, and legacy page surfaces for the retirement candidates:

- `/brand-dna`
- `/customers`
- `/team/growth`

Protected routes not evaluated in this plan:

- `/ai`
- `/workspace`
- `/crm-center`
- `/admin-command`

No code changes were made.

## 1. Legacy Surface Inventory

| Legacy Route | Current Surface | Capability |
| --- | --- | --- |
| `/brand-dna` | `src/app/(auth)/brand-dna/page.tsx` | Brand Identity Studio |
| `/customers` | `src/app/(auth)/customers/page.tsx` | Legacy CRM engine dashboard |
| `/team/growth` | `src/app/(auth)/team/growth/page.tsx` | Team Engine / organization growth dashboard |

## 2. Business Capability Mapping

### `/brand-dna`

- Provides the Brand DNA Studio experience.
- Includes brand identity editing, scoring, regeneration, advisor recommendations, and interview gating.

### `/customers`

- Provides a CRM dashboard-style surface based on the legacy CRM engine.
- Functionally overlaps CRM lead/customer management, but the page is an older command-center style entry point.

### `/team/growth`

- Provides a Team Engine dashboard with pipeline, onboarding progress, org metrics, and member actions.
- Functionally overlaps team overview and team management.

## 3. Canonical Replacement Matrix

| Legacy Route | Canonical Route | Replacement Quality |
| --- | --- | --- |
| `/brand-dna` | `/brand-builder/profile` | Partial |
| `/customers` | `/crm` | Partial |
| `/team/growth` | `/team` | Partial |

## 4. Feature Parity Analysis

### `/brand-dna` -> `/brand-builder/profile`

- **Result:** PARTIAL
- The canonical page covers brand profile editing and interview restart.
- The legacy studio still adds health scoring, regeneration, advisor recommendations, and a richer multi-section editing flow.
- The canonical route can replace the core data-entry capability, but not the full studio UX yet.

### `/customers` -> `/crm`

- **Result:** PARTIAL
- The canonical CRM page covers lead management, pipeline access, filters, and add-lead workflows.
- The legacy page is a dashboard-style CRM engine surface and is not the same interaction model.
- Core business capability is covered, but the UX surface is not identical.

### `/team/growth` -> `/team`

- **Result:** PARTIAL
- The canonical team page covers team overview, tree/list views, member detail, and invitations.
- The legacy growth page adds team-engine framing, onboarding progress, and organization-growth metrics.
- The underlying capability is covered, but not the same presentation or progression framing.

## 5. Bookmark Risk Matrix

| Legacy Route | Risk | Reason |
| --- | --- | --- |
| `/brand-dna` | MEDIUM | Historical brand links still exist in docs and the page still has a distinct identity-studio UX. |
| `/customers` | MEDIUM | Older CRM bookmarks are plausible, but the canonical CRM surface already exists. |
| `/team/growth` | MEDIUM | Team-growth bookmarks are plausible, and the route still presents a distinct growth-engine frame. |

## 6. Retirement Readiness Matrix

| Legacy Route | Strategy | Readiness |
| --- | --- | --- |
| `/brand-dna` | Soft Retirement | PARTIAL |
| `/customers` | Redirect | PARTIAL |
| `/team/growth` | Redirect | PARTIAL |

## 7. Deletion Impact Matrix

### `/brand-dna`

If removed, these files lose their only visible runtime entry point:

- `src/app/(auth)/brand-dna/page.tsx`
- `src/modules/brand-dna/components/BrandDNAStudio.tsx`
- `src/modules/brand-dna/components/DNAHealthCard.tsx`
- `src/modules/brand-dna/services/BrandDnaAdvisor.ts`
- `src/app/api/v1/brand-dna/route.ts`
- `src/app/api/v1/brand-dna/health/route.ts`
- `src/app/api/v1/brand-dna/regenerate/route.ts`

### `/customers`

If removed, these files lose the legacy CRM engine entry point:

- `src/app/(auth)/customers/page.tsx`
- `src/modules/crm-engine/components/CRMDashboard.tsx`
- `src/modules/crm-engine/hooks/useCRMEngine.ts`

### `/team/growth`

If removed, these files lose the legacy team growth entry point:

- `src/app/(auth)/team/growth/page.tsx`
- `src/modules/team-engine/components/TeamDashboard.tsx`
- `src/modules/team-engine/hooks/useTeamEngine.ts`

## 8. Recommended Timeline

### Phase 1

- Move `/customers` and `/team/growth` onto retirement redirects after one final traffic / bookmark check.
- Update any remaining docs or AI copy that still mentions them as primary entry points.

### Phase 2

- Keep `/brand-dna` in soft retirement while the brand-builder canonical path absorbs the missing studio features.
- Use this phase to close the parity gaps in health, advisor, and regeneration flows.

### Phase 3

- Hard delete the legacy pages only after traffic is near-zero and bookmarks are drained.
- This phase should happen only after the canonical pages fully satisfy the old workflows.

## 9. Final Recommendation

Do not hard-delete any of the three candidates yet.

Recommended order:

1. Retire `/customers` first.
2. Retire `/team/growth` second.
3. Retire `/brand-dna` last, after canonical brand-builder parity closes.

The safest policy is:

- `/customers` and `/team/growth`: migrate to redirects when ready
- `/brand-dna`: keep in soft retirement until the canonical brand-builder path fully absorbs its studio behavior

That gives you a low-risk retirement path without breaking bookmarks or collapsing still-useful legacy UX before its replacement is complete.
