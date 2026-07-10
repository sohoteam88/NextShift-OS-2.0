# Audit Validation Checklist

Project: Repository Architecture Reset v1.0
Migration Unit: MU-004 Audit Registry Migration
Status: Review checklist

## Required Command Validation

```text
git status --short
git diff --check
git diff --cached --check
```

## Link Validation

- [ ] `audit/index.md` local links resolve.
- [ ] MU-004 package artifact links resolve.
- [ ] Current audit evidence links resolve.
- [ ] Companion registry links resolve:
  - [ ] `platform/index.md`
  - [ ] `platform/status.md`
  - [ ] `governance/index.md`
  - [ ] `releases/index.md`

## Audit Evidence Validation

- [ ] RAR audit reports are discoverable.
- [ ] Business OS audit reports are discoverable.
- [ ] Capability audit families are discoverable.
- [ ] Release package audit evidence is discoverable.
- [ ] Documentation audit area is discoverable.
- [ ] Project-local audit reports remain at current paths.

## Preservation Validation

- [ ] No audit report content changed.
- [ ] No audit evidence deleted.
- [ ] No audit findings reinterpreted.
- [ ] No audit directories moved.
- [ ] Future taxonomy paths are labeled as future targets.

## Boundary Validation

- [ ] No runtime files changed.
- [ ] No governance migration performed.
- [ ] No release migration performed.
- [ ] No platform project migration performed.
- [ ] No production or deployment changes performed.

## Future Migration Readiness

- [ ] Audit taxonomy documented.
- [ ] Evidence family manifest exists.
- [ ] Compatibility map exists.
- [ ] Rollback checklist exists.
