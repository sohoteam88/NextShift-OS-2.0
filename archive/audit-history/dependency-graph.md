# NextShift OS — Dependency Graph

**Date:** 2026-06-15
**Scope:** Full codebase module + API dependency map

---

## 1. Module Dependency Matrix

| Module | Depends On | Depended By |
|---|---|---|
| **auth** | *(none)* | admin, ai, analytics, brand-builder, crm, member, mission, team, video, voice (10) |
| **funnel** | ai, auth, brand-dna, tenant | admin, ai, funnel-builder†, funnel-context†, funnel-os†, member, tenant, app (57 refs) |
| **ai** | auth, crm, funnel, mission, saas | admin, brand-builder, member, video, voice, app (34 refs) |
| **admin** | ai, auth, team, tenant | app (52 refs) |
| **crm** | auth, brand-dna | ai, app (37 refs) |
| **brand-dna** | brand-discovery | analytics, blueprints, brand-builder, content-engine, crm, funnel, lead-magnet, social-setup, traffic-engine, video, video-production, webinar-center, whatsapp-ai, app (13) |
| **brand-builder** | ai, auth, brand-dna, video, voice | dashboard, video, app (41 refs) |
| **member** | ai, auth, funnel | team, app (35 refs) |
| **tenant** | ai, funnel | admin, app (11 refs) |
| **team** | auth, member | admin, analytics, app (7 refs) |
| **mission** | auth | mission-engine, ai, video, app (31 refs) |
| **mission-engine** | auth, mission | dashboard, app (4 refs) |
| **video** | ai, auth, brand-builder, brand-dna, mission | brand-builder, app (13 refs) |
| **voice** | ai, auth | brand-builder, app (8 refs) |
| **analytics** | auth, brand-dna, team | app (9 refs) |
| **blueprints** | brand-dna, funnel | *(app only)* |
| **saas** | *(none)* | ai, payments |
| **i18n** | *(none)* | *(app only)* |
| **dashboard** | brand-builder, mission-engine | *(app only)* |
| **payments** | saas | *(app only)* |

† = Deprecated stubs (re-export to canonical funnel/ module)

---

## 2. Visual Dependency Graph

```
                                ┌──────────┐
                                │   auth   │ ← ZERO dependencies (leaf module)
                                └────┬─────┘
                                     │ imports from auth
          ┌──────────────┬───────────┼───────────┬──────────────┐
          ▼              ▼           ▼           ▼              ▼
    ┌──────────┐  ┌──────────┐ ┌──────────┐ ┌──────────┐  ┌──────────┐
    │  admin   │  │  member  │ │ mission  │ │   crm    │  │  video   │
    │          │  │          │ │          │ │          │  │          │
    └────┬─────┘  └────┬─────┘ └────┬─────┘ └────┬─────┘  └────┬─────┘
         │             │            │            │             │
         │        ┌────┴────┐  ┌───┴────┐       │        ┌────┴────┐
         │        │  team   │  │mission │       │        │  voice  │
         │        └─────────┘  │engine  │       │        └─────────┘
         │                     └────────┘       │
         │                                      │
    ┌────┴──────────────────────────────────────┴──────────────────┐
    │                        brand-dna                             │
    │  (depended by 13 modules — most referenced domain entity)    │
    └────┬─────────────────────────────────────────────────────────┘
         │
    ┌────┴──────────────────────────────┐
    │         brand-builder             │
    │   (imports ai, auth, brand-dna)   │
    └───────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────┐
    │                        funnel                               │
    │  imports: ai, auth, brand-dna, tenant                       │
    │  depended by: 10 modules + 57 app references                │
    │  (contains: funnel-builder†, funnel-context†, funnel-os†)   │
    └──────────────────────┬──────────────────────────────────────┘
                           │
    ┌──────────────────────┴──────────────────────────────────────┐
    │                          ai                                 │
    │  imports: auth, crm, funnel, mission, saas                  │
    │  depended by: 5 modules                                     │
    │  (contains: ai-router†, ai-agents†)                         │
    └─────────────────────────────────────────────────────────────┘

                            ┌──────────┐
                            │  tenant  │
                            │ imports: │
                            │  ai,     │
                            │  funnel  │
                            └──────────┘

┌──────────────────┐
│  Leaf Modules     │
│  (no inbound     │
│   deps from      │
│   other modules) │
│                  │
│  auth            │
│  saas            │
│  i18n            │
│  franchise       │
│  automation      │
│  localization    │
└──────────────────┘
```

