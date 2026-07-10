# V6 CRM Truth Report

Audit only. No code was modified.

## 1) CRM Sources

| File | Purpose | Inputs | Outputs | Used By |
|---|---|---|---|---|
| `src/modules/crm/services/lead-service.ts` | Core lead CRUD | `AuthUser`, lead filters, lead input | lead list/detail/create/update/delete | `/api/v1/crm/leads`, `/api/v1/crm/leads/[id]`, CRM UI |
| `src/modules/crm/services/followup-service.ts` | Follow-up scheduling and counts | `AuthUser`, leadId, date | today/overdue/upcoming lead sets and counts | `/api/v1/crm/followups`, CRM widgets |
| `src/modules/crm/services/pipeline-service.ts` | Pipeline stage management | tenantId, stage payloads | pipeline stages CRUD | `/api/v1/crm/pipeline-stages`, `/crm/pipeline` |
| `src/modules/crm/crmCenterService.ts` | Live CRM command center projection | userId, tenantId | leads, hot leads, opportunities, revenue forecast, followups, appointments | `/api/v1/crm-center`, `/crm-center`, `src/modules/crm/components/CRMDashboard.tsx` |
| `src/modules/crm/hooks/use-leads.ts` | Lead data hooks | `/api/v1/crm/leads` | lead rows, detail, mutations | `/crm`, `/crm/[id]`, pipeline UI |
| `src/modules/crm/hooks/use-followup.ts` | Follow-up hooks | `/api/v1/crm/followups`, `/api/v1/crm/leads/[id]/followup` | counts, follow-up groups, update mutation | lead detail, CRM sidebar widgets |
| `src/modules/crm/hooks/use-pipeline.ts` | Pipeline hooks | `/api/v1/crm/pipeline-stages`, `/api/v1/crm/leads` | stages and grouped leads | `/crm/pipeline` |
| `src/modules/crm/components/CRMDashboard.tsx` | Real CRM dashboard | `/api/v1/crm-center` | command-center view | `/crm-center` |
| `src/modules/crm-engine/hooks/useCRMEngine.ts` | Legacy/static CRM dashboard state | none; hardcoded stats + in-memory followup helper | locked state, static stats | `/customers` |
| `src/modules/crm-engine/services/followup-service.ts` | Legacy in-memory follow-up store | leadId, due date | in-memory follow-up items | `useCRMEngine` |
| `src/modules/crm-engine/components/CRMDashboard.tsx` | Legacy CRM dashboard shell | `useCRMEngine()` | static dashboard UI | `/customers` |
| `src/app/api/v1/crm/customers/route.ts` | Customer CRUD | `AuthUser`, customer input | `prisma.customer` rows | `/crm/customers` |
| `src/app/api/v1/crm/customers/[id]/route.ts` | Customer detail CRUD | `AuthUser`, customer id | `prisma.customer` row | `/crm/customers/[id]` |
| `src/app/api/v1/crm/leads/route.ts` | Lead collection API | `AuthUser`, query/body | `prisma.lead` rows | `/crm`, pipeline, CRM widgets |
| `src/app/api/v1/crm/leads/[id]/route.ts` | Lead detail/update API | `AuthUser`, lead id | `prisma.lead` row updates; mission progress on converted stage | `/crm/[id]` |
| `src/app/api/v1/crm/followups/route.ts` | Follow-up listing API | `AuthUser` | lead follow-up lists/counts | follow-up widgets |
| `src/app/api/v1/crm/pipeline-stages/*` | Pipeline stage APIs | `AuthUser`, tenantId | `prisma.pipelineStage` rows | `/crm/pipeline` |
| `src/app/api/v1/crm-center/route.ts` | CRM command-center API | `AuthUser` | live CRM projection | `/crm-center`, `crm/components/CRMDashboard.tsx` |

## 2) CRM Systems

