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
