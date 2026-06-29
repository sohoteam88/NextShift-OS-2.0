## CAP-002 Use Cases

Version: v1.0

Capability: CAP-002 CRM

Status: Draft

Reference Capability: CAP-001 Business Profile v1.0 (Frozen)

---

## Purpose

This document defines the application use cases supported by the CRM capability.

Each use case represents an application-level operation executed through application services.

Business rules are enforced by the domain model, while orchestration is handled by the application layer.

---

## Actors

- Business Owner
- Sales Representative
- Customer Service
- Marketing
- Automation Engine
- System Administrator
- External Integrations

---

## Customer Management

### UC-001 Create Customer

Goal:

Create a new customer profile.

Preconditions:

- Customer does not already exist.
- Required information is provided.

Flow:

1. Validate request.
2. Create Customer aggregate.
3. Persist Customer.
4. Publish CustomerCreated event.

Result:

Customer is active.

### UC-002 Update Customer

Goal:

Modify customer information.

Preconditions:

- Customer exists.
- Customer is not archived.

Flow:

1. Load Customer.
2. Apply updates.
3. Validate invariants.
4. Save.
5. Publish CustomerUpdated.

### UC-003 Archive Customer

Goal:

Deactivate a customer while preserving history.

Preconditions:

- Customer exists.

Result:

Customer status becomes Archived.

### UC-004 Restore Customer

Goal:

Restore an archived customer.

Result:

Customer becomes Active again.

### UC-005 Merge Customers

Goal:

Merge duplicate customer records.

Flow:

1. Identify master customer.
2. Merge interactions.
3. Merge follow-ups.
4. Merge tags.
5. Archive duplicate.
6. Publish CustomerMerged.

---

## Lead Management

### UC-006 Create Lead

Create a new lead from any acquisition channel.

### UC-007 Update Lead

Modify lead information.

### UC-008 Qualify Lead

Evaluate readiness for conversion.

### UC-009 Convert Lead

Convert a qualified lead into a Customer.

Result:

- Customer created.
- Lead marked Converted.

### UC-010 Close Lead

Close an unqualified lead.

---

## Interaction Management

### UC-011 Record Interaction

Record a customer interaction.

Supported interaction types include:

- Call
- Meeting
- Email
- WhatsApp
- SMS
- Visit
- Note

### UC-012 View Customer Timeline

Retrieve the chronological interaction history for a customer.

### UC-013 Add Customer Note

Append an internal note to the customer record.

---

## Follow-Up Management

### UC-014 Schedule Follow-Up

Create a follow-up task.

### UC-015 Update Follow-Up

Modify follow-up details.

### UC-016 Complete Follow-Up

Mark a follow-up as completed.

### UC-017 Cancel Follow-Up

Cancel a pending follow-up.

### UC-018 List Overdue Follow-Ups

Retrieve all overdue follow-up tasks.

---

## Segmentation

### UC-019 Create Segment

Create a customer segment.

### UC-020 Update Segment

Modify segment rules.

### UC-021 Evaluate Segments

Refresh customer memberships based on segment rules.

### UC-022 Assign Customer to Segment

Associate a customer with one or more segments.

---

## Search

### UC-023 Search Customers

Search by:

- Name
- Phone
- Email
- Tag
- Status
- Segment

### UC-024 Search Leads

Search leads using business criteria.

---

## Administration

### UC-025 Export Customers

Export customer data.

### UC-026 Import Customers

Bulk import customer records.

### UC-027 Rebuild Segments

Recalculate all segment memberships.

---

## System Use Cases

Performed automatically.

- Generate Follow-Up Reminder
- Detect Duplicate Customer
- Evaluate Segment Membership
- Publish Domain Events
- Synchronize External Systems

---

## Summary

| Category       | Use Cases |
| -------------- | --------- |
| Customer       | 5         |
| Lead           | 5         |
| Interaction    | 3         |
| Follow-Up      | 5         |
| Segment        | 4         |
| Search         | 2         |
| Administration | 3         |
| Total          | 27        |

---

## Outputs

Successful use cases may publish one or more domain events.

Examples:

- CustomerCreated
- CustomerUpdated
- LeadConverted
- InteractionRecorded
- FollowUpScheduled
- SegmentAssigned

The complete event contracts are defined in the next phase.

---

## Audit Checklist

- All primary business workflows identified
- Actors documented
- Preconditions defined
- Business outcomes defined
- Aggregate boundaries respected
- Domain logic delegated to aggregates
- Event publication identified

Status: Ready for Event Modeling

---

## Next Phase

CAP-002 Events