### A. `crm` system
- **Purpose:** actual CRUD CRM for leads, pipeline, follow-ups, and customers.
- **Database tables:** `lead`, `customer`, `pipelineStage`, `activity`, `tag`, join tables.
- **Routes:** `/crm`, `/crm/[id]`, `/crm/pipeline`, `/crm/customers`, `/crm-center`, `/api/v1/crm/**`, `/api/v1/crm-center`.
- **Components:** `LeadTable`, `LeadCard`, `KanbanBoard`, `LeadDetailPage`, `crm/components/CRMDashboard`.
- **Hooks:** `useLeads`, `useLead`, `useFollowup`, `usePipelineStages`, `useLeadsByStage`, `useMoveLeadStage`.
- **Services:** `leadService`, `followupService`, `pipelineService`, `crmCenterService`.

### B. `crm-engine` system
- **Purpose:** legacy/derived dashboard layer with hardcoded stats and an in-memory follow-up helper.
- **Database tables:** none for its own stats; it does not own persistence.
- **Routes:** `/customers`.
- **Components:** `crm-engine/components/CRMDashboard`.
- **Hooks:** `useCRMEngine`.
- **Services:** `crm-engine/services/followup-service` (in-memory).

### C. Customer system
- **Purpose:** purchased-customer record management.
- **Database tables:** `customer`.
- **Routes:** `/crm/customers`, `/crm/customers/[id]`.
- **Components:** `src/app/(auth)/crm/customers/page.tsx`.
- **Hooks:** inline `useCustomers`.
- **Services:** direct Prisma in route handlers.

## 3) CRM Dependency Graph

```text
/crm
  ├─ LeadTable / LeadCard / AddLeadDialog
  ├─ useLeads / useLead / useTags
  └─ leadService / tagService / scoring-service
       └─ prisma.lead / prisma.tag / activity

/crm/pipeline
  ├─ KanbanBoard / StageManagerDialog
  ├─ usePipelineStages / useLeadsByStage / useMoveLeadStage
  └─ pipelineService / leadService
       └─ prisma.pipelineStage / prisma.lead

/crm/customers
  ├─ useCustomers (local page hook)
  └─ direct Prisma routes
       └─ prisma.customer

/crm-center
  ├─ crm/components/CRMDashboard
  ├─ useCRM() -> /api/v1/crm-center
  └─ crmCenterService
       └─ prisma.lead / prisma.customer / prisma.activity

/customers
  ├─ crm-engine/components/CRMDashboard
  └─ useCRMEngine
       └─ static stats + in-memory follow-up items
```

## 4) Route Audit

| Route | Route File | Rendered Component | Hook | Service | Database Table |
|---|---|---|---|---|---|
| `/customers` | `src/app/(auth)/customers/page.tsx` | `crm-engine/components/CRMDashboard` | `useCRMEngine` | `crm-engine/hooks/useCRMEngine`, `crm-engine/services/followup-service` | none for the dashboard stats |
| `/customers/[id]` | not present | N/A | N/A | N/A | N/A |
| `/crm` | `src/app/(auth)/crm/page.tsx` | `LeadTable` / `LeadCard` / `AddLeadDialog` | `useLeads`, `useTags` | `leadService`, `tagService` | `lead`, `tag` |
| `/crm/[id]` | `src/app/(auth)/crm/[id]/page.tsx` | lead detail view | `useLead`, `useLeadAnalysis`, `useWhatsAppReply` | `leadService`, `followupService`, `activity-service` | `lead`, `activity`, `note`, `followup` fields |
| `/crm/pipeline` | `src/app/(auth)/crm/pipeline/page.tsx` | `KanbanBoard` | `usePipelineStages`, `useLeadsByStage`, `useMoveLeadStage` | `pipelineService`, `leadService` | `pipelineStage`, `lead.pipelineStage` |
| `/crm/customers` | `src/app/(auth)/crm/customers/page.tsx` | customer list page | `useCustomers` (inline) | direct Prisma in route handlers | `customer` |
| `/crm-center` | `src/app/(auth)/crm-center/page.tsx` | `crm/components/CRMDashboard` | `useCRM` | `crmCenterService` | `lead`, `customer`, `activity` |

