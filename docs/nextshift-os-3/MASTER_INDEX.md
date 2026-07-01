## MASTER_INDEX

Version: 1.0

Status: Current

Last Updated: 2026-06-30

---

## Purpose

This document is the master navigation entry for all NextShift OS documentation.

Unlike the project README, which introduces the platform, the Master Index provides structured navigation across the complete documentation system.

Every authoritative document should be reachable from this index.

---

## Recommended Reading Order

For first-time contributors:

1. [README](README.md)
2. [Blueprint Status](BLUEPRINT_STATUS.md)
3. [NextShift Reference Architecture](phase-2-architecture/NEXTSHIFT_REFERENCE_ARCHITECTURE.md)
4. [Runtime Status](RUNTIME_STATUS.md)
5. [Capability Status](CAPABILITY_STATUS.md)
6. [Engineering Standards](engineering/ENGINEERING_STANDARDS.md)
7. [NextShift Standards v1.0](standards/README.md)
8. [Engineering Workflow](engineering/ENGINEERING_WORKFLOW.md)
9. [NextShift Engineering Workflow Standard (NEWS) v1.0](engineering/NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md)
10. [Engineering Playbook](engineering/ENGINEERING_PLAYBOOK.md)
11. [Reference Capability](capabilities/REFERENCE_CAPABILITY.md)

After completing the above:

- Capability documentation
- Platform project documentation
- Sprint documentation
- Engineering documentation

---

## Project Dashboard

| Area                 | Status          |
| -------------------- | --------------- |
| Blueprint            | Complete        |
| Core Runtime         | Complete        |
| Architecture 3.1     | ARC-006 Released · OS 3.1 RC1 Approved |
| Reference Capability | CAP-001         |
| Current Capability   | CAP-005 S-004 Implementation |
| Design System        | Released        |
| UI Kit               | Released        |

---

## Blueprint

Core documents:

- [NextShift OS 3.0 Blueprint](NEXTSHIFT_OS_3_BLUEPRINT.md)
- [Blueprint Status](BLUEPRINT_STATUS.md)
- [NextShift Reference Architecture](phase-2-architecture/NEXTSHIFT_REFERENCE_ARCHITECTURE.md)

Supporting:

- [Current Constitution](constitution/README.md)
- [Product Philosophy](phase-0-foundation/0.8_PRODUCT_PHILOSOPHY.md)
- [AI Operating Loop](phase-0-foundation/0.3_AI_OPERATING_LOOP.md)

---

## Core Runtime

Status:

- [Runtime Status](RUNTIME_STATUS.md)

Packages:

- `shared`
- `contracts`
- `event-bus`
- `business-brain`
- `decision-brain`
- `execution-layer`
- `learning-system`
- `domain`
- `application`
- `agents`
- `capability-layer`

Engineering:

- [Engineering Workflow](engineering/ENGINEERING_WORKFLOW.md)
- [Implementation Cycle](engineering/IMPLEMENTATION_CYCLE.md)

---

## Capability Governance

Status:

- [Capability Status](CAPABILITY_STATUS.md)

Reference:

- [Capability Release](capabilities/CAPABILITY_RELEASE.md)
- [Release Tags](capabilities/RELEASE_TAGS.md)
- [Reference Capability](capabilities/REFERENCE_CAPABILITY.md)
- [Capability Retrospective](capabilities/CAPABILITY_RETROSPECTIVE.md)

Engineering Knowledge:

- [Lessons Learned CAP-001](capabilities/LESSONS_LEARNED_CAP_001.md)

---

## Platform Projects

Architecture 3.1:

