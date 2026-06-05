# 20 — Development Roadmap

> Phased delivery plan for NextShift OS from MVP to full platform.

---

## 1. Purpose

Define a realistic, prioritized build order that delivers usable value at each phase while building toward the complete system.

---

## 2. Guiding Principles

1. **Validate manually before automating** — prove the workflow works with real users first
2. **Ship a usable slice** — each phase is deployable and useful on its own
3. **Core before chrome** — data model and API before fancy UI
4. **One tenant first** — build for Steven's team, then generalize multi-tenant

---

## 3. Phase Overview

| Phase | Name | Duration | Goal |
|-------|------|----------|------|
| 0 | Foundation | 2 weeks | Project setup, auth, DB, deploy pipeline |
| 1 | CRM Core | 3 weeks | Leads, pipeline, scoring, follow-up — the daily workhorse |
| 2 | AI Engine | 2 weeks | Content generation, WhatsApp reply, lead analysis |
| 3 | Funnel Builder | 2 weeks | Landing pages, lead capture, WhatsApp CTA |
| 4 | Member System | 2 weeks | Onboarding, daily actions, training progress |
| 5 | Team & Admin | 2 weeks | Sponsor tree, leader dashboard, admin panel |
| 6 | Analytics & Voice | 2 weeks | Dashboards, voice capture, reporting |
| 7 | Multi-tenant | 2 weeks | Tenant onboarding, plan limits, subdomain routing |
| 8 | Polish & Launch | 2 weeks | Mobile optimization, performance, docs, soft launch |

**Total estimated: ~17 weeks** (adjustable based on team capacity)

---

## 4. Phase Details

### Phase 0 — Foundation (Weeks 1–2)

| Task | Deliverable | Architecture ref |
|------|-------------|-----------------|
| Next.js project scaffold | Repo with folder structure per `04_MODULE_ARCHITECTURE.md` | 04 |
| Prisma schema + migrations | All core tables created | 07 |
| Supabase Auth integration | Login, register, JWT middleware | 17 |
| RBAC middleware | Role-checking middleware + RLS policies | 05 |
| Docker + docker-compose | Dev + prod configs | 18 |
| Nginx + SSL | Production domain live | 18 |
| CI pipeline | Lint + type-check + test + build on PR | 19 |
| Design system base | Tailwind config, tokens, Button/Input/Badge components | 14 |
| i18n setup | next-intl configured, zh/en/ms base files | 15 |
| App shell | Sidebar + TopBar + layout | 14 |

**Exit criteria:** User can register, login, see empty dashboard with sidebar nav.

---

### Phase 1 — CRM Core (Weeks 3–5)

| Task | Deliverable | Architecture ref |
|------|-------------|-----------------|
| Lead CRUD API | Create, read, update, delete leads | 08, 10 |
| Lead list page | Filterable, sortable table with search | 10, 14 |
| Lead detail page | Info, notes, activity timeline, tags | 10 |
| Pipeline board | Kanban drag-drop with stage management | 10 |
| Lead scoring engine | Rule-based auto-scoring on data changes | 10 |
| Follow-up reminders | Scheduled reminder system + UI indicator | 10, 12 |
| Notes & activity log | Add notes, log activities (call, meeting, WhatsApp) | 10 |
| Tags system | Create, assign, filter by tags | 10 |

**Exit criteria:** User can manage leads end-to-end, drag through pipeline, see scores update.

---

### Phase 2 — AI Engine (Weeks 6–7)

| Task | Deliverable | Architecture ref |
|------|-------------|-----------------|
| AI provider adapter | Anthropic + OpenAI switchable interface | 09 |
| Prompt template system | CRUD for templates with variable resolution | 09 |
| AI Content Generator | Generate social posts from lead/member data | 09 |
| AI WhatsApp Reply | Suggest reply based on conversation context | 09 |
| AI Lead Analysis | Summarize lead profile + suggest next action | 09 |
| AI usage tracking | Per-tenant quota + usage log | 09 |
| AI prompt panel component | Template selector + generate + output UI | 09, 14 |

**Exit criteria:** User can generate content and WhatsApp replies via AI; usage tracked against quota.

---

### Phase 3 — Funnel Builder (Weeks 8–9)

| Task | Deliverable | Architecture ref |
|------|-------------|-----------------|
| Funnel template system | Predefined templates (landing, quiz, lead_magnet) | 11 |
| Funnel editor | Section-based editor with preview | 11 |
| Funnel renderer (public) | SSR public pages at tenant subdomain | 11 |
| Lead capture form | Form submission → CRM lead creation | 11, 10 |
| WhatsApp CTA | Click-to-WhatsApp with pre-filled message | 11 |
| AI funnel copy generator | Generate headline, subheadline, CTA from brief | 09, 11 |
| Funnel analytics | View count, submission count, conversion rate | 11, 13 |