## 5) Dashboard Integration Audit

### Can Dashboard read CRM?
**YES.**

### Exact paths
- `src/modules/dashboard/hooks/useDashboardMission.ts` pulls quick stats from `/api/v1/team/summary`.
- `src/modules/team/services/team-service.ts` computes `totalLeads` and `totalConversions` from `prisma.lead`.
- `src/modules/dashboard/components/DashboardV4.tsx` renders `RoadmapProgressSummary`, `ActivationDashboard`, `RevenueProgress`, `UnlockPreview`, and AI Coach text, so Dashboard is not isolated from CRM state.
- `src/app/api/v1/ai/coach/recommend/route.ts` reads `prisma.lead`, `prisma.content`, `prisma.dailyAction`, and `prisma.funnel` and returns CRM-tied recommendations.

### Important note
- Dashboard reads CRM indirectly through aggregates, not through a single CRM projection.
- That means Dashboard can drift from the CRM pages if the underlying aggregates do not match the page-specific query logic.

## 6) Lead → CRM Flow Audit

### Answer
**PARTIAL**

### Evidence
- Automatic path exists: `src/app/api/v1/public/funnel/[slug]/submit/route.ts` creates a `prisma.lead` row directly with `pipelineStage: 'new'`.
- Internal/manual path exists: `src/modules/crm/services/lead-service.ts` creates leads through `/api/v1/crm/leads`.
- `src/app/api/v1/lead-magnet/generate/route.ts` only emits mission progress; it does not create CRM records.

### Conclusion
- Public funnel submissions are automatic lead creation.
- General CRM lead creation is still manual when done inside the app.

## 7) CRM → Sales Audit

### Answer
**NOT CONNECTED**

### Evidence
- There is no `prisma.opportunity` write path and no `opportunityService`.
- `src/modules/sales-engine/services/revenue-service.ts` is a pure calculator with default/static numbers.
- `src/modules/crm/crmCenterService.ts` synthesizes “opportunities” from `prisma.customer.metadata`, but that is a read projection, not a real sales record writer.
- `src/app/api/v1/crm/leads/[id]/route.ts` only calls `notifyMissionProgress(user, 'first_sale_completed')` when a lead moves to converted; it does not create a Sales record.

## 8) Customer Truth Audit

### Answer
**Single Source**

### Ownership
- **Database table:** `customer`
- **Service:** `src/app/api/v1/crm/customers/route.ts` and `src/app/api/v1/crm/customers/[id]/route.ts`
- **Hook:** `useCustomers` in `src/app/(auth)/crm/customers/page.tsx`
- **UI component:** `src/app/(auth)/crm/customers/page.tsx`

### Caveat
- Customer records are a single table, but customer-adjacent context is split:
  - lead pipeline state lives in `lead.pipelineStage`
  - follow-up lives in `lead.nextFollowup`
  - opportunity-like projection is derived from `customer.metadata`

## 9) Conflict Analysis

### Can CRM surfaces disagree?
**YES.**

### Exact conflict paths
1. `/customers` uses `crm-engine/components/CRMDashboard`, which reads `useCRMEngine()` and shows hardcoded/static stats plus in-memory follow-up counts.
2. `/crm-center` uses `crm/components/CRMDashboard`, which reads `crmCenterService` and live Prisma tables.
3. `/crm` and `/crm/pipeline` read live leads and pipeline stages through `leadService` and `pipelineService`.
4. `src/app/api/v1/crm/stats/route.ts` computes counts from `prisma.lead` with role-based owner filters, so its totals can differ from `crmCenterService`, which also considers `customer` and `activity`.

