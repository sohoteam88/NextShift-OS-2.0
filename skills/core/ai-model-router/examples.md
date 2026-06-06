# AI Model Router Examples

## Example 1 - Database Schema

```text
MODEL ROUTING DECISION

Task: Design lead, pipeline, and tenant-aware CRM tables.
Complexity: Critical
Risk: Critical
Context Size: Large
Recommended Tier: Tier S
Recommended Model Type: Claude Opus 类 / GPT Thinking 类 / Gemini Pro Deep Reasoning 类
Reason: Core schema, multi-tenant boundaries, permissions, and CRM data integrity are affected.
Architecture Files To Read: 03_DOMAIN_MODEL.md, 05_USER_ROLES_AND_PERMISSIONS.md, 06_MULTI_TENANT_ARCHITECTURE.md, 07_DATABASE_ARCHITECTURE.md, 10_CRM_ARCHITECTURE.md, 17_SECURITY_ARCHITECTURE.md
Fallback: If uncertainty remains, pause and produce assumptions plus open questions before implementation.
```

## Example 2 - Markdown Cleanup

```text
MODEL ROUTING DECISION

Task: Clean heading levels and link formatting in markdown docs.
Complexity: Low
Risk: Low
Context Size: Small
Recommended Tier: Tier C
Recommended Model Type: Small / Fast / Low-cost model
Reason: The task is repetitive formatting with no product, data, security, or architecture impact.
Architecture Files To Read: None unless content meaning is changed.
Fallback: Upgrade to Tier B if content restructuring or technical interpretation is required.
```

## Example 3 - Production Auth Debugging

```text
MODEL ROUTING DECISION

Task: Debug production login issue where users may see another tenant's data.
Complexity: Critical
Risk: Critical
Context Size: Large
Recommended Tier: Tier S
Recommended Model Type: Claude Opus 类 / GPT Thinking 类 / Gemini Pro Deep Reasoning 类
Reason: Auth, permissions, tenant isolation, and production user data safety are involved.
Architecture Files To Read: 05_USER_ROLES_AND_PERMISSIONS.md, 06_MULTI_TENANT_ARCHITECTURE.md, 08_API_ARCHITECTURE.md, 17_SECURITY_ARCHITECTURE.md, 18_DEPLOYMENT_ARCHITECTURE.md
Fallback: Stop deployment-affecting changes until the root cause and rollback path are clear.
```
