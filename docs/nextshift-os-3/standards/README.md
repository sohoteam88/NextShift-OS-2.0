# NextShift Standards v1.0

## Overview

The NextShift Standards define the engineering governance used across every NextShift project.

These standards are referenced by project planning documents and provide a common lifecycle, documentation model, role definition, and release process.

## Standards

### STD-001 - Engineering Workflow Standard

Defines the lifecycle for every slice and project.

```text
Planning -> Implementation Contract -> Implementation -> Verification -> Audit -> Release
```

Canonical document:

- [NextShift Engineering Workflow Standard (NEWS) v1.0](../engineering/NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md)

### STD-002 - AI Role Framework

Defines engineering roles independently from specific AI products.

Roles:

- Product Architect
- Documentation Engineer
- Software Engineer
- Audit Engineer
- Release Manager

Canonical document:

- [STD-002 AI Role Framework v1.0](../engineering/STD-002_AI_ROLE_FRAMEWORK_v1.0.md)

### STD-003 - Documentation Standard

Defines:

- Folder structure
- Naming conventions
- Required metadata
- Required lifecycle documents
- Traceability requirements

Canonical document:

- [STD-003 Documentation Standard v1.0](../engineering/STD-003_DOCUMENTATION_STANDARD_v1.0.md)

### STD-004 - Release Governance

Defines:

- Slice Release
- Project Release
- Semantic Versioning
- Release Package
- Approval Matrix

Canonical document:

- [STD-004 Release Governance v1.0](../engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md)

### STD-005 - GitHub Alignment Standard

Defines:

- Branch strategy
- Release branch and tag alignment
- VPS deployed revision standard
- Archive deployment compatibility
- Deployment manifest requirements
- Production alignment gate

Canonical document:

- [STD-005 GitHub Alignment Standard v1.0](../engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md)

## Adoption

Every new NextShift project should declare the following Engineering Baseline:

- STD-001 Engineering Workflow Standard
- STD-002 AI Role Framework
- STD-003 Documentation Standard
- STD-004 Release Governance
- STD-005 GitHub Alignment Standard

## Repository Structure

```text
docs/
└── nextshift-os-3/
    └── standards/
        └── README.md
```

Canonical standard documents are currently maintained in:

```text
docs/nextshift-os-3/engineering/
```

## Current Version

Version: v1.0.0

Status: Released

## Next Evolution

Future standards may include:

- STD-006 Design Governance
- STD-007 Security & Compliance
- STD-008 AI Collaboration Standard