- [ARC-001 Platform Kernel & Member-Centric Identity Foundation](../architecture/ARC-001_PLATFORM_KERNEL_MEMBER_CENTRIC_IDENTITY_FOUNDATION.md)
- [ARC-001 Implementation Report](../audit/ARC_001_IMPLEMENTATION_REPORT.md)
- [ARC-001 Verification Checklist](../audit/ARC_001_VERIFICATION_CHECKLIST.md)
- [ARC-001 Audit Report](../audit/ARC_001_AUDIT_REPORT.md)
- [ARC-001 Release](../architecture/ARC-001_RELEASE.md)
- [ARC-001 Release Notes](../architecture/ARC_001_RELEASE_NOTES.md)
- [ARC-002 Workspace Context Architecture](../architecture/ARC-002_WORKSPACE_CONTEXT_ARCHITECTURE.md)
- [ARC-002 Implementation Report](../audit/ARC_002_IMPLEMENTATION_REPORT.md)
- [ARC-002 Codex Implementation Report](../audit/ARC_002_CODEX_IMPLEMENTATION_REPORT.md)
- [ARC-002 Verification Checklist](../audit/ARC_002_VERIFICATION_CHECKLIST.md)
- [ARC-002 Claude Code Architecture Audit Task](../audit/ARC_002_CLAUDE_CODE_ARCHITECTURE_AUDIT_TASK.md)
- [ARC-002 Audit Report](../audit/ARC_002_AUDIT_REPORT.md)
- [ARC-002 Release](../architecture/ARC-002_RELEASE.md)
- [ARC-002 Release Notes](../architecture/ARC_002_RELEASE_NOTES.md)
- [ARC-003 Engine Context Refactor](../architecture/ARC-003_ENGINE_CONTEXT_REFACTOR.md)
- [ARC-003 Codex Implementation Task](../audit/ARC_003_CODEX_IMPLEMENTATION_TASK.md)
- [ARC-003 Implementation Report](../audit/ARC_003_IMPLEMENTATION_REPORT.md)
- [ARC-003 Codex Implementation Report](../audit/ARC_003_CODEX_IMPLEMENTATION_REPORT.md)
- [ARC-003 Verification Checklist](../audit/ARC_003_VERIFICATION_CHECKLIST.md)
- [ARC-003 Claude Code Architecture Audit Task](../audit/ARC_003_CLAUDE_CODE_ARCHITECTURE_AUDIT_TASK.md)
- [ARC-003 Audit Report](../audit/ARC_003_AUDIT_REPORT.md)
- [ARC-003 Release](../architecture/ARC-003_RELEASE.md)
- [ARC-003 Release Notes](../architecture/ARC_003_RELEASE_NOTES.md)
- [NextShift OS 3.1 Architecture Milestone Review (ARC-001 to ARC-003)](../architecture/NEXTSHIFT_OS_3_1_ARCHITECTURE_MILESTONE_REVIEW.md)
- [OS 3.1 Foundation Checkpoint Report](../audit/OS31_FOUNDATION_CHECKPOINT_REPORT.md)
- [ARC-004 Retail Business OS Configuration](../architecture/ARC-004_RETAIL_BUSINESS_OS_CONFIGURATION.md)
- [ARC-004 Implementation Report](../audit/ARC_004_IMPLEMENTATION_REPORT.md)
- [ARC-004 Codex Implementation Report](../audit/ARC_004_CODEX_IMPLEMENTATION_REPORT.md)
- [ARC-004 Verification Checklist](../audit/ARC_004_VERIFICATION_CHECKLIST.md)
- [ARC-004 Claude Code Architecture Audit Task](../audit/ARC_004_CLAUDE_CODE_ARCHITECTURE_AUDIT_TASK.md)
- [ARC-004 Audit Report](../audit/ARC_004_AUDIT_REPORT.md)
- [ARC-004 Release](../architecture/ARC-004_RELEASE.md)
- [ARC-004 Release Notes](../architecture/ARC_004_RELEASE_NOTES.md)
- [ARC-005 Recruitment Business OS Configuration](../architecture/ARC-005_RECRUITMENT_BUSINESS_OS_CONFIGURATION.md)
- [ARC-005 Implementation Report](../audit/ARC_005_IMPLEMENTATION_REPORT.md)
- [ARC-005 Codex Implementation Report](../audit/ARC_005_CODEX_IMPLEMENTATION_REPORT.md)
- [ARC-005 Verification Checklist](../audit/ARC_005_VERIFICATION_CHECKLIST.md)
- [ARC-005 Claude Code Architecture Audit Task](../audit/ARC_005_CLAUDE_CODE_ARCHITECTURE_AUDIT_TASK.md)
- [ARC-005 Audit Report](../audit/ARC_005_AUDIT_REPORT.md)
- [ARC-005 Release](../architecture/ARC-005_RELEASE.md)
- [ARC-005 Release Notes](../architecture/ARC_005_RELEASE_NOTES.md)
- [ARC-006 Workspace Presentation Layer Rendering](../architecture/ARC-006_WORKSPACE_PRESENTATION_LAYER_RENDERING.md)
- [ARC-006 Implementation Report](../audit/ARC_006_IMPLEMENTATION_REPORT.md)
- [ARC-006 Codex Implementation Report](../audit/ARC_006_CODEX_IMPLEMENTATION_REPORT.md)
- [ARC-006 Verification Checklist](../audit/ARC_006_VERIFICATION_CHECKLIST.md)
- [ARC-006 Claude Code Architecture Audit Task](../audit/ARC_006_CLAUDE_CODE_ARCHITECTURE_AUDIT_TASK.md)
- [ARC-006 Audit Report](../audit/ARC_006_AUDIT_REPORT.md)
- [ARC-006 Release](../architecture/ARC-006_RELEASE.md)
- [ARC-006 Release Notes](../architecture/ARC_006_RELEASE_NOTES.md)
- [OS 3.1 Production Readiness Review (RC1)](../audit/OS31_PRODUCTION_READINESS_REVIEW.md)
- [OS 3.1 Release Candidate (RC1)](../architecture/OS31_RELEASE_CANDIDATE.md)
- [OS 3.1 RC1 Git Checkpoint Report](../audit/OS31_RC1_GIT_CHECKPOINT_REPORT.md)
- [NS31 Dual Business Workspace Architecture](../architecture/NS31_DUAL_BUSINESS_WORKSPACE_ARCHITECTURE.md)
- [NS31 Workspace Context System](../architecture/NS31_WORKSPACE_CONTEXT_SYSTEM.md)
- [NS31 Database Evolution Plan](../architecture/NS31_DATABASE_EVOLUTION_PLAN.md)
- [NS31 Migration Plan](../architecture/NS31_MIGRATION_PLAN.md)

Design System:

- [NextShift Design System v1.0](design-system/README.md)
- [Design System Project Planning](design-system/PROJECT_PLANNING.md)
- [Design System Project Release](design-system/PROJECT_RELEASE.md)
- [Design System Project Release Notes](design-system/PROJECT_RELEASE_NOTES.md)

UI Kit:

