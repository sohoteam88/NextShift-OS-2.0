# Business Foundation v1.0 Execution Task

Version: 1.0

Status: Stop A Ready

Last Updated: 2026-07-08

---

## Task

Implement Business Foundation v1.0 according to the approved implementation contract.

---

## Branch

Use the current OS 3.3 runtime platform branch:

```text
planning/os-3.3-runtime-platform
```

---

## Implementation Steps

1. Inspect Business Architecture v1.0, especially Business Foundation Architecture and Dependency Map.
2. Inspect existing domain, application, contract, and workflow patterns before editing.
3. Define Business Foundation domain primitives for the ten required areas.
4. Implement Business Twin as the root business context.
5. Implement Brand DNA linked to the Business Twin.
6. Implement Personal Knowledge Graph primitives with source attribution.
7. Implement Story Vault records linked to brand and knowledge context.
8. Implement Business Memory, Content Memory, and Customer Memory records.
9. Implement Business Timeline records for dated foundation events.
10. Implement Learning Foundation records linked to outcomes and evidence.
11. Implement Reflection Foundation records linked to memories and learning.
12. Add application services and contract exports following existing repository patterns.
13. Add targeted domain and application tests.
14. Run required validation.
15. Stop after implementation reporting.

---

## Required Workstreams

Implement only Business Foundation v1.0:

- Business Twin
- Brand DNA
- Personal Knowledge Graph
- Story Vault
- Business Memory
- Content Memory
- Customer Memory
- Business Timeline
- Learning Foundation
- Reflection Foundation

---

## Explicit Non-Goals

Do not implement:

- Business Brain
- Decision Engine
- Conversation Engine
- Creative Studio
- Growth & Revenue
- autonomous AI behavior
- creative generation
- campaign or revenue workflows
- UI screens
- database migrations
- deployment behavior
- generated context-package changes
- generated ZIP artifacts as tracked files

---

## Required Commands

Run:

```bash
git diff --check
git diff --cached --check
```

For code implementation, also run the targeted package tests and type checks identified by the Stop B task.

If documentation links or navigation are changed, also run:

```bash
pnpm docs:links
pnpm docs:navigation
```

---

## Return Format

Return:

1. Files changed
2. Functional scope implemented
3. Tests executed
4. Typecheck result
5. Documentation updated
6. Known limitations
7. Git status
8. Commit and push status

---

## Stop Condition

Do not proceed to Business Brain, Decision Engine, Conversation Engine, Creative Studio, or Growth & Revenue implementation.

Do not commit or push unless a separate Git release checkpoint task explicitly authorizes it.
