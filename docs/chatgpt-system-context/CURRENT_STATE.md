# Current State

This is the high-signal state snapshot for new AI windows.

## Project

NextShift is an AI Guided Business Operating System for entrepreneurs. It helps users understand, decide, execute, measure, reflect, learn, and improve their business.

NextShift is not merely:

- AI writer
- CRM
- Funnel builder
- Marketing automation tool
- Chatbot

Those are execution capabilities inside the larger operating system.

## Architecture Status

- Blueprint: frozen and approved.
- Core Runtime: frozen and approved.
- Core Runtime version: `v0.1.0-alpha`.
- Runtime audit score: `97 / 100`.
- Blueprint score: `95 / 100`.
- Development epoch: business capability development.

Frozen runtime packages:

- `@nextshift/shared`
- `@nextshift/contracts`
- `@nextshift/domain`
- `@nextshift/event-bus`
- `@nextshift/business-brain`
- `@nextshift/decision-brain`
- `@nextshift/execution-layer`
- `@nextshift/learning-system`
- `@nextshift/application`
- `@nextshift/agents`
- `@nextshift/capability-layer`

Architectural changes to frozen layers require the RFC process.

## Engineering Governance

Current source of truth:

- `docs/nextshift-os-3/engineering/ENGINEERING_PLAYBOOK.md`
- Latest verified release: `Engineering Playbook v1.2`
- Release commit: `6dec2e4 docs(engineering): release engineering playbook v1.2`
- Audit commit: `f442e4a audit(engineering): verify engineering playbook v1.2`
- Approved branch evidence: `planning/os-3.3-runtime-platform`
- v1.2 status: `Approved`, audit `PASS`

Be branch-aware: if a branch or remote still shows an older playbook version, that branch has not incorporated the v1.2 authority yet. Sync, switch, or inspect the target branch before advising.

Mandatory lifecycle:

```text
Planning -> Implementation -> Verification -> Audit -> Release
```

Required capability/slice evidence:

- Build Specification
- Implementation Tasks
- Implementation Report
- Verification Checklist
- Audit
- Release Notes

## Capabilities

Current authoritative status file:

- `docs/nextshift-os-3/CAPABILITY_STATUS.md`

Portfolio snapshot:

| Capability | Version | Progress | Lifecycle |
| --- | --- | ---: | --- |
| CAP-001 Business Profile | 1.0 | 7 / 7 | Frozen |
| CAP-002 CRM | 1.0 | 8 / 8 | Released |
| CAP-003 Content | 1.0 | 8 / 8 | Released |
| CAP-004 Campaign | 1.0 | 5 / 5 | Released |
| CAP-005 Revenue | - | 3 / ? | Implementation |
| CAP-006 Analytics | - | 0 / ? | Planned |
| CAP-007 AI Coach | - | 0 / ? | Planned |

Current engineering focus:

```text
CAP-005 S-004 Implementation
```

## Platform Projects

- NextShift Design System v1.0: released.
- NextShift UI Kit v1.0: planning.

## Codebase

Stack:

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Supabase
- Prisma
- Vitest
- Playwright
- OpenAI, Anthropic, Google Generative AI SDKs

Common checks:

```bash
pnpm type-check
pnpm test
pnpm build
```

Use targeted checks when the change is narrow.