- [NextShift UI Kit v1.0](ui-kit/README.md)
- [UI Kit Project Planning](ui-kit/PROJECT_PLANNING.md)
- [UI Kit Project Verification](ui-kit/PROJECT_VERIFICATION.md)
- [UI Kit Project Audit Report](ui-kit/PROJECT_AUDIT_REPORT.md)
- [UI Kit Project Release Notes](ui-kit/PROJECT_RELEASE_NOTES.md)
- [UI Kit v1 Release Package](ui-kit/UIKIT_V1_RELEASE_PACKAGE.md)
- [UI Kit v1 Release Summary](ui-kit/UIKIT_V1_RELEASE_SUMMARY.docx)
- [UK-001 Design Language Planning](ui-kit/slices/UK-001-design-language/PLANNING.md)
- [UK-001 Design Language Audit Report](ui-kit/slices/UK-001-design-language/AUDIT_REPORT.md)
- [UK-001 Design Language Release Notes](ui-kit/slices/UK-001-design-language/RELEASE_NOTES.md)
- [UK-002 Design Principles Planning](ui-kit/slices/UK-002-design-principles/PLANNING.md)
- [UK-002 Design Principles](ui-kit/slices/UK-002-design-principles/DESIGN_PRINCIPLES.md)
- [UK-002 Principle Explanations](ui-kit/slices/UK-002-design-principles/PRINCIPLE_EXPLANATIONS.md)
- [UK-002 UX Foundations](ui-kit/slices/UK-002-design-principles/UX_FOUNDATIONS.md)
- [UK-002 Anti-Patterns](ui-kit/slices/UK-002-design-principles/ANTI_PATTERNS.md)
- [UK-002 Implementation Report](ui-kit/slices/UK-002-design-principles/IMPLEMENTATION_REPORT.md)
- [UK-002 Verification](ui-kit/slices/UK-002-design-principles/VERIFICATION.md)
- [UK-002 Design Principles Audit Report](ui-kit/slices/UK-002-design-principles/AUDIT_REPORT.md)
- [UK-002 Design Principles Release Notes](ui-kit/slices/UK-002-design-principles/RELEASE_NOTES.md)
- [UK-003 Component Catalog Planning](ui-kit/slices/UK-003-component-catalog/PLANNING.md)
- [UK-003 Component Catalog](ui-kit/slices/UK-003-component-catalog/COMPONENT_CATALOG.md)
- [UK-003 Component Taxonomy](ui-kit/slices/UK-003-component-catalog/COMPONENT_TAXONOMY.md)
- [UK-003 Workspace Components](ui-kit/slices/UK-003-component-catalog/WORKSPACE_COMPONENTS.md)
- [UK-003 Component Usage Guidelines](ui-kit/slices/UK-003-component-catalog/COMPONENT_USAGE_GUIDELINES.md)
- [UK-003 Component States and Variants](ui-kit/slices/UK-003-component-catalog/COMPONENT_STATES_AND_VARIANTS.md)
- [UK-003 Component Composition Rules](ui-kit/slices/UK-003-component-catalog/COMPONENT_COMPOSITION_RULES.md)
- [UK-003 Figma Component Naming](ui-kit/slices/UK-003-component-catalog/FIGMA_COMPONENT_NAMING.md)
- [UK-003 AI Component Prompts](ui-kit/slices/UK-003-component-catalog/AI_COMPONENT_PROMPTS.md)
- [UK-003 QA Component Checklist](ui-kit/slices/UK-003-component-catalog/QA_COMPONENT_CHECKLIST.md)
- [UK-003 Component Catalog Implementation Report](ui-kit/slices/UK-003-component-catalog/IMPLEMENTATION_REPORT.md)
- [UK-003 Component Catalog Verification](ui-kit/slices/UK-003-component-catalog/VERIFICATION.md)
- [UK-003 Component Catalog Audit Report](ui-kit/slices/UK-003-component-catalog/AUDIT_REPORT.md)
- [UK-003 Component Catalog Release Notes](ui-kit/slices/UK-003-component-catalog/RELEASE_NOTES.md)
- [UK-004 Layout Guidelines Planning](ui-kit/slices/UK-004-layout-guidelines/PLANNING.md)
- [UK-004 Layout Guidelines Documentation Implementation Contract](ui-kit/slices/UK-004-layout-guidelines/DOCUMENTATION_IMPLEMENTATION_CONTRACT.md)
- [UK-004 Layout Guidelines](ui-kit/slices/UK-004-layout-guidelines/LAYOUT_GUIDELINES.md)
- [UK-004 Workspace Layouts](ui-kit/slices/UK-004-layout-guidelines/WORKSPACE_LAYOUTS.md)
- [UK-004 Page Templates](ui-kit/slices/UK-004-layout-guidelines/PAGE_TEMPLATES.md)
- [UK-004 Responsive Layout Guide](ui-kit/slices/UK-004-layout-guidelines/RESPONSIVE_LAYOUT_GUIDE.md)
- [UK-004 Information Hierarchy](ui-kit/slices/UK-004-layout-guidelines/INFORMATION_HIERARCHY.md)
- [UK-004 Grid and Spacing Guide](ui-kit/slices/UK-004-layout-guidelines/GRID_AND_SPACING_GUIDE.md)
- [UK-004 Layout Anti-Patterns](ui-kit/slices/UK-004-layout-guidelines/LAYOUT_ANTI_PATTERNS.md)
- [UK-004 Layout Guidelines Implementation Report](ui-kit/slices/UK-004-layout-guidelines/IMPLEMENTATION_REPORT.md)
- [UK-004 Layout Guidelines Requirements Verification](ui-kit/slices/UK-004-layout-guidelines/REQUIREMENTS_VERIFICATION.md)
- [UK-004 Layout Guidelines Audit Report](ui-kit/slices/UK-004-layout-guidelines/AUDIT_REPORT.md)
- [UK-004 Layout Guidelines Release Notes](ui-kit/slices/UK-004-layout-guidelines/RELEASE_NOTES.md)
- [UK-005 Interaction Patterns Planning](ui-kit/slices/UK-005-interaction-patterns/PLANNING.md)
- [UK-005 Interaction Patterns Documentation Implementation Contract](ui-kit/slices/UK-005-interaction-patterns/DOCUMENTATION_IMPLEMENTATION_CONTRACT.md)
- [UK-005 Interaction Patterns](ui-kit/slices/UK-005-interaction-patterns/INTERACTION_PATTERNS.md)
- [UK-005 User Flows](ui-kit/slices/UK-005-interaction-patterns/USER_FLOWS.md)
- [UK-005 Feedback Patterns](ui-kit/slices/UK-005-interaction-patterns/FEEDBACK_PATTERNS.md)
- [UK-005 Navigation Interactions](ui-kit/slices/UK-005-interaction-patterns/NAVIGATION_INTERACTIONS.md)
- [UK-005 AI Interaction Patterns](ui-kit/slices/UK-005-interaction-patterns/AI_INTERACTION_PATTERNS.md)
- [UK-005 Microinteractions](ui-kit/slices/UK-005-interaction-patterns/MICROINTERACTIONS.md)
- [UK-005 Interaction Anti-Patterns](ui-kit/slices/UK-005-interaction-patterns/INTERACTION_ANTI_PATTERNS.md)
- [UK-005 Interaction Patterns Implementation Report](ui-kit/slices/UK-005-interaction-patterns/IMPLEMENTATION_REPORT.md)
- [UK-005 Interaction Patterns Requirements Verification](ui-kit/slices/UK-005-interaction-patterns/REQUIREMENTS_VERIFICATION.md)
- [UK-005 Interaction Patterns Audit Report](ui-kit/slices/UK-005-interaction-patterns/AUDIT_REPORT.md)
- [UK-005 Interaction Patterns Release Notes](ui-kit/slices/UK-005-interaction-patterns/RELEASE_NOTES.md)
- [UK-006 Accessibility Guidelines Planning](ui-kit/slices/UK-006-accessibility-guidelines/PLANNING.md)
- [UK-006 Accessibility Guidelines Documentation Implementation Contract](ui-kit/slices/UK-006-accessibility-guidelines/DOCUMENTATION_IMPLEMENTATION_CONTRACT.md)
- [UK-006 Accessibility Guidelines](ui-kit/slices/UK-006-accessibility-guidelines/ACCESSIBILITY_GUIDELINES.md)
- [UK-006 Keyboard Navigation](ui-kit/slices/UK-006-accessibility-guidelines/KEYBOARD_NAVIGATION.md)
- [UK-006 Screen Reader Guide](ui-kit/slices/UK-006-accessibility-guidelines/SCREEN_READER_GUIDE.md)
- [UK-006 Accessible Component Usage](ui-kit/slices/UK-006-accessibility-guidelines/ACCESSIBLE_COMPONENT_USAGE.md)
- [UK-006 Accessibility Checklist](ui-kit/slices/UK-006-accessibility-guidelines/ACCESSIBILITY_CHECKLIST.md)
- [UK-006 Accessibility Anti-Patterns](ui-kit/slices/UK-006-accessibility-guidelines/ACCESSIBILITY_ANTI_PATTERNS.md)
- [UK-006 Accessibility Testing Guide](ui-kit/slices/UK-006-accessibility-guidelines/ACCESSIBILITY_TESTING_GUIDE.md)
- [UK-006 Accessibility Guidelines Implementation Report](ui-kit/slices/UK-006-accessibility-guidelines/IMPLEMENTATION_REPORT.md)
- [UK-006 Accessibility Guidelines Requirements Verification](ui-kit/slices/UK-006-accessibility-guidelines/REQUIREMENTS_VERIFICATION.md)
- [UK-006 Accessibility Guidelines Audit Report](ui-kit/slices/UK-006-accessibility-guidelines/AUDIT_REPORT.md)
- [UK-006 Accessibility Guidelines Release Notes](ui-kit/slices/UK-006-accessibility-guidelines/RELEASE_NOTES.md)
- [UK-007 Theme & Branding Guide Planning](ui-kit/slices/UK-007-theme-branding-guide/PLANNING.md)
- [UK-007 Theme & Branding Guide Documentation Implementation Contract](ui-kit/slices/UK-007-theme-branding-guide/DOCUMENTATION_IMPLEMENTATION_CONTRACT.md)
- [UK-007 Theme and Branding Guide](ui-kit/slices/UK-007-theme-branding-guide/THEME_AND_BRANDING_GUIDE.md)
- [UK-007 Brand Usage Guide](ui-kit/slices/UK-007-theme-branding-guide/BRAND_USAGE_GUIDE.md)
- [UK-007 Logo and Identity](ui-kit/slices/UK-007-theme-branding-guide/LOGO_AND_IDENTITY.md)
- [UK-007 Color Application Guide](ui-kit/slices/UK-007-theme-branding-guide/COLOR_APPLICATION_GUIDE.md)
- [UK-007 Workspace Branding](ui-kit/slices/UK-007-theme-branding-guide/WORKSPACE_BRANDING.md)
- [UK-007 Dark Light Mode Guide](ui-kit/slices/UK-007-theme-branding-guide/DARK_LIGHT_MODE_GUIDE.md)
- [UK-007 Brand Anti-Patterns](ui-kit/slices/UK-007-theme-branding-guide/BRAND_ANTI_PATTERNS.md)
- [UK-007 Theme & Branding Guide Implementation Report](ui-kit/slices/UK-007-theme-branding-guide/IMPLEMENTATION_REPORT.md)
- [UK-007 Theme & Branding Guide Requirements Verification](ui-kit/slices/UK-007-theme-branding-guide/REQUIREMENTS_VERIFICATION.md)
- [UK-007 Theme & Branding Guide Audit Report](ui-kit/slices/UK-007-theme-branding-guide/AUDIT_REPORT.md)
- [UK-007 Theme & Branding Guide Release Notes](ui-kit/slices/UK-007-theme-branding-guide/RELEASE_NOTES.md)
- [UK-008 Claude Design Brief Planning](ui-kit/slices/UK-008-claude-design-brief/PLANNING.md)
- [UK-008 Claude Design Brief Documentation Implementation Contract](ui-kit/slices/UK-008-claude-design-brief/DOCUMENTATION_IMPLEMENTATION_CONTRACT.md)
- [UK-008 Claude Design Brief](ui-kit/slices/UK-008-claude-design-brief/CLAUDE_DESIGN_BRIEF.md)
- [UK-008 Context Loading Guide](ui-kit/slices/UK-008-claude-design-brief/CONTEXT_LOADING_GUIDE.md)
- [UK-008 Prompt Construction Rules](ui-kit/slices/UK-008-claude-design-brief/PROMPT_CONSTRUCTION_RULES.md)
- [UK-008 Workspace Design Rules](ui-kit/slices/UK-008-claude-design-brief/WORKSPACE_DESIGN_RULES.md)
- [UK-008 Component Selection Guide](ui-kit/slices/UK-008-claude-design-brief/COMPONENT_SELECTION_GUIDE.md)
- [UK-008 Layout Selection Guide](ui-kit/slices/UK-008-claude-design-brief/LAYOUT_SELECTION_GUIDE.md)
- [UK-008 Design Review Checklist](ui-kit/slices/UK-008-claude-design-brief/DESIGN_REVIEW_CHECKLIST.md)
- [UK-008 AI Design Anti-Patterns](ui-kit/slices/UK-008-claude-design-brief/AI_DESIGN_ANTI_PATTERNS.md)
- [UK-008 Claude Design Brief Implementation Report](ui-kit/slices/UK-008-claude-design-brief/IMPLEMENTATION_REPORT.md)
- [UK-008 Claude Design Brief Requirements Verification](ui-kit/slices/UK-008-claude-design-brief/REQUIREMENTS_VERIFICATION.md)
- [UK-008 Claude Design Brief Audit Report](ui-kit/slices/UK-008-claude-design-brief/AUDIT_REPORT.md)
- [UK-008 Claude Design Brief Release Notes](ui-kit/slices/UK-008-claude-design-brief/RELEASE_NOTES.md)

