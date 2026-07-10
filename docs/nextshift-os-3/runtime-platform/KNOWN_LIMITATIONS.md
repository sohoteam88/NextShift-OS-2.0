# Known Limitations

Version: 1.0

Status: Frozen

Last Updated: 2026-07-09

---

## Runtime Scope

Runtime Platform v1.0 approves the adapter pattern.

It does not approve broad Runtime Integration across the full application.

---

## Dashboard Is Not Integrated

Dashboard Projection Runtime Integration remains a high-risk target.

The Runtime Readiness Review identified Dashboard integration as high risk because it touches a broad service graph, Prisma-bound data, mission authority, business memory, execution, workforce, analytics, and product experience paths.

---

## Business Brain Is Not Runtime-Critical Yet

Business Brain remains important to the architecture, but it was not selected as an early runtime integration target because package-level tests were not mature enough at the time of the Runtime Readiness Review.

Runtime Platform v1.0 does not activate Business Brain as a runtime decision authority.

---

## Decision Brain Is Not Integrated

Decision Brain has cleaner package boundaries than Business Brain, but Runtime Platform v1.0 does not integrate it into application runtime behavior.

Decision Brain should receive its own pilot plan before adapter implementation.

---

## Runtime Events Are Not Persisted By The Adapters

The reference adapters create runtime context, capability, event, diagnostics, and metadata, but they do not establish a new persistence pipeline for runtime events.

---

## Feature Flags Default OFF

The platform depends on default-OFF runtime feature flags.

Runtime behavior is available only when a module-specific flag is explicitly set to exact string value `true`.

---

## Review Evidence Must Continue To Be Archived

Pilot 1 code review evidence is archived in repository documentation.

Future pilot review reports should be archived in the relevant pilot documentation path before platform promotion.
