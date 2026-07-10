# Do Not Duplicate

Version: 1.0

Status: Current

Last Updated: 2026-07-08

---

## Use This When ChatGPT Suggests A New Thing

If ChatGPT suggests one of these, stop and check the existing source first.

| Suggested New Thing | Existing Authority | Correct Response |
| --- | --- | --- |
| Engineering Orchestrator v1.0 | [Engineering Playbook](../../engineering/ENGINEERING_PLAYBOOK.md) | Do not create. Extend current Engineering Playbook or propose an RFC. |
| Engineering Playbook v1.0 | [Engineering Playbook v1.2](../../engineering/ENGINEERING_PLAYBOOK.md) | Retired baseline. Do not recreate. |
| Engineering Playbook v1.1 | [Engineering Playbook v1.2](../../engineering/ENGINEERING_PLAYBOOK.md) | Superseded. Use v1.2 on this branch. |
| Engineering Playbook v1.3 | [Version Authority Policy](../../../chatgpt-system-context/VERSION_AUTHORITY_POLICY.md) | Do not invent. Requires approved source, release evidence, and audit evidence. |
| New engineering workflow | [Engineering Playbook](../../engineering/ENGINEERING_PLAYBOOK.md) | Add amendment or RFC, not a parallel workflow. |
| New documentation standard | [Documentation Standard](../../engineering/STD-003_DOCUMENTATION_STANDARD_v1.0.md) | Extend existing standard or release a governed successor. |
| New GitHub alignment rule | [STD-005 GitHub Alignment](../../engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md) | Amend existing GitHub alignment standard. |
| New project orchestration system | [STD-006 Project Execution Orchestration v1.1](../../engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.1.md) | Use or amend STD-006. |
| New canonical resolution rule | [STD-007 Repository Canonical Resolution](../../engineering/STD-007_REPOSITORY_CANONICAL_RESOLUTION_STANDARD_v1.0.md) | Use or amend STD-007. |
| New Business Twin concept | [Business Twin Definition](../../phase-0-foundation/0.4_BUSINESS_TWIN_DEFINITION.md) | Align with existing Business Twin authority. |
| New architecture layer | [Reference Architecture](../../phase-2-architecture/NEXTSHIFT_REFERENCE_ARCHITECTURE.md) | Check reference architecture before proposing. |
| New capability lifecycle | [Capability Lifecycle Standard](../../capabilities/CAPABILITY_LIFECYCLE_STANDARD.md) | Use existing lifecycle. |
| New design system | [Design System](../../design-system/README.md) | Extend existing design system. |
| New UI kit | [UI Kit](../../ui-kit/README.md) | Extend existing UI kit. |
| New workspace framework | [Workspace Experience Framework](../../workspace-experience-framework/README.md) | Extend existing WEF. |

## Rule Of Thumb

If the suggestion says "create a new v1.0", it is probably duplicate until proven otherwise.

First search:

```bash
rg -n "suggested name|similar phrase" docs audit governance platform releases
```

Then check:

- [Canonical Index](00_CANONICAL_INDEX.md)
- [Protected Files](../PROTECTED_FILES.md)
- [Markdown Authority Audit](../../docs-hygiene/MARKDOWN_AUTHORITY_AUDIT.md)