---

## CAP-001 Business Profile

Capability Definition:

- [CAP-001 Business Profile](capabilities/CAPABILITY_001_BUSINESS_PROFILE.md)

Supporting Specifications:

- [Business Profile Domain Model](capabilities/BUSINESS_PROFILE_DOMAIN_MODEL.md)
- [Business Profile Use Cases](capabilities/BUSINESS_PROFILE_USE_CASES.md)
- [Business Profile Events](capabilities/BUSINESS_PROFILE_EVENTS.md)
- [Business Profile Application Specification](capabilities/BUSINESS_PROFILE_APPLICATION_SPEC.md)
- [Business Profile API Specification](capabilities/BUSINESS_PROFILE_API_SPEC.md)
- [Business Profile UI Flow](capabilities/BUSINESS_PROFILE_UI_FLOW.md)

Implementation:

- [Implementation Cycle CAP-001](capabilities/IMPLEMENTATION_CYCLE_CAP_001.md)

Slices:

- [Implementation Slice 001 - Business Identity](capabilities/IMPLEMENTATION_SLICE_001_BUSINESS_IDENTITY.md)
- [Implementation Slice 002 - Brand DNA](capabilities/IMPLEMENTATION_SLICE_002_BRAND_DNA.md)
- [Implementation Slice 003 - Offer Profile](capabilities/IMPLEMENTATION_SLICE_003_OFFER_PROFILE.md)
- [Implementation Slice 004 - Customer Intelligence](capabilities/IMPLEMENTATION_SLICE_004_CUSTOMER_INTELLIGENCE.md)
- [Implementation Slice 005 - Business Goals](capabilities/IMPLEMENTATION_SLICE_005_BUSINESS_GOALS.md)
- [Implementation Slice 006 - Business Understanding](capabilities/IMPLEMENTATION_SLICE_006_BUSINESS_UNDERSTANDING.md)
- [Implementation Slice 007 - Business Twin Activation](capabilities/IMPLEMENTATION_SLICE_007_BUSINESS_TWIN_ACTIVATION.md)

