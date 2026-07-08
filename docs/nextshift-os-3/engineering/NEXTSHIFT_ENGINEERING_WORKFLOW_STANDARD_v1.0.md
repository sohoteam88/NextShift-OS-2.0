# NextShift Engineering Workflow Standard (NEWS) v1.0

## Purpose

Define the standard engineering workflow for all NextShift documentation-driven projects.

## AI Roles

| Role | Assigned Agent | Responsibility |
| --- | --- | --- |
| Product Architect | ChatGPT | Planning, Verification, Release |
| Documentation Engineer | Codex | Documentation implementation |
| Audit Engineer | Claude Code | Independent audit |

## Lifecycle

1. Planning
2. Documentation Implementation Contract
3. Documentation Implementation
4. Implementation Report
5. Verification
6. Audit Contract
7. Audit
8. Release Notes
9. Slice Release

## Mandatory Documents Per Slice

- PLANNING.md
- DOCUMENTATION_IMPLEMENTATION_CONTRACT.md
- IMPLEMENTATION_REPORT.md
- VERIFICATION.md
- AUDIT_CONTRACT.md
- AUDIT_REPORT.md
- RELEASE_NOTES.md

## Responsibilities

### Product Architect (ChatGPT)

- Define scope
- Produce planning
- Verify implementation
- Produce release notes
- Govern lifecycle

### Documentation Engineer (Codex)

- Implement documentation
- Update repository indexes
- Produce implementation report

### Audit Engineer (Claude Code)

- Independently audit deliverables
- Review consistency
- Validate repository updates
- Produce audit report

## Non-Negotiable Rules

1. Product Architect does not implement documentation.
2. Documentation Engineer does not verify or audit its own work.
3. Audit Engineer does not implement the slice it audits.
4. No lifecycle stage may be skipped.
5. Every document must identify:
   - Execution Role
   - Assigned Agent
   - Inputs
   - Outputs
   - Exit Criteria

## Applies To

- UI Kit
- Admin UI
- Mobile
- SDK
- API
- Future NextShift platform projects
