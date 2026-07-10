# STD-005 GitHub Alignment Standard v1.0

Version: 1.0

Status: Approved

Last Updated: 2026-07-02

---

## Purpose

Define the GitHub alignment and production traceability rules for every NextShift release.

This standard ensures that local work, GitHub release branches, release tags, VPS deployed revisions, and running production are verifiably aligned before a release is considered complete.

STD-005 does not replace the engineering lifecycle in STD-001 or the release governance process in STD-004. It defines the repository, tag, and deployment alignment gate used by those standards.

---

## Scope

Applies to:

- Release branches
- Release tags
- Planning branches
- Feature branches
- Hotfix branches
- GitHub pushes
- VPS production deployments
- Archive deployments
- Deployment manifests
- Production alignment reports

---

## Branch Strategy

```text
main
  release/*
  planning/*
  feature/*
  hotfix/*
```

### `release/*`

- Stable release-candidate branch.
- Must contain only verified release work.
- May be deployed to production after all release gates pass.
- Must remain clean after a release candidate is verified.

### `planning/*`

- Used for documentation, architecture, roadmaps, standards, and future planning.
- Must not be deployed directly to production.
- Must not move an existing release tag.

### `feature/*`

- Used for implementation work before release qualification.
- Must pass verification before merge to a release branch.

### `hotfix/*`

- Used for urgent production fixes.
- Must be merged into the appropriate release branch after verification.
- Must result in a new verified commit and tag movement only when the release owner approves it.

---

## GitHub Traceability Source Of Truth

GitHub is the release traceability source of truth.

Production may be built through Git checkout, archive deployment, Docker image build, or another approved deployment mechanism, but every running production revision must be traceable to:

- GitHub repository
- Release branch
- Release tag, when the release level requires a tag
- Commit hash
- Deployment manifest

Production servers must never become the source of truth for application source code.

---

## Release Branch And Tag Alignment

For a tagged release candidate:

```text
GitHub release branch HEAD = release tag target = verified release commit
```

Required checks:

- `git rev-parse origin/<release-branch>`
- `git rev-parse <release-tag>^{}`
- `git status --short`
- `git tag --points-at HEAD`
- `git ls-remote --tags origin <release-tag>`

If the release tag does not point to the verified release branch commit, stop the release and resolve the mismatch before deployment.

---

## VPS Deployed Revision Standard

Every VPS production deployment must record the deployed Git commit.

The recorded revision must be:

- The full verified Git commit hash when available.
- A short hash only when legacy deployment tooling already records short hashes.
- Stored in a durable file or deployment manifest that survives container restarts.

The standard deployed revision file is:

```text
.deployed-revision
```

Required VPS checks:

- Deployed project path
- Recorded deployed revision
- Running process manager or Docker Compose status
- Running service or container name
- Runtime command
- Health endpoint result

---

## Archive Deployment Compatibility

Archive deployment is permitted when the deployment artifact is produced from a verified Git commit and the deployed revision is recorded.

For archive deployments:

1. Produce the archive from the verified release commit.
2. Deploy the archive to the approved VPS project path.
3. Write the verified commit hash to `.deployed-revision`.
4. Build and restart the production service.
5. Verify that `.deployed-revision` matches the release branch and release tag.

Archive deployment does not make the VPS directory a Git repository. In that case, `.deployed-revision` is the production commit authority on the VPS.

---

## Deployment Manifest Requirements

Every production release must produce or update a deployment manifest containing:

- Release name
- Release branch
- Release tag, if applicable
- GitHub commit hash
- Deployment method
- Deployment path
- Production URL
- Deployment date
- Process manager
- Running service
- Runtime command
- Build result
- Restart result
- Health check result
- Verification commands executed
- Final alignment result

The deployment manifest may be a release report, VPS alignment report, or dedicated manifest file, as long as the required fields are present.

---

## Production Alignment Gate

Production is aligned only when:

```text
Local = GitHub branch = Release tag = VPS deployed revision = Running production
```

For archive deployments, the VPS deployed revision is read from `.deployed-revision`.

The running production service must also be verified by:

- Process manager status
- Running service path or container image
- Runtime command
- Public URL response
- Health endpoint response, when available

Any mismatch blocks release completion.

---

## Release Freeze Rule

After a release candidate is verified:

- Do not commit planning documents to the release branch.
- Do not merge experimental work into the release branch.
- Do not move the release tag unless a new verified release commit is intentionally created.
- Do not redeploy production unless alignment verification shows a mismatch or an approved fix is ready.
- Continue planning work on `planning/*` branches.

---

## Codex Verification Checklist

For release alignment work, Codex must verify:

- Current branch
- Working tree status
- Local commit
- GitHub release branch commit
- Release tag target
- Relevant release tags
- VPS deployed revision
- Production process manager status
- Running service path or container command
- Build and verification results, when deployment is performed
- Public URL and health endpoint results, when available
- Whether production redeploy was required

Codex must report mismatches clearly and must not modify production without explicit release intent and verification evidence.

---

## Applies With

- STD-001 Engineering Workflow Standard
- STD-002 AI Role Framework
- STD-003 Documentation Standard
- STD-004 Release Governance
- NextShift Engineering Workflow Standard
- Engineering Workflow
- Engineering Playbook
- Repository Structure Standard
- Traceability Standard
- Change Management Standard
