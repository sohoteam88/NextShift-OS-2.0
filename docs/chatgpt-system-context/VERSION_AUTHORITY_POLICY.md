# Version Authority Policy

Use this policy before proposing any new version number for NextShift architecture, engineering, runtime, capability, design system, or governance documents.

## Core Rule

Do not invent version numbers.

A newer version exists only when at least one approved source says it exists:

- The canonical document itself declares the newer version.
- An approved RFC creates or authorizes the newer version.
- An approved release note, change record, or audit package references the newer version as accepted.
- The current branch contains the approved release/audit commits for that version.

Conversation context alone is not enough to create a version.

## Engineering Playbook Rule

Canonical file:

```text
docs/nextshift-os-3/engineering/ENGINEERING_PLAYBOOK.md
```

Latest verified release evidence:

```text
Engineering Playbook v1.2
Release commit: 6dec2e4 docs(engineering): release engineering playbook v1.2
Audit commit: f442e4a audit(engineering): verify engineering playbook v1.2
Branch evidence: planning/os-3.3-runtime-platform
Audit result: PASS
```

Therefore:

- Engineering Playbook v1.2 is valid on branches that contain the approved release/audit evidence.
- If the current checkout still declares v1.1, identify the branch mismatch before advising.
- Do not propose `Engineering Playbook v1.3` unless approved source evidence exists.
- Do not label a recommendation as v1.3 just because it improves v1.2.
- Use "proposed amendment to Engineering Playbook v1.2" or "RFC for Engineering Playbook v1.3" when the change is not yet approved.

## Correct Version Workflow

When a new version seems necessary:

1. Identify the canonical file.
2. Read the current version and status.
3. Check the current branch and whether it contains known release/audit commits.
4. Search for an approved RFC, release note, change record, or audit that authorizes the new version.
5. If none exists, create a proposal/RFC instead of naming the new version as real.
6. Only after approval, update the canonical file version and add `Supersedes`.

## Safe Language

Use these labels before approval:

- `proposed amendment`
- `draft RFC`
- `candidate update`
- `change proposal`
- `vNext proposal`

Do not use these labels before approval:

- `current v1.3`
- `approved v1.3`
- `released v1.3`
- `supersedes v1.2`

## Response Pattern

```text
I found the current authority at [file]. It declares Version: [x] and Status: [status].
I checked whether this branch contains the relevant release/audit evidence.
I do not see approved evidence for Version: [y] on this branch.
I will treat this as a proposed amendment/RFC rather than a current version.
```
