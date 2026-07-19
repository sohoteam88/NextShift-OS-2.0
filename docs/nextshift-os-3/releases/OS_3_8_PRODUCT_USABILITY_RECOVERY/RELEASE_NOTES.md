# OS 3.8 — Product Usability Recovery Release Notes

Proposal version: `v3.8.0`

Status: **RC package prepared / not deployed**
Last updated: 2026-07-19

---

## Summary

OS 3.8 is a usability recovery release. It turns generated content into work that can be edited, saved, reopened, copied, retried, and safely managed instead of remaining a read-only demonstration.

These notes describe the reviewed Release Candidate source. OS 3.8 has not been deployed; production remains v3.7.0.

## Highlights

### Canonical Content Working Loop

Content Engine output retains a canonical content identity through edit, save, retry, refresh, and copy. Save races preserve newer local edits, failed saves retain user input, and generation or replacement is explicit.

### Content Library

Saved content is discoverable in a bounded, tenant- and owner-scoped library. Users can reopen, edit, save, copy, and delete the same canonical record with accessible dialogs, dirty-state protection, and session-safe feedback.

### Information Architecture and Navigation

The approved route map converges desktop and mobile navigation without creating a second route registry. Content Engine and Content Library are discoverable in one product area, redirects terminate in one hop, and deep-link compatibility is explicit.

### Three Isolated Product Spaces

The product now separates:

- member-facing work;
- tenant administration under `/admin/*`;
- platform administration under `/superadmin/*`.

Role and tenant boundaries are enforced server-side. Member navigation exposes no backend links, and legacy privileged mutations fail closed rather than using redirects.

### Admin and Superadmin Audit Safety

Tenant-admin APIs remain session-tenant scoped. Platform writes use the approved AuditLog authority, durable failure evidence, idempotency controls, ordering, conflict handling, and deleted-tenant terminal-state rules. The implementation includes real PostgreSQL verification.

### Video, Lead Magnet, and Webinar Recovery

The E3 revalidation identified only proven gaps, then closed them: owner-safe Video handling and current-value copy, concurrency-safe Lead Magnet persistence and partial retry, and Webinar edit/save/reopen/copy/delete plus explicit regenerate/replace recovery behavior.

## Known Non-blocking Follow-up

Two Minor findings and two Observations from the Final Audit remain recorded for v3.8.1. They concern a developer utility path, an overlapping ShellCheck glob, dependency advisories below the high gate, and legacy platform-admin GET read compatibility. This RC package does not change audited code to address them.

## Release Boundary

This package does not claim that OS 3.8 is released, tagged, deployed, production current, or migrated in production. A separate reviewed planning-to-main Release PR and separate production approvals are still required.
