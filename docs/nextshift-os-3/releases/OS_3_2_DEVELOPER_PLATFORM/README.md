# OS 3.2 Developer Platform Release

Version: 3.2

Status: Release Prepared

Last Updated: 2026-07-06

---

## Purpose

This release package prepares the NextShift OS 3.2 Developer Platform release for production approval.

It consolidates release notes, manifest, version history, final repository verification, and release tag preparation without implementing new product or runtime features.

---

## Release Package

- [Release Notes](RELEASE_NOTES.md)
- [Release Manifest](RELEASE_MANIFEST.md)
- [Version History](VERSION_HISTORY.md)
- [Final Verification](FINAL_VERIFICATION.md)
- [Tag Preparation](TAG_PREPARATION.md)
- [Release Ceremony Checklist](RELEASE_CEREMONY_CHECKLIST.md)
- [Release Ceremony Script](RELEASE_CEREMONY_SCRIPT.md)
- [Release Ceremony Manifest](RELEASE_CEREMONY_MANIFEST.md)

---

## Release Scope

OS 3.2 Developer Platform packages the repository and platform readiness work completed on `planning/os-3.1-mvp-governance` after OS 3.1 RC1.

Included:

- Project Context System v1.0
- Project Context Package Generator
- Repository workflow metadata synchronization
- Platform integration validation
- Deployment readiness review
- Developer-facing release documentation and release tag preparation

Excluded:

- New business features
- Production deployment execution
- Production database migration execution
- Release tag creation

---

## Release Decision

Current decision:

```text
Prepared for Production Approval
```

Approval remains required before:

- Creating the release tag
- Promoting a release branch
- Running production deployment
- Running production database migrations
