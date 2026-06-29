## CAP-002 S-007 Import & Export Build Specification

Version: v1.0

Capability: CAP-002 CRM

Implementation Slice: S-007 Import & Export

Status: Ready for Implementation

Prerequisite Slices:

- CAP-002 S-001 Customer Foundation - PASS
- CAP-002 S-002 Lead Management - PASS
- CAP-002 S-003 Interaction Timeline - PASS
- CAP-002 S-004 Follow-Up Management - PASS
- CAP-002 S-005 Customer Segmentation - PASS
- CAP-002 S-006 Search & Query - PASS

Reference Capability:

- CAP-001 Business Profile v1.0 (Frozen)

Engineering Baseline:

- Blueprint v1.0
- Core Runtime v1.0
- Engineering Playbook v1.1

## Objective

Implement Import & Export as the seventh CRM implementation slice.

This slice enables bulk import and export of CRM data while preserving aggregate invariants, repository contracts, and application boundaries.

Import operations must always execute through application services rather than writing directly to repositories.

## Scope

Included:

- Customer import
- Lead import
- Customer export
- Lead export
- Import validation
- Duplicate detection
- Import result reporting
- Export DTO generation
- Unit tests

Excluded:

- Streaming imports
- Scheduled imports
- External storage connectors
- Spreadsheet formatting
- Production persistence

## Design Principles

- Imports use application services.
- Exports use query services.
- Aggregate invariants remain enforced.
- No direct repository writes from import parsers.
- Import failures do not partially corrupt aggregate state.

## Import Services

Implement:

- CRMImportService

Supported operations:

- importCustomers()
- importLeads()

Responsibilities:

- Validate input records
- Detect duplicates
- Call CustomerApplicationService
- Call LeadApplicationService
- Produce import summary

## Export Services

Implement:

- CRMExportService

Supported operations:

- exportCustomers()
- exportLeads()

Responsibilities:

- Use CRMQueryService
- Produce immutable export DTOs
- Preserve field ordering
- No aggregate mutation

## Import Validation

Validate:

- Required fields
- Email format
- Phone format
- Duplicate identifiers
- Duplicate email
- Duplicate phone
- Business ownership

Validation failures must be reported per record.

## Duplicate Handling

Duplicate policy:

- Existing customer -> skip
- Existing lead -> skip
- Invalid record -> reject
- Successful record -> import

Import continues after recoverable failures.

## Import Result

Provide:

- Total records
- Imported
- Skipped
- Failed
- Validation errors

## Public API

Export:

- CRMImportService
- CRMExportService
- Import DTOs
- Export DTOs
- Validation result DTOs

Do not modify existing application services.

## Testing

## Import Tests

Required:

- Customer import
- Lead import
- Duplicate detection
- Validation failures
- Partial success
- Empty file

## Export Tests

Required:

- Customer export
- Lead export
- DTO correctness
- Immutable exports

## Regression Tests

Verify:

- S-001 PASS
- S-002 PASS
- S-003 PASS
- S-004 PASS
- S-005 PASS
- S-006 PASS

## Validation

Run:

```text
pnpm --filter @nextshift/domain test
pnpm --filter @nextshift/application test

pnpm --filter @nextshift/domain typecheck
pnpm --filter @nextshift/application typecheck
```

Requirements:

- All tests pass.
- Typecheck passes.
- No regressions.

## Expected Deliverables

Application:

- CRMImportService
- CRMExportService
- Import/Export DTOs

Documentation:

- Implementation Report
- Verification Checklist
- Audit Report
- Release Notes

## Constraints

- Imports must use application services.
- Exports must use query services.
- No aggregate mutation outside application services.
- No runtime redesign.
- No governance changes.
- Preserve backward compatibility.

## Exit Criteria

S-007 is complete when:

- Import services operational.
- Export services operational.
- Validation operational.
- Duplicate handling operational.
- Tests passing.
- Typecheck passing.
- Regression tests passing.
- Documentation prepared for verification.

## Ready for Implementation

Upon approval, proceed to:

```text
CAP-002 S-007 Import & Export Code Implementation
```

Status:

```text
Ready for Implementation
```
