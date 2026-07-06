# NextShift Workflow Catalog v1.0

## Document Information
- Document Type: Repository Artifact
- Repository: YES
- Primary Executor: Codex
- Secondary Executor: Claude
- Next Step: Maintain workflow status and release metadata

## Purpose
Define the prioritized end-to-end workflows that drive future Runtime development.

Canonical status and release metadata:

- [Workflow Status](../docs/nextshift-os-3/WORKFLOW_STATUS.md)
- [Workflow Releases](../docs/nextshift-os-3/WORKFLOW_RELEASES.md)

## Priority Workflows

| ID | Workflow | Priority | Status | Evidence |
|----|----------|----------|--------|----------|
| WF-001 | Repository Health Review | High | Released | [Runtime Sprint-005 code review](../audit/NEXTSHIFT_RUNTIME_SPRINT_005_CODE_REVIEW_REPORT.md) |
| WF-002 | CRM Lead Qualification | High | Released | [WF-002 code review](../audit/WF_002_CRM_LEAD_QUALIFICATION_CODE_REVIEW_REPORT.md) |
| WF-003 | Content Planning & Approval | High | Released | [WF-003 repository audit](../audit/WF_003_CONTENT_PLANNING_APPROVAL_REPOSITORY_AUDIT_REPORT.md) |
| WF-004 | Opportunity Evaluation | High | Released | [WF-004 repository audit](../audit/WF_004_OPPORTUNITY_EVALUATION_REPOSITORY_AUDIT_REPORT.md) |
| WF-005 | Campaign Execution | Medium | Released | [WF-005 repository audit](../audit/WF_005_CAMPAIGN_EXECUTION_REPOSITORY_AUDIT_REPORT.md) |
| WF-006 | Revenue Forecast Review | Medium | Released | [WF-006 repository audit](../audit/WF_006_REVENUE_FORECAST_REVIEW_REPOSITORY_AUDIT_REPORT.md) |
| WF-007 | Analytics Insight Review | Medium | Released | [WF-007 repository audit](../audit/WF_007_ANALYTICS_INSIGHT_REVIEW_REPOSITORY_AUDIT_REPORT.md) |

## Standard Workflow Pattern

Trigger
→ Workspace Session
→ Runtime Task
→ Operator Review
→ Business Decision
→ Action
→ Validation
→ Audit Trail

## Sprint Planning Rule

Each sprint should deliver at least one demonstrable end-to-end workflow.

Completed workflows must be synchronized into [Workflow Status](../docs/nextshift-os-3/WORKFLOW_STATUS.md) and [Workflow Releases](../docs/nextshift-os-3/WORKFLOW_RELEASES.md).

## Success Metric

Measure completed workflows rather than new frameworks or packages.