### Example disagreement
- Static CRM engine: `useCRMEngine()` returns fixed pipeline values like `new: 52`.
- Live CRM center: `crmCenterService` computes lead counts, hot leads, opportunities, and follow-ups from the database.
- Those two surfaces can never be authoritative at the same time.

## 10) Production Truth

| What it controls | Database table | Service | Hook | Route |
|---|---|---|---|---|
| Customers | `customer` | direct Prisma in `src/app/api/v1/crm/customers/*` | `useCustomers` | `/crm/customers` |
| Pipeline | `lead.pipelineStage` + `pipelineStage` | `leadService`, `pipelineService` | `usePipelineStages`, `useLeadsByStage`, `useMoveLeadStage` | `/crm/pipeline` |
| Follow-Ups | `lead.nextFollowup` + activity log | `followupService` | `useFollowupCounts`, `useFollowups`, `useSetFollowup` | `/api/v1/crm/followups`, lead detail |
| Opportunities | `customer.metadata` projection | `crmCenterService` | `useCRM()` in `crm/components/CRMDashboard.tsx` | `/crm-center` |
| Customer Status | `customer.status` | direct Prisma in customer routes | inline `useCustomers` mutation | `/crm/customers` |

## 11) Single Source Of Truth Recommendation

| System | Recommendation | Reason |
|---|---|---|
| `leadService` | **KEEP** | It owns live lead CRUD and is the core operational CRM |
| `followupService` | **KEEP** | It owns follow-up reads/writes against `lead.nextFollowup` |
| `pipelineService` | **KEEP** | It owns pipeline stage metadata |
| `crmCenterService` | **KEEP / MERGE** | Best read-projection over CRM data; should become the primary CRM dashboard projection |
| `crm` UI and `/crm/*` routes | **KEEP** | These are the live operational surfaces |
| `customer` routes | **KEEP** | Customer table is a real separate entity |
| `crm-engine/components/CRMDashboard.tsx` | **MERGE** | Should be folded into the live CRM projection or removed as a separate authority |
| `crm-engine/hooks/useCRMEngine.ts` | **REMOVE** | Static stats are not a trustworthy source of CRM truth |
| `crm-engine/services/followup-service.ts` | **REMOVE** | In-memory follow-up state is not production truth |

### Final recommendation
- The CRM should be treated as a two-entity domain:
  - `lead` for pipeline, follow-up, and conversion progress
  - `customer` for purchased customer records
- The single read surface should be `crmCenterService` over those tables.
- The static `crm-engine` layer should stop acting like a second CRM.

## Final Answers

### Question 1
**D. Multiple conflicting systems**

Evidence:
- `/crm` is the live CRUD CRM.
- `/crm-center` is the live command-center CRM projection.
- `/customers` is a legacy/static CRM-engine dashboard.
- Those three surfaces do not share one authority.

### Question 2
**Customer data is owned by `customer`.**

| Field | Value |
|---|---|
| Database table | `customer` |
| Service | `/api/v1/crm/customers/*` |
| Hook | `useCustomers` |
| UI | `/crm/customers` |

### Question 3
**Is Lead → CRM automatic? PARTIAL**

Evidence:
- Automatic through public funnel submission: `src/app/api/v1/public/funnel/[slug]/submit/route.ts`
- Manual inside app: `src/modules/crm/services/lead-service.ts`

### Question 4
**Is CRM → Sales automatic? NO**

Evidence:
- No `opportunity` table writer.
- Sales engine is computed from defaults/static values.
- CRM only triggers mission progress on conversion; it does not create a sales record.

### Question 5
**What should become the CRM Single Source Of Truth?**

| Database table | Service | Reason |
|---|---|---|
| `lead` + `customer` as the CRM domain, with `crmCenterService` as the read projection | `crmCenterService` | It is the only place that already unifies live leads, customers, follow-ups, opportunities, and forecast data into one operational view |