Release:

- [Capability Release](capabilities/CAPABILITY_RELEASE.md)
- [Release Tags](capabilities/RELEASE_TAGS.md)
- [Capability Retrospective](capabilities/CAPABILITY_RETROSPECTIVE.md)

---

## CAP-002 CRM

Capability Definition:

- [CAP-002 CRM Domain Model](capabilities/CAP-002_CRM_DOMAIN_MODEL.md)
- [CAP-002 CRM Use Cases](capabilities/CAP-002_CRM_USE_CASES.md)
- [CAP-002 CRM Events](capabilities/CAP-002_CRM_EVENTS.md)
- [CAP-002 CRM Application Specification](capabilities/CAP-002_CRM_APPLICATION_SPEC.md)
- [CAP-002 CRM Implementation Slices](capabilities/CAP-002_CRM_IMPLEMENTATION_SLICES.md)
- [CAP-002 CRM Pre-Implementation Resolution](capabilities/CAP-002_CRM_PRE_IMPLEMENTATION_RESOLUTION.md)
- [CAP-002 S-001 Customer Foundation Build Specification](capabilities/CAP-002_S-001_CUSTOMER_FOUNDATION_BUILD_SPECIFICATION.md)
- [CAP-002 S-001 Customer Foundation Implementation Tasks](capabilities/CAP-002_S-001_CUSTOMER_FOUNDATION_IMPLEMENTATION_TASKS.md)
- [CAP-002 S-001 Customer Foundation Implementation Report](capabilities/CAP-002_S-001_CUSTOMER_FOUNDATION_IMPLEMENTATION_REPORT.md)
- [CAP-002 S-001 Customer Foundation Verification Checklist](capabilities/CAP-002_S-001_CUSTOMER_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-002 S-001 Customer Foundation Release Notes](capabilities/CAP-002_S-001_CUSTOMER_FOUNDATION_RELEASE_NOTES.md)
- [CAP-002 S-001 Customer Foundation Audit Report](../../audit/CAP_002_S001_CUSTOMER_FOUNDATION_AUDIT_REPORT.md)
- [CAP-002 S-002 Lead Management Build Specification](capabilities/CAP-002_S-002_LEAD_MANAGEMENT_BUILD_SPECIFICATION.md)
- [CAP-002 S-002 Lead Management Implementation Tasks](capabilities/CAP-002_S-002_LEAD_MANAGEMENT_IMPLEMENTATION_TASKS.md)
- [CAP-002 S-002 Lead Management Implementation](capabilities/CAP-002_S-002_LEAD_MANAGEMENT_IMPLEMENTATION.md)
- [CAP-002 S-002 Lead Management Implementation Report](capabilities/CAP-002_S-002_LEAD_MANAGEMENT_IMPLEMENTATION_REPORT.md)
- [CAP-002 S-002 Lead Management Verification Checklist](capabilities/CAP-002_S-002_LEAD_MANAGEMENT_VERIFICATION_CHECKLIST.md)
- [CAP-002 S-003 Interaction Timeline Build Specification](capabilities/CAP-002_S-003_INTERACTION_TIMELINE_BUILD_SPECIFICATION.md)
- [CAP-002 S-003 Interaction Timeline Implementation](capabilities/CAP-002_S-003_INTERACTION_TIMELINE_IMPLEMENTATION.md)
- [CAP-002 S-003 Interaction Timeline Implementation Report](capabilities/CAP-002_S-003_INTERACTION_TIMELINE_IMPLEMENTATION_REPORT.md)
- [CAP-002 S-003 Interaction Timeline Verification Checklist](capabilities/CAP-002_S-003_INTERACTION_TIMELINE_VERIFICATION_CHECKLIST.md)
- [CAP-002 S-003 Interaction Timeline Release Notes](capabilities/CAP-002_S-003_INTERACTION_TIMELINE_RELEASE_NOTES.md)
- [CAP-002 S-004 Follow-Up Management Build Specification](capabilities/CAP-002_S-004_FOLLOW_UP_MANAGEMENT_BUILD_SPECIFICATION.md)
- [CAP-002 S-004 Follow-Up Management Implementation](capabilities/CAP-002_S-004_FOLLOW_UP_MANAGEMENT_IMPLEMENTATION.md)
- [CAP-002 S-004 Follow-Up Management Implementation Report](capabilities/CAP-002_S-004_FOLLOW_UP_MANAGEMENT_IMPLEMENTATION_REPORT.md)
- [CAP-002 S-004 Follow-Up Management Verification Checklist](capabilities/CAP-002_S-004_FOLLOW_UP_MANAGEMENT_VERIFICATION_CHECKLIST.md)
- [CAP-002 S-004 Follow-Up Management Release Notes](capabilities/CAP-002_S-004_FOLLOW_UP_MANAGEMENT_RELEASE_NOTES.md)
- [CAP-002 S-005 Customer Segmentation Build Specification](capabilities/CAP-002_S-005_CUSTOMER_SEGMENTATION_BUILD_SPECIFICATION.md)
- [CAP-002 S-005 Customer Segmentation Implementation Report](capabilities/CAP-002_S-005_CUSTOMER_SEGMENTATION_IMPLEMENTATION_REPORT.md)
- [CAP-002 S-005 Customer Segmentation Verification Checklist](capabilities/CAP-002_S-005_CUSTOMER_SEGMENTATION_VERIFICATION_CHECKLIST.md)
- [CAP-002 S-005 Customer Segmentation Release Notes](capabilities/CAP-002_S-005_CUSTOMER_SEGMENTATION_RELEASE_NOTES.md)
- [CAP-002 S-006 Search & Query Build Specification](capabilities/CAP-002_S-006_SEARCH_QUERY_BUILD_SPECIFICATION.md)
- [CAP-002 S-006 Search & Query Implementation Report](capabilities/CAP-002_S-006_SEARCH_QUERY_IMPLEMENTATION_REPORT.md)
- [CAP-002 S-006 Search & Query Verification Checklist](capabilities/CAP-002_S-006_SEARCH_QUERY_VERIFICATION_CHECKLIST.md)
- [CAP-002 S-006 Search & Query Release Notes](capabilities/CAP-002_S-006_SEARCH_QUERY_RELEASE_NOTES.md)
- [CAP-002 S-007 Import & Export Build Specification](capabilities/CAP-002_S-007_IMPORT_EXPORT_BUILD_SPECIFICATION.md)
- [CAP-002 S-007 Import & Export Implementation Report](capabilities/CAP-002_S-007_IMPORT_EXPORT_IMPLEMENTATION_REPORT.md)
- [CAP-002 S-007 Import & Export Verification Checklist](capabilities/CAP-002_S-007_IMPORT_EXPORT_VERIFICATION_CHECKLIST.md)
- [CAP-002 S-007 Import & Export Release Notes](capabilities/CAP-002_S-007_IMPORT_EXPORT_RELEASE_NOTES.md)
- [CAP-002 S-008 CRM Integration Events Build Specification](capabilities/CAP-002_S-008_CRM_INTEGRATION_EVENTS_BUILD_SPECIFICATION.md)
- [CAP-002 S-008 CRM Integration Events Implementation Report](capabilities/CAP-002_S-008_CRM_INTEGRATION_EVENTS_IMPLEMENTATION_REPORT.md)
- [CAP-002 S-008 CRM Integration Events Verification Checklist](capabilities/CAP-002_S-008_CRM_INTEGRATION_EVENTS_VERIFICATION_CHECKLIST.md)
- [CAP-002 CRM Release](capabilities/CAP-002_CRM_RELEASE.md)