---

## 3. Key Architecture Insights

### Most Referenced (Hub Modules)

| Rank | Module | Inbound Refs | Role |
|---|---|---|---|
| 1 | **auth** | 10 modules + 217 app refs | Authentication backbone |
| 2 | **brand-dna** | 13 modules | Brand data source of truth |
| 3 | **funnel** | 10 modules + 57 app refs | Business domain hub |
| 4 | **ai** | 5 modules + 34 app refs | Intelligence layer |

### Leaf Modules (Zero Dependencies)

`auth`, `saas`, `i18n`, `franchise`, `automation`, `localization` — these are foundational utilities with no cross-module dependencies.

### Clean Architecture Properties

| Property | Status |
|---|---|
| Circular dependencies | ✅ None |
| Deprecated stubs active | ✅ Zero external references |
| Max dependency depth | 3 (brand-builder → ai → crm → brand-dna → brand-discovery) |
| Unified domains | ✅ funnel (merged 4→1), ai (merged 3→1) |

---

## 4. App Layer → Module Heatmap

```
App Pages (by module reference count)
─────────────────────────────────────
auth              ████████████████████████████████████████ 217
funnel            ████████████████ 57
admin             ██████████████ 52
brand-builder     ███████████ 41
crm               ██████████ 37
member            █████████ 35
ai                █████████ 34
mission           ████████ 31
video             ███ 13
tenant            ██ 11
analytics         ██ 9
voice             ██ 8
team              █ 7
brand-dna         █ 5
mission-engine    █ 4
content-engine    █ 4
brand-discovery   █ 4
whatsapp-ai       █ 3
webinar-center    █ 3
video-production  █ 3
```

---

## 5. API Route Dependencies

```
/api/v1/funnel/*        → funnel module (CRUD, templates, analytics, health)
/api/v1/ai/*            → ai module (content gen, lead analysis, funnel builder)
/api/v1/crm/*           → crm module (leads, customers, tags, pipeline)
/api/v1/admin/*         → admin module (users, settings, override, training)
/api/v1/member/*        → member module (onboarding, daily actions, training)
/api/v1/auth/*          → auth module (login, register, me)
/api/v1/brand-builder/* → brand-builder module (wizard, interview, profile)
/api/v1/team/*          → team module (dashboard, members, summary)
/api/v1/video/*         → video module (projects, script, production)
/api/v1/voice/*         → voice module (upload, approve)
/api/v1/platform-admin/*→ admin module (stats, tenants, health)
/api/v1/public/*        → funnel module (public funnel view/submit)
```

---

## 6. Post-Consolidation Architecture

```
V3 (Original)              V4–V5 (Consolidated)        V6 (Final)
─────────────────          ─────────────────────        ──────────
funnel/                    funnel/   ← unified          funnel/
funnel-builder/  ──────┐   (4→1)                       (clean)
funnel-context/  ──────┤                              ai/
funnel-os/       ──────┘                              (clean)

ai/                        ai/      ← unified
ai-router/      ──────┐   (3→1)
ai-agents/       ──────┘

7 modules                  2 unified domains           2 domains
30 cross-imports           0 cross-imports             0 cross-imports
```

---

## 7. Risk Areas

| Area | Risk | Severity |
|---|---|---|
| `brand-dna` → 13 consumers | High blast radius if schema changes | 🟡 Medium |
| `auth` → 217 app refs | Every page depends on auth | 🟢 Low (stable) |
| `funnel` → `ai` dependency | Tight coupling for AI-powered features | 🟡 Medium |
| `tenant` → `ai` + `funnel` | Tenant module depends on both major domains | 🟡 Medium |
| Leaf modules abandoned | `franchise`, `automation`, `localization` have 0 consumers | 🟢 Low |
