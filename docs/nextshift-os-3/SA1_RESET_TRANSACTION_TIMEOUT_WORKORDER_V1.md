# SA1 重置事务超时返修 · F-38 工单 v1

> 性质：正常 pipeline 执行、**HUMAN_GATE**。本项复用既有 `SA1` ID，原能力已由 PR #182
> 于 2026-07-28 合并；此次只为 F-38 修复其生产事务超时。现有 pipeline 对 `SA1` 会在
> Step 3 自动暂停，PR 必须留 open 候 Fable 复审，不得自动合并。
>
> 顺序：P1 合并后执行本项；P1 与本项均合并后，共用一次 Final Release 发布链。
> 定稿：2026-08-05。

## 生产事实

- 超管重置业务数据报「系统出错了」；生产日志记录 `Transaction API error: Transaction not found`，
  在 `content.deleteMany`、`funnel.deleteMany` 等后续删除处暴露。
- Prisma interactive transaction 默认 timeout 为 5,000 ms。故障时操作单有 21 条连续
  `deleteMany`；当前 `src/modules/admin/services/user-data-reset-service.ts` 已有 23 条。
  在约 350 ms 的单次跨洲往返下，21 条删除本身已超过默认预算。
- F-37 已排除连接泄漏；`connection_limit=5` 的修复保留。本项不改连接池、环境或地理部署。

## 必做修复

1. 在 `resetUserBusinessDataWithAudit()` 的同一个 `db.$transaction()` 调用上显式传入：

   ```ts
   { timeout: 60000, maxWait: 15000 }
   ```

2. 保持所有删除、metadata 清理、成功审计写入在同一个 interactive transaction 中。不得改成
   transaction 外循环、多个独立 transaction、后台任务或 best-effort 删除。
3. 失败时现有整体回滚和失败审计语义必须保留：目标数据不能被删一半，同 tenant 的其他用户
   数据不得触及，且 failure audit 不得遮蔽原始错误。
4. 更新/新增定向测试，证明：
   - `$transaction` 收到 callback 与精确 `{ timeout: 60000, maxWait: 15000 }`；
   - 任一删除失败时全部目标删除及 metadata 更新均回滚；
   - 成功 receipt、tenant/user 范围与审计字段不回归。

## 全库 interactive transaction 审计（静态，2026-08-05）

下表只列 **事务内串行数据库操作数 > 5** 的源码路径；数组型 `$transaction([...])` 及
锁包装器内仅 1–3 次操作的路径不在此表。实际 PR 必须复核本表是否仍与 head 一致。

| 路径                                                                                                        | 串行操作数（当前源码）                                                                                                                                          | 判断与本项处理                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `user-data-reset-service.ts:resetUserBusinessDataWithAudit`                                                 | 事故时 21 个、当前 23 个 `deleteMany`；另有权限/目标读取、metadata 读取/更新、审计写入                                                                          | **必须改**为 `timeout: 60000, maxWait: 15000`；破坏性数据重置必须保持单一原子事务。                                                                                      |
| `tenant-service.ts:createTenantUsing`（`tenantService.create` 与 `createPlatformTenantWithAudit` 两个入口） | 新租户最坏约 23 次：tenant/user/pipeline stage 3 次、7 个 AI 模板各 find+create 最坏 14 次、3 个 funnel 模板各 find+create 最坏 6 次；platform 入口另有审计写入 | **需要本 PR 明确裁决并记录**：首次建租户在最坏路径也会超过 5 秒；若加入显式 timeout，两个入口都须保持一致并有测试。它不删除既有用户数据，不能借 F-38 偷改播种/原子边界。 |
| `brand-discovery-completion-service.ts:completeBrandDiscovery`                                              | 6 次：user 读取、interview 更新、user 更新、profile upsert、progress 读取、progress upsert                                                                      | **暂不改 timeout**：仅刚过阈值，按约 350 ms 约 2.1 秒，且无生产 timeout 证据；保留事务，PR 记录此判断并在实际基线若超过 5 秒时另开工单。                                 |
| `platform-mutation-service.ts:reconcilePlatformAuthUidWithAudit`                                            | 9 次：目标/冲突读取、5 个关联外键 update、user 主键 update、成功审计写入                                                                                        | **需要本 PR 明确裁决并记录**：同为平台破坏性操作，最坏约 3.15 秒且不能半完成；若加入显式 timeout，必须维持所有 6 个更新与审计的原子性并补回滚测试。                      |

其余 source `$transaction` callback 在当前源码为 1–5 个串行数据库操作；`tag-service`、
`approval-service`、`daily-action-service` 使用数组型 transaction，未命中本次 interactive timeout
审计条件。`lead-magnet` / `webinar` 的 `withLockedUser` 路径均为行锁加最多两个后续操作。

## 禁止事项

- 不改 Prisma schema/migrations、`.env*`、`DATABASE_URL`、Supabase 配置或 deploy/control-plane。
- 不拆分 SA1 重置事务，不把 23 个删除改为无原子性的 `Promise.all`，不降低确认邮箱、
  platform admin、tenant/user scope 或审计门槛。
- 不触发生产重置、迁移、回滚、部署或 Final Release；所有生产操作仍由 Steven 亲手执行。

## 验收与交付

- [ ] SA1 timeout/maxWait 为精确 `60000` / `15000`，测试直接断言传参。
- [ ] 注入至少一个中段删除失败，证明删除、metadata 与成功审计整体回滚；同 tenant 其他用户不变。
- [ ] 以上审计四个超过阈值路径均列出最终“改/不改”决定、源码证据和测试；禁止无理由扩范围。
- [ ] `pnpm db:generate`、定向 SA1 测试、`pnpm type-check`、`pnpm lint`、`pnpm build` 通过。
- [ ] pipeline Step 3 后 PR 保持 open，待 Fable 复审；Steven 才能按裁决合并。P1 与 SA1/F-38
      合并后，再走一次完整 Final Release 发布链。
