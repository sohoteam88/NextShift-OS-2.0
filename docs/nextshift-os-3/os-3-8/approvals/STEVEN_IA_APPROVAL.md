# OS 3.8 STEVEN-IA Approval

HUMAN_GATE=STEVEN-IA
DECISION=APPROVED
APPROVED_BY=Steven
APPROVED_AT=2026-07-16T11:03:03Z
APPROVED_PLANNING_BASE_SHA=f2f77709596fc74099d57dfe54bc009183c70c03
AR_W2_REVIEWED_SHA=2e22f478bc092ee729d66e65b490565e3ac1723f
AR_W2_REVIEW_ID=4712447288
CANONICAL_IA=docs/nextshift-os-3/os-3-8/3.8-C/U2_INFORMATION_ARCHITECTURE.md

## Steven's approval

> 批准推荐 IA 方案：五个待定 route 全部设为 Hide；批准七个桌面目的地、五槽 mobile projection、完整 112-route map 与上述治理边界。授权创建 STEVEN-IA approval governance PR，但不授权直接 merge、删除、部署或发布。

Steven added three mandatory conditions:

1. 起号引导/学习内容（Roadmap v1.2 B5）的导航归属必须在本 map 内指定。
2. “Retail/Recruitment 共用 route identity”只约束导航层，不减损 Roadmap v1.2 §1.6 的 mode 数据层隔离，包括一等字段、双管道和毕业桥。
3. 本 map 是 IA 唯一正典；`U2_IA_ONE_PAGER.md` 必须引用 canonical map 并标记 SUPERSEDED。

## Approved information architecture

- Seven desktop destinations: Today, Journey, Brand, Content, Growth, Relationships, Team.
- Five-slot mobile projection: Today, Content, Growth, Relationships, More.
- Complete 112-route map: Keep 55, Merge 9, Hide 26, Redirect 22, Unresolved 0.
- `/automation`, `/blueprints`, `/franchise`, `/localization`, and `/saas` are all Hide. Hide removes them from primary/mobile navigation while preserving current direct/deep links; it is not deletion or redirect authority.
- Journey `/journey` is the canonical navigation home for Roadmap v1.2 B5 starting-account guidance, staged learning, next-task ordering, and progress resumption. This does not approve other Stage B/C capability expansion.
- Shared Retail/Recruitment route identity applies only to navigation. `mode` remains a first-class field; dual CRM/relationship pipelines and their data semantics remain isolated; the graduation bridge remains explicit and auditable.
- `docs/nextshift-os-3/os-3-8/3.8-C/U2_INFORMATION_ARCHITECTURE.md` is the sole canonical IA path.
- No Merge or Redirect may weaken a source role, tenant, or capability boundary.
- Every Merge or Redirect destination must terminate directly at a Keep route and may not form a decision chain.

## Authorization boundary

- This approval unlocks only later controlled W3 task selection after this governance PR is reviewed and merged.
- U1B may only prepare a per-file removal PR for `ORPHAN_CANDIDATE` paths already listed by U1A.
- STEVEN-IA does not directly authorize deletion of any file.
- Every proposed removal must be listed in its PR, prove the absence of runtime consumers, pass the required tests, and receive Architecture Review.
- U3 may implement only the approved canonical map.
- This approval does not authorize deployment, tag, release, production mutation, or any other Roadmap v1.2 Stage B/C capability expansion.

## Amendment A — Three-Space Administration Isolation

Steven formally approved this amendment on 2026-07-17. It is append-only governance: the original control lines and approved seven-destination desktop / five-slot mobile member IA above remain unchanged.

The approved authority model has three non-overlapping spaces:

1. **Member frontend** — the approved seven desktop destinations and five-slot mobile projection remain authoritative. Member-facing desktop, mobile, workspace, and utility navigation expose zero administration links. Administration is reachable only by an authorized direct URL.
2. **Team administration** — `/admin/*` is the tenant administration namespace and permits only `leader` or `operator`, subject to route-level least privilege. Every read and mutation is tenant-scoped. Its `tenantId` comes only from the authenticated session; query, path, body, and header values are never tenant authority. The shell carries an unmistakable **ADMIN** visual identity.
3. **Platform administration** — `/superadmin/*` is the platform administration namespace and permits only `platform_admin`. All current `/platform-admin/*` and `/admin-command` capabilities migrate into this namespace. The shell carries an unmistakable **PLATFORM** visual identity, is absent from member and team-admin navigation, and every write produces an `AuditLog` record.

The API namespaces mirror the page boundaries: team administration uses `/api/v1/admin/*` with `leader`/`operator` authorization plus session-derived tenant scope; platform administration uses `/api/v1/superadmin/*` with `platform_admin` authorization. A shared ambiguous guard followed by a client-selected tenant or privilege mode is prohibited. No role, tenant, or capability boundary may be weakened during consolidation.

Legacy administration page GET routes use one-hop `301` compatibility redirects: `/platform-admin` and its children map to the corresponding `/superadmin` destination, and `/admin-command` maps to `/superadmin/command`. Only allowlisted query/bookmark state is preserved. A legacy platform route may never redirect into `/admin/*`, and redirect chains are prohibited.

Mutation APIs never use `301` or `302`. Callers should migrate to the new endpoint and the old mutation endpoint should fail closed. If a bounded compatibility window is separately approved, only method-preserving `308` is allowed, and both entry points must execute identical authorization, validation, tenant rules, and `AuditLog` behavior; compatibility may not retain a weaker guard.

Every superadmin write records at least actor ID and role, action, target type and ID, target tenant when applicable, request/correlation ID, success or failure, redacted metadata, and timestamp. Tokens, secrets, passwords, and complete sensitive payloads are prohibited from audit metadata. Tenant-targeted writes use the target tenant's `tenantId`. The U3ADR reviewed-decision proposal selects nullable `AuditLog.tenantId` plus an explicit tenant/platform scope; it is not adopted until an exact-head PASS review and separate production-runner governance transaction. No schema change is authorized here.

This amendment is additional U3 implementation scope and inserts U3A (inventory/security contract), U3ADR (AuditLog decision gate), and U3B (three-space migration) before E3A. It authorizes documentation, planning, and separately reviewed implementation tasks only. It does not authorize direct merge, Prisma migration, deployment, tagging, release, or production modification.

Architecture Review clarification: Steven's approval applies to the amendment direction; the governance contract remains pending exact-head Architecture Review until PR #96 receives PASS and is merged. The Manifest-owned immutable policy, machine-readable `U3_AUDITLOG_ADR_DECISION.json`, and pending canonical `U3_AUDITLOG_ADR_GATE.json` add U3ADR between U3A and U3B. U3B remains Manifest `blocked` until that task records a fresh exact-head PASS decision and a separate production-runner governance adoption explicitly unblocks it. The mandatory new audit scope is every `/api/v1/superadmin/*` write; this amendment does not independently expand audit requirements for `/api/v1/admin/*` writes beyond existing approved behavior.