Status:

```text
Released
```

Current Completed Slice:

```text
CAP-002 S-008 CRM Integration Events
```

S-001 Audit:

```text
PASS
```

S-001 Release:

```text
Approved
```

Next Phase:

```text
CAP-003
```

---

## CAP-003 Content

Capability Planning:

- [CAP-003 Content Planning](capabilities/CAP-003_CONTENT_PLANNING.md)
- [CAP-003 S-001 Content Asset Foundation Verification Checklist](capabilities/CAP-003_S-001_CONTENT_ASSET_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-003 S-002 Content Calendar Foundation Verification Checklist](capabilities/CAP-003_S-002_CONTENT_CALENDAR_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-003 S-003 Content Plan Foundation Verification Checklist](capabilities/CAP-003_S-003_CONTENT_PLAN_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-003 S-004 Content Variant Foundation Verification Checklist](capabilities/CAP-003_S-004_CONTENT_VARIANT_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-003 S-005 Content Performance Foundation Verification Checklist](capabilities/CAP-003_S-005_CONTENT_PERFORMANCE_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-003 S-006 Content Insight Foundation Verification Checklist](capabilities/CAP-003_S-006_CONTENT_INSIGHT_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-003 S-006 Content Insight Foundation Release Notes](capabilities/CAP-003_S-006_CONTENT_INSIGHT_FOUNDATION_RELEASE_NOTES.md)
- [CAP-003 S-007 Content Recommendation Foundation Verification Checklist](capabilities/CAP-003_S-007_CONTENT_RECOMMENDATION_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-003 S-007 Content Recommendation Foundation Release Notes](capabilities/CAP-003_S-007_CONTENT_RECOMMENDATION_FOUNDATION_RELEASE_NOTES.md)
- [CAP-003 S-008 Content Execution Foundation Verification Checklist](capabilities/CAP-003_S-008_CONTENT_EXECUTION_FOUNDATION_VERIFICATION_CHECKLIST.md)
- [CAP-003 S-008 Content Execution Foundation Release Notes](capabilities/CAP-003_S-008_CONTENT_EXECUTION_FOUNDATION_RELEASE_NOTES.md)
- [CAP-003 Content Capability Verification Checklist](capabilities/CAP-003_CONTENT_CAPABILITY_VERIFICATION_CHECKLIST.md)
- [CAP-003 Content Release](capabilities/CAP-003_CONTENT_RELEASE.md)

