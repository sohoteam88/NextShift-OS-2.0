# System Map

This map tells a new AI window where to look before acting.

## Authority Chain

```text
Governance
  -> Foundation
  -> Constitution
  -> Reference Architecture
  -> Architecture
  -> Contracts
  -> Specifications
  -> Interfaces
  -> Implementation
  -> Source Code
```

Higher layers override lower layers. Source code is not the highest authority.

## Core Intelligence Loop

```text
Observe
  -> Understand
  -> Reason
  -> Recommend
  -> Discuss
  -> Decide
  -> Execute
  -> Measure
  -> Reflect
  -> Learn
  -> Improve
```

Every AI or product proposal should strengthen this loop.

## Permanent Cognitive Systems

- Business Brain
- Decision Brain
- Execution Layer
- Learning System

The Business Twin is the single source of business understanding. Do not introduce a competing business truth.

## Repository Folders

| Folder | Purpose |
| --- | --- |
| `docs/nextshift-os-3` | Canonical architecture, governance, capability, and engineering docs |
| `packages` | Frozen/approved Core Runtime packages plus shared package work |
| `src/app` | Next.js app routes and API routes |
| `src/modules` | Product feature modules and services |
| `src/components` | Reusable UI components |
| `src/messages` | Locale messages |
| `skills` | Repo-specific AI skills |
| `audit` | Independent audit reports and risk reviews |

## Runtime Packages

Dependency direction:

```text
shared
  -> contracts
  -> domain
  -> event-bus
  -> business-brain
  -> decision-brain
  -> execution-layer
  -> learning-system
  -> application
  -> agents
  -> capability-layer
```

New business capabilities should depend on the Core Runtime and must not redefine runtime responsibilities.

## Engineering Build Order

For capabilities, build from the inside out:

```text
Domain
  -> Contracts
  -> Application
  -> Business Brain
  -> Events
  -> API
  -> UI
```

Do not start with UI when implementing business capabilities.

## Major Product Surfaces

User-facing and admin routes live under `src/app`.

Important route groups include:

- `src/app/(auth)/dashboard`
- `src/app/(auth)/mission`
- `src/app/(auth)/ai`
- `src/app/(auth)/ai-workforce`
- `src/app/(auth)/crm`
- `src/app/(auth)/content-engine`
- `src/app/(auth)/brand-builder`
- `src/app/(auth)/platform-admin`
- `src/app/api/v1`

## Major Runtime/Product Modules

Important module groups include:

- `src/modules/mission-engine`
- `src/modules/mission-workspace`
- `src/modules/agent-runtime`
- `src/modules/agent-workforce`
- `src/modules/ai-coo`
- `src/modules/business-state`
- `src/modules/business-context-memory`
- `src/modules/crm`
- `src/modules/content-engine`
- `src/modules/analytics`
- `src/modules/revenue-*`
- `src/modules/dashboard`

Read the relevant module before editing.

## Existing Repo Skills

Core skills include:

- `skills/core/business-operating-system-architect`
- `skills/core/nextshift-os-architect`
- `skills/core/design-system-architect`
- `skills/core/deployment-engineer`
- `skills/core/security-auditor`

AI skills include:

- `skills/ai/ai-agent-orchestrator`
- `skills/ai/ai-coach`
- `skills/ai/ai-content-generator`
- `skills/ai/ai-funnel-generator`
- `skills/ai/ai-lead-scoring`

Before creating a skill, search the existing `skills` folder.
