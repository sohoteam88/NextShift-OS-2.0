# Workflow Releases

Version: 1.0

Status: Current

Last Updated: 2026-07-06

---

## Purpose

This document records released NextShift runtime workflows and their repository evidence.

It is the workflow release registry for the `planning/os-3.1-mvp-governance` branch.

---

## Release Governance

A workflow may be marked released only after:

- Domain, application, contract, repository, integration event, or adapter scope required by the workflow has been implemented.
- Tests for the workflow have been added or updated.
- Existing tests and typecheck expectations have been preserved for the changed packages.
- Repository audit or code review evidence exists.
- Metadata is synchronized through [Workflow Status](WORKFLOW_STATUS.md), [NextShift Workflow Catalog v1.0](../../platform/NEXTSHIFT_WORKFLOW_CATALOG_v1.0.md), and [Project Status](PROJECT_STATUS.md).

Workflow release records do not imply that a Git tag exists. Git tags are governed separately by [Release Tags](capabilities/RELEASE_TAGS.md).

---

## Current Workflow Release Registry

| ID | Workflow | Release State | Implementation Commit | Audit Commit | Release Evidence |
| --- | --- | --- | --- | --- | --- |
| WF-001 | Repository Health Review | Released | `e968fe5` | `c832aae` | [Runtime Sprint-005 code review](../../audit/NEXTSHIFT_RUNTIME_SPRINT_005_CODE_REVIEW_REPORT.md) |
| WF-002 | CRM Lead Qualification | Released | `5022fe0` | `3f7ea9f` | [WF-002 code review](../../audit/WF_002_CRM_LEAD_QUALIFICATION_CODE_REVIEW_REPORT.md) |
| WF-003 | Content Planning & Approval | Released | `15d1b37` | `b628f1c` | [WF-003 repository audit](../../audit/WF_003_CONTENT_PLANNING_APPROVAL_REPOSITORY_AUDIT_REPORT.md) |
| WF-004 | Opportunity Evaluation | Released | `f6aa85c` | `c738b18` | [WF-004 repository audit](../../audit/WF_004_OPPORTUNITY_EVALUATION_REPOSITORY_AUDIT_REPORT.md) |
| WF-005 | Campaign Execution | Released | `d738a39` | `fefd47b` | [WF-005 repository audit](../../audit/WF_005_CAMPAIGN_EXECUTION_REPOSITORY_AUDIT_REPORT.md) |
| WF-006 | Revenue Forecast Review | Released | `4fb3c3f` | `f972a21` | [WF-006 repository audit](../../audit/WF_006_REVENUE_FORECAST_REVIEW_REPOSITORY_AUDIT_REPORT.md) |
| WF-007 | Analytics Insight Review | Released | `c96255c` | `0655d38` | [WF-007 repository audit](../../audit/WF_007_ANALYTICS_INSIGHT_REVIEW_REPOSITORY_AUDIT_REPORT.md) |

---

## Current Release Summary

Released workflows:

- WF-001 Repository Health Review
- WF-002 CRM Lead Qualification
- WF-003 Content Planning & Approval
- WF-004 Opportunity Evaluation
- WF-005 Campaign Execution
- WF-006 Revenue Forecast Review
- WF-007 Analytics Insight Review

Pending workflow releases:

- None recorded in the current workflow catalog.

---

## Tagging Status

No workflow-specific Git tags are recorded in this registry.

If workflow Git tags are introduced later, they must follow the governance rules in [Release Tags](capabilities/RELEASE_TAGS.md) and be added to this release registry.
