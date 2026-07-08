# Duplicate Prevention

Use this file when a fresh AI window suggests creating something that may already exist.

## Do Not Recreate

Do not recreate these systems as new concepts or invented version bumps:

- Engineering Orchestrator v1.0 (retired; do not recreate)
- Engineering Playbook v1.0 (retired; do not recreate)
- Engineering Playbook v1.3 or later without approved source evidence
- Blueprint v1.0
- Core Runtime v1.0
- Design System v1.0
- Business Profile v1.0
- CRM v1.0
- Content v1.0
- Campaign v1.0

## Engineering Orchestration Rule

If the user asks for engineering orchestration, delivery process, implementation workflow, audit governance, or a "new engineering orchestrator":

1. First read `docs/nextshift-os-3/engineering/ENGINEERING_PLAYBOOK.md`.
2. Treat the version declared inside that canonical file as the current authority.
3. Check whether the current branch contains the approved v1.2 release/audit commits: `6dec2e4` and `f442e4a`.
4. Do not suggest `Engineering Orchestrator v1.0`.
5. Do not invent `Engineering Playbook v1.3` or later. A newer version exists only if the canonical file, an approved RFC, or an approved release/change/audit record says it exists.
6. If a gap exists, propose an extension to the current playbook or an RFC, not a duplicate or unapproved version bump.
7. Preserve the lifecycle: Planning -> Implementation -> Verification -> Audit -> Release.

## Skill Duplication Rule

Existing AI skills live under `skills/`.

Before creating a new skill:

1. Search `skills/**/SKILL.md`.
2. Check whether an existing skill can be extended.
3. Do not create duplicate skill folders.

Important existing skill categories:

- `skills/core`
- `skills/growth`
- `skills/crm`
- `skills/ai`
- `skills/data`
- `skills/ux`
- `skills/verticals`

## Architecture Duplication Rule

Before proposing a new architecture layer, read:

- `docs/nextshift-os-3/SYSTEM_CONTEXT.md`
- `docs/nextshift-os-3/phase-2-architecture/NEXTSHIFT_REFERENCE_ARCHITECTURE.md`
- `docs/nextshift-os-3/RUNTIME_STATUS.md`

New architecture should not redefine:

- Business Twin
- Business Brain
- Decision Brain
- Execution Layer
- Learning System
- Core Runtime package responsibilities
- Capability lifecycle

## Capability Duplication Rule

Before proposing a new capability, read:

- `docs/nextshift-os-3/CAPABILITY_STATUS.md`
- `docs/nextshift-os-3/capabilities/README.md`
- `docs/nextshift-os-3/capabilities/RELEASE_TAGS.md`

If the business area already exists, continue the capability lifecycle instead of creating another v1.0 capability.

## Correct Response Pattern

When a user asks for something that sounds duplicate, respond like this:

```text
This system already exists in NextShift. The current authority is [specific file/version].
I will not recreate it as a new v1.0 or invent a newer version number. I will either extend the existing system, update the relevant document, or propose an RFC if the change affects frozen architecture.
```