Status:

```text
Released
```

Next Phase:

```text
CAP-004 Campaign Planning
```

---

## CAP-004 Campaign

Capability Planning:

- [CAP-004 S-001 Planning](capabilities/CAP-004_S-001_PLANNING.md)
- [CAP-004 S-001 Verification Report](capabilities/CAP-004_S-001_VERIFICATION_REPORT.md)
- [CAP-004 S-001 Slice Release](capabilities/CAP-004_S-001_SLICE_RELEASE.md)
- [CAP-004 S-002 Planning](capabilities/CAP-004_S-002_PLANNING.md)
- [CAP-004 S-002 Verification Report](capabilities/CAP-004_S-002_VERIFICATION_REPORT.md)
- [CAP-004 S-002 Slice Release](capabilities/CAP-004_S-002_SLICE_RELEASE.md)
- [CAP-004 S-003 Planning](capabilities/CAP-004_S-003_PLANNING.md)
- [CAP-004 S-003 Verification Report](capabilities/CAP-004_S-003_VERIFICATION_REPORT.md)
- [CAP-004 S-003 Slice Release](capabilities/CAP-004_S-003_SLICE_RELEASE.md)
- [CAP-004 S-004 Planning](capabilities/CAP-004_S-004_PLANNING.md)
- [CAP-004 S-004 Verification Report](capabilities/CAP-004_S-004_VERIFICATION_REPORT.md)
- [CAP-004 S-004 Slice Release](capabilities/CAP-004_S-004_SLICE_RELEASE.md)
- [CAP-004 S-005 Planning](capabilities/CAP-004_S-005_PLANNING.md)
- [CAP-004 S-005 Verification Report](capabilities/CAP-004_S-005_VERIFICATION_REPORT.md)
- [CAP-004 S-005 Slice Release](capabilities/CAP-004_S-005_SLICE_RELEASE.md)
- [CAP-004 Capability Verification Report](capabilities/CAP-004_CAPABILITY_VERIFICATION_REPORT.md)
- [CAP-004 Campaign Release](capabilities/CAP-004_CAMPAIGN_RELEASE.md)

