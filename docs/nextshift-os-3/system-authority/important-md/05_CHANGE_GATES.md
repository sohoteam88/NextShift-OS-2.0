# Change Gates

Version: 1.0

Status: Current

Last Updated: 2026-07-08

---

## When A Suggestion Touches Authority

Use this checklist before accepting or implementing it.

| Suggestion Type | First Check | Required Path |
| --- | --- | --- |
| New version | [Version Authority Policy](../../../chatgpt-system-context/VERSION_AUTHORITY_POLICY.md) | Approved source + release evidence + audit evidence |
| New engineering workflow | [Engineering Authority](02_ENGINEERING_AUTHORITY.md) | Amendment or RFC to current authority |
| New architecture layer | [Product Architecture Authority](03_PRODUCT_ARCHITECTURE_AUTHORITY.md) | Architecture review and protected-file change control |
| New capability lifecycle | [Capability Lifecycle Standard](../../capabilities/CAPABILITY_LIFECYCLE_STANDARD.md) | Amend existing lifecycle, do not duplicate |
| New status claim | [Status And Release Authority](04_STATUS_RELEASE_AUTHORITY.md) | Verify against status and release files |
| Duplicate MD cleanup | [Markdown Authority Audit](../../docs-hygiene/MARKDOWN_AUTHORITY_AUDIT.md) | Classify active vs historical before editing |

## Validation Commands

Run these after authority or important Markdown changes:

```bash
pnpm docs:links
pnpm docs:navigation
pnpm docs:audit-authority
pnpm type-check
git diff --check
```

## Decision Rule

If the proposed change would make a protected source file conflict with a higher authority, do not implement it. Write an audit note or RFC instead.