**Exit criteria:** User can create a funnel page, publish it, capture leads that appear in CRM.

---

### Phase 4 — Member System (Weeks 10–11)

| Task | Deliverable | Architecture ref |
|------|-------------|-----------------|
| Member registration flow | Invite link → register → pending approval | 04 |
| Onboarding wizard | Multi-step setup (profile, goals, preferences) | 04, 14 |
| Daily action plan | Configurable daily checklist with tracking | 04 |
| Training module | Training content list + progress tracking | 04 |
| Member dashboard | Personal stats, action items, recent activity | 14 |
| Content task system | Assigned content tasks with status | 04 |

**Exit criteria:** New member can complete onboarding, follow daily actions, track training progress.

---

### Phase 5 — Team & Admin (Weeks 12–13)

| Task | Deliverable | Architecture ref |
|------|-------------|-----------------|
| Sponsor tree data model | Parent-child user relationships | 03, 04 |
| Team tree visualization | Hierarchical org chart component | 14 |
| Leader dashboard | Downline activity, performance summary | 13, 14 |
| Member approval workflow | Operator/leader approves pending members | 05 |
| Admin: user management | List, edit roles, deactivate users | 05 |
| Admin: template management | Manage funnel + AI prompt templates | 09, 11 |
| Admin: CRM settings | Pipeline stages, scoring rules, tags | 10 |

**Exit criteria:** Leader can see team, approve members; operator can manage all admin settings.

---

### Phase 6 — Analytics & Voice (Weeks 14–15)

| Task | Deliverable | Architecture ref |
|------|-------------|-----------------|
| Member analytics dashboard | Personal lead funnel, conversion, AI usage | 13 |
| Leader analytics dashboard | Team performance, activity heatmap | 13 |
| Operator analytics dashboard | Tenant-wide metrics, growth trends | 13 |
| Voice recorder component | Browser audio recording with waveform | 16 |
| Whisper transcription integration | Audio → text pipeline | 16 |
| AI profile extraction | Transcript → structured profile JSON | 16, 09 |
| Voice profile review UI | Edit extracted fields, approve, sync | 16 |

**Exit criteria:** Analytics dashboards populated with real data; voice capture end-to-end working.

---

### Phase 7 — Multi-tenant (Weeks 16–17)

| Task | Deliverable | Architecture ref |
|------|-------------|-----------------|
| Tenant onboarding flow | Sign up → create tenant → configure | 06 |
| Subdomain routing | `{slug}.nextshift.my` resolution | 06 |
| Plan tier enforcement | Starter/Growth/Pro limits on members, AI, storage | 06 |
| Tenant settings page | Operator configures tenant name, logo, defaults | 06 |
| Cross-tenant isolation testing | Automated tests verifying RLS | 06, 17 |

**Exit criteria:** Second tenant can sign up independently and use the platform in isolation.

---

### Phase 8 — Polish & Launch (Weeks 18–19)

| Task | Deliverable |
|------|-------------|
| Mobile responsiveness pass | All screens tested at 375px |
| Performance audit | Lighthouse score > 80 on all pages |
| Error handling review | All edge cases have user-friendly messages |
| i18n completion | All strings translated in zh/en/ms |
| Security audit | OWASP top 10 check, dependency audit |
| User documentation | Basic help pages / tooltips |
| Soft launch | Invite 5–10 operators for beta testing |

---

## 5. Post-Launch Priorities

| Priority | Feature | Phase |
|----------|---------|-------|
| 1 | WhatsApp Business API integration (send/receive) | Post-launch |
| 2 | AI Coach (conversational coaching assistant) | Post-launch |
| 3 | Mobile PWA (installable app) | Post-launch |
| 4 | Automated email sequences (Resend) | Post-launch |
| 5 | Tenant billing integration (Stripe / local payment) | Post-launch |
| 6 | AI avatar video generation (HeyGen) | Post-launch |
| 7 | Advanced analytics (cohort analysis, LTV prediction) | Post-launch |

---

## 6. Risks / Tradeoffs

| Risk | Mitigation |
|------|------------|
| Scope creep per phase | Each phase has clear exit criteria; defer extras to next phase |
| AI API costs during development | Use smaller models / cached responses in dev; track spending weekly |
| Single developer bottleneck | Architecture docs enable AI coworker to work in parallel |
| User feedback changes priorities | Soft launch before Phase 8 is fully polished; iterate based on real feedback |

---

**Cross-references:** All architecture documents. Each phase references specific architecture files for implementation guidance.