Status:

```text
Released
```

Next Phase:

```text
CAP-005 Slice Planning
```

---

## CAP-005 Revenue

Capability Planning:

- [CAP-005 Revenue Planning](capabilities/CAP-005_REVENUE_PLANNING.md)
- [CAP-005 S-001 Planning](capabilities/CAP-005_S-001_PLANNING.md)
- [CAP-005 S-001 Revenue Domain Foundation Verification Report](capabilities/CAP-005_S-001_REVENUE_DOMAIN_FOUNDATION_VERIFICATION_REPORT.md)
- [CAP-005 S-001 Slice Release](capabilities/CAP-005_S-001_SLICE_RELEASE.md)
- [CAP-005 S-002 Planning](capabilities/CAP-005_S-002_PLANNING.md)
- [CAP-005 S-002 Revenue Application Foundation Verification Report](capabilities/CAP-005_S-002_REVENUE_APPLICATION_FOUNDATION_VERIFICATION_REPORT.md)
- [CAP-005 S-002 Slice Release](capabilities/CAP-005_S-002_SLICE_RELEASE.md)
- [CAP-005 S-003 Planning](capabilities/CAP-005_S-003_PLANNING.md)
- [CAP-005 S-003 Revenue Target Management Verification Report](capabilities/CAP-005_S-003_REVENUE_TARGET_MANAGEMENT_VERIFICATION_REPORT.md)
- [CAP-005 S-003 Slice Release](capabilities/CAP-005_S-003_SLICE_RELEASE.md)
- [CAP-005 S-004 Planning](capabilities/CAP-005_S-004_PLANNING.md)

Status:

```text
S-004 Planning
```

Next Phase:

```text
CAP-005 S-004 Implementation
```

---

## Engineering

Core:

- [Engineering Standards](engineering/ENGINEERING_STANDARDS.md)
- [NextShift Standards v1.0](standards/README.md)
- [Engineering Workflow](engineering/ENGINEERING_WORKFLOW.md)
- [NextShift Engineering Workflow Standard (NEWS) v1.0](engineering/NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md)
- [STD-002 AI Role Framework v1.0](engineering/STD-002_AI_ROLE_FRAMEWORK_v1.0.md)
- [STD-003 Documentation Standard v1.0](engineering/STD-003_DOCUMENTATION_STANDARD_v1.0.md)
- [STD-004 Release Governance v1.0](engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md)
- [Engineering Playbook](engineering/ENGINEERING_PLAYBOOK.md)

Implementation:

- [Implementation Cycle](engineering/IMPLEMENTATION_CYCLE.md)

Implementation History:

- [Implementation Cycles](engineering/implementation-cycles/README.md)

---

## Sprint History

Sprint Dashboard:

- [Sprints](sprints/README.md)

Sprint Documents:

- [Sprint 000 - Blueprint Cleanup](sprints/SPRINT-000_BLUEPRINT_CLEANUP.md)
- [Sprint 001 - Project Skeleton](sprints/SPRINT-001_TASK-001_PROJECT_SKELETON.md)

Patch History:

- [Sprint 000 Task 005 Patch](sprints/SPRINT-000_TASK-005_PATCH.md)

---

## Repository

```text
docs/
packages/
apps/
```

Documentation:

- Blueprint
- Runtime
- Engineering
- Capabilities
- Sprints

Runtime:

- `packages/`

Applications:

- `apps/`

---

## Current Reference Capability

Reference Capability:

```text
CAP-001 Business Profile
```

Current Status:

```text
Frozen
```

All future capabilities should follow the engineering and architectural patterns established by CAP-001 unless superseded by an approved architectural decision.

---

## Current Roadmap

Completed:

- Blueprint
- Runtime
- CAP-001 Business Profile

Current:

```text
CAP-002 CRM
```

Future:

- Content
- Campaign
- Revenue
- Analytics
- AI Coach

---

## Navigation Principles

The documentation system follows four levels:

```text
README
        |
        v
MASTER_INDEX
        |
        v
Status Dashboards
        |
        v
Detailed Specifications
```

Use:

- README to understand the project.
- MASTER_INDEX to locate documentation.
- Status dashboards to understand current progress.
- Detailed specifications for implementation.

---

## Guiding Principle

Documentation should be discoverable, structured, and authoritative.

Every important engineering decision should be traceable through the documentation hierarchy.
