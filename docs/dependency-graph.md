# Dependency Graph — NextShift OS V3

Date: 2026-06-12

## Module Dependency Map

```
                    ┌─────────────────┐
                    │   Auth Service  │
                    │ (requireAuthApi)│
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌──────────┐   ┌──────────┐   ┌──────────┐
      │ Mission  │   │  Brand   │   │  Prisma  │
      │ Engine   │   │ Discovery │   │  Models  │
      └────┬─────┘   └────┬─────┘   └────┬─────┘
           │              │              │
           │   ┌──────────┘              │
           ▼   ▼                         │
      ┌──────────────┐                   │
      │Brand DNA     │                   │
      │(BrandContext │                   │
      │ Provider)    │                   │
      └──────┬───────┘                   │
             │                           │
    ┌────────┼────────┬────────┐         │
    ▼        ▼        ▼        ▼         │
┌────────┐┌──────┐┌──────┐┌────────┐    │
│Social  ││Content││Video ││Lead    │    │
│Setup   ││Engine ││Prod. ││Magnet  │    │
└───┬────┘└──┬───┘└──┬───┘└───┬────┘    │
    │        │       │        │         │
    └────────┼───────┼────────┘         │
             ▼       ▼                  │
        ┌──────────────┐                │
        │   Webinar    │                │
        │   Center     │                │
        └──────┬───────┘                │
               ▼                        │
        ┌──────────────┐                │
        │Funnel Builder│                │
        │    2.0       │                │
        └──────┬───────┘                │
               ▼                        │
        ┌──────────────┐                │
        │Traffic Engine│                │
        └──────┬───────┘                │
               ▼                        │
        ┌──────────────┐                │
        │ WhatsApp AI  │                │
        │  Assistant   │                │
        └──────┬───────┘                │
               ▼                        │
        ┌──────────────┐                │
        │     CRM      │◄───────────────┘
        │(Revenue Cmd) │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │  Analytics   │ (read-only aggregation)
        │ Intelligence │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │    Admin     │
        │   Command    │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │  SaaS Layer  │
        │  (monetize)  │
        └──────────────┘
```

## Shared Dependencies

| Dependency | Consumers |
|------------|-----------|
| `getBrandContext()` | 11 modules (Social, Content, Video, LeadMagnet, Webinar, Funnel, Traffic, WhatsApp, CRM, Analytics, Admin) |
| `prisma` | All modules (database access) |
| `apiHandler` | 95% of API routes |
| `requireAuthApi` | 95% of API routes |
| `notifyMissionProgress` | 7 generate routes |
| `@/lib/cn` | All components (className utility) |
| `@tanstack/react-query` | All components (data fetching) |

## Circular Dependencies

**None detected.** All dependencies flow downward:
- Mission Engine depends on nothing except Auth + Prisma
- Each downstream module depends on BrandContextProvider + optionally the module above it
- Analytics is a read-only leaf that aggregates all modules
- No module imports from a consumer of its own exports

## Module Weight (Files)

| Module | Files | Lines (approx) |
|--------|-------|----------------|
| brand-builder (legacy) | 34 | ~5,000 |
| mission | 12 | ~1,500 |
| brand-dna | 7 | ~1,200 |
| analytics (admin) | 8 | ~800 |
| crm | 6 | ~600 |
| content-engine | 5 | ~500 |
| video-production | 4 | ~450 |
| funnel-builder | 5 | ~400 |
| brand-discovery | 5 | ~400 |
| social-setup | 5 | ~350 |
| traffic-engine | 5 | ~350 |
| whatsapp-ai | 4 | ~300 |
| lead-magnet | 5 | ~300 |
| webinar-center | 4 | ~250 |
| saas | 4 | ~250 |
| admin (command center) | 3 | ~300 |
