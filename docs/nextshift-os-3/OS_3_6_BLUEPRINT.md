# NextShift OS 3.6 Blueprint — Business Brain Remembers

Version: 1.1
Status: Draft — awaiting Steven approval
Date: 2026-07-12
Author: Claude (Architecture / Orchestration)
Baseline: `v3.5.0` in production（Business Discussion 已上线，六个 runtime flag 全部揭幕）
Parent: [Master Roadmap 2026-07](MASTER_ROADMAP_2026-07.md) — 本版是 **Stage A（"Brain 开始记住"）的前半段**，对应 Master Roadmap 的 A1；A2（Command Center 长全）和 A3（Business Twin v1）连同结果闸门 A 的检查点排入 OS 3.7

---

## 1. OS 3.5 证明了什么

用户第一次能跟 Business Brain 对话了——推荐卡片上的"和 AI 讨论"入口真实可用，锚定在当前推荐和 decision context 上，全部流量经 modules/ai router，5 轮上限，租户日配额生效。同时 flag 生命周期第一次走完整闭环：转正 → legacy 物理删除 → 履历记录。

但这次对话是**失忆的**。每一轮讨论结束、用户刷新页面或者第二天回来，AI 完全不记得上次聊过什么、用户接受还是忽略了哪些建议、执行节奏是快是慢。`discussion-service.ts` 目前不读取也不写入 `business-context-memory` 模块——这个模块本身已经存在且在被 `ai-coo-decision-engine` 和 dashboard 消费（`RECOMMENDATION_ISSUED/ACCEPTED/IGNORED`、`MISSION_COMPLETED` 等事件类型都已经定义好了），但讨论功能完全没接进去。这是本次 blueprint 埋的路标——OS 3.5 blueprint 原文写的是"不做多轮长记忆（Business Memory 是 Layer 1 的事，OS 3.6+）"。

## 2. OS 3.6 的一句话目标

**让 Business Brain 记住用户——讨论历史和执行模式反哺进 Business Memory，AI 讨论和推荐引擎都能看见"上次聊过什么、用户是什么节奏"，而不是每次都冷启动分析。同时清理三个拖了多个版本的遗留项（生产 admin 角色、限流 IP 信任、UI 逃逸基线）。**

## 3. Non-Goals

- 不做独立的"记忆管理"UI（用户看不到、也不需要手动管理 Memory 条目，Memory 是后台能力不是新增页面）
- 不做跨租户/跨用户的记忆聚合或分析（Memory 严格按 tenant+user 隔离，延续现有 `business-context-memory` 的隔离边界）
- 不扩展 Conversation Engine 的话题范围（仍然是 Business Discussion，不是开放对话；Layer 3 roadmap 里的 AI Brainstorm / Content Discussion / Funnel Discussion 等留到之后）
- 不新增 runtime 模块迁移（`business-context-memory` 本身不是 runtime adapter 化的候选，它是既有的 services 层模块）
- 不重新设计 Business Memory 的底层存储（沿用现有 `business-memory-event-store` 的事件流模式，扩展事件类型而不是换存储方案）

---

## 4. Workstream M — Business Memory 接入讨论 (Business Memory Wiring)

| # | 任务 | 说明 |
|---|---|---|
| M0 | ~~PostHog 事件设计与真实接线~~ **已完成（2026-07-12）**：`analytics.init()` 经 `AnalyticsInit` client component 挂在根 `layout.tsx`，真实调用一次；新增 `recommendation_viewed`/`recommendation_clicked`/`discussion_turn_sent`/`weekly_active` 四个事件，均有守卫（dedup/null 检查）。既有 5 个事件里实际只有 3 个有真实调用点（`user_signed_up`/`funnel_created`/`ai_content_generated`）；`content_published`/`upgrade_clicked` 至今无调用点，因为对应功能尚未建成——这在 baseline 就是如此，不是本次回归（Round 6 audit F-2） | Master Roadmap Stage A 结果闸门（≥10 真实周活用户）依赖这个数据地基，必须先做，否则闸门无法判定 |
| M1 | ~~discussion 事件类型接入~~ **已完成（2026-07-12）**：新增 `DISCUSSION_STARTED` / `DISCUSSION_TURN_COMPLETED` / `DISCUSSION_ABANDONED` 类型；首轮写入 started，每轮成功回复后写入 completed，复用现有 `business-memory-event-store`。`DISCUSSION_ABANDONED` 暂无可靠客户端信号，保留类型但未触发 | 地基先行，不改变任何现有事件类型的语义 |
| M2 | ~~讨论服务读取 Memory~~ **已完成（2026-07-12）**：生成 prompt 前读取 Memory，注入最近活动、执行模式和 recommendation accepted/ignored 摘要；读取或写入失败会记录 Sentry warning 并继续正常回复 | 这是用户能感知到的核心变化——AI 回复会体现"记性" |
| M3 | ~~推荐引擎读取讨论记忆~~ **已完成（2026-07-12）**：同一 recommendation 在最近 30 条完成讨论事件中达到 ≥3 轮时，`recommendedFocus` 会显式提示反复讨论信号；Command Center 并行读取 Memory，将 focus 和 ignored IDs 加入 engine evidence 与 rule fallback explain。读取失败会记录 Sentry warning 并以空 Memory 继续 | 闭环:讨论影响推荐,不只是推荐驱动讨论 |
| M4 | ~~Memory 事件量增长的性能/存储评估~~ **已完成（2026-07-12）**：当前 Stage A（≥10 真实周活）即使按每人每活跃日 2 次、每次 5 轮讨论的偏宽松估算，也只有约 86 条 discussion Memory 行/日；现有索引尚可，暂不加索引或归档。达到明确阈值时再评估，详见下方记录 | 提前评估,避免生产量上来后才发现问题；不是本次必须实现归档,但必须有评估结论 |

### M4 评估详情（2026-07-12）

- **实际查询与现有索引**：`list(userId, tenantId, 100)` 按 `tenantId + actorId + targetType = 'business_memory'` 过滤、按 `createdAt DESC` 取最多 100 条；`appendOnce()` 在同一 scope 额外按 `action` 和 24 小时 `createdAt` 窗口取最多 25 条查重。`audit_logs` 当前只有 `(tenantId, createdAt)` 和 `(actorId)`；前者只能缩小 tenant 并帮助时间排序，后者只能缩小 actor，两者都没有 `targetType`，也不能完整覆盖这两个查询。
- **量级判断**：按结果闸门的 10 个真实周活用户、每人每周活跃 5 天、每天 2 次讨论、每次首轮 1 个 `DISCUSSION_STARTED` 加最多 5 个 `DISCUSSION_TURN_COMPLETED` 计算：`10 × 5 × 2 × 6 = 600` 条/周，约 86 条/日；其他 Memory 事件只增加少量行。即使早期 Stage B 放大十倍，也约 860 条/日，远低于需要为该 audit-log 子集专门付出额外索引写入成本的量级。
- **明确的重新评估触发器**：满足任一项即在下一次规划周期检查 `EXPLAIN (ANALYZE, BUFFERS)` 和 Query Performance/Index Advisor：(1) 任一 tenant 的 `targetType = 'business_memory'` 行数达到 **10,000**；(2) 全库该子集达到 **100,000** 行，或连续 7 天每天新增超过 **10,000** 条；(3) `list()` 或 `appendOnce()` 的 p95 超过 **100 ms**，连续 3 个日窗口出现。这样既覆盖单租户热点，也覆盖全局写入与真实延迟。
- **索引结论**：现在不加 migration。索引会增加 `append()`（每个讨论轮次）的写入与存储开销，而且小表上的顺序扫描可能本来更快。触发后优先建立只覆盖 Memory 子集的 partial B-tree 索引：`CREATE INDEX CONCURRENTLY audit_logs_business_memory_list_idx ON audit_logs (tenant_id, actor_id, created_at DESC) WHERE target_type = 'business_memory';`；它直接服务 `list()`，并让低频的 `appendOnce()` 在同一用户的近时段内过滤 `action`。只有 profiler 证明查重本身仍是瓶颈时，才另加 `(tenant_id, actor_id, action, created_at DESC) WHERE target_type = 'business_memory'`，避免现在预建两个重复索引。
- **归档/压缩选项（暂不实施）**：(a) 维持现状，直到上述阈值；(b) 在保留期（建议先评估 90 天）后，把同一 tenant/user/recommendation 的讨论轮次聚合为周度摘要，再按审计保留政策删除明细；(c) 把老明细冷存到独立 archive 表或对象存储，只保留可供 `BusinessContextProjection` 使用的摘要。因为 `audit_logs` 也服务其他审计用途，任何删除或移动都必须先确认审计/合规保留期，不能只为 Memory 单独删行。

**M1-M3 安全网**：Memory 读取失败不能阻塞讨论功能——`getBusinessContext()` 调用失败时 discussion-service 必须能降级为"无记忆"模式继续工作（沿用现有 runtime adapter 的 fallback 哲学），并且 fallback 要 Sentry 可见（复用 OS 3.4 的 `runtimeFallbackLogger` 模式）。

---

## 5. Workstream H — 遗留项清理 (Overdue Hygiene)

| # | 任务 | 说明 |
|---|---|---|
| H1 | ~~R-4 生产 admin 角色排查~~ **已完成（2026-07-12）**：`SELECT id, email, role FROM users WHERE role = 'admin'` → **0 rows returned**，生产库无 `admin` 角色用户 | 从 OS 3.4 Round 4 audit 拖到现在，排查结果确认零用户，无需数据迁移 |
| H2 | ~~E-003 legacy `admin` 角色定义清理~~ **已完成（2026-07-12）**：生产查询返回 0 rows 后，已从活跃 auth routing 和角色白名单中移除 legacy `admin`，仅保留 `operator` 与 `platform_admin` | H1 结果已明确方向，无需等待决策 |
| H3 | ~~D-001 限流 IP 信任关闭~~ **已完成（2026-07-12）**：生产自管 nginx 已确认 `/etc/nginx/sites-enabled/nextshiftos.com` 使用 `X-Real-IP $remote_addr`；5 个限流 route 统一改用共享 helper 信任 `x-real-ip`。生产缺少该 header 时返回 `unknown`，仅本地/测试环境 fallback 到 `x-forwarded-for` 首位 | 从 OS 3.3 拖到现在,生产已经跑了三个版本,拓扑应该已经确定 |
| H4 | ~~UI 逃逸基线重新测量~~ **已完成（2026-07-12）**：`node scripts/measure-ui-escape-baseline.mjs` 统计 `src/`：className 任意值 **4,260**、自造 Button **8**、自造 Card **42**；相较 OS 3.4 的 3,519 / 5 / 24 均为上升（旧口径未存档，按数量级比较）。脚本只统计 className 表达式中的方括号 utility token，以及排除 `src/components/ui` 后、实际渲染 button/card 样式的本地组件声明 | 純測量任务,不做 UI 改动;为未来是否需要专项清理提供依据 |

---

## 6. 执行顺序

```
Phase 0（立即，不占用 M 系列排期）：H1 admin 角色排查 + H3 D-001 拓扑确认 + M0 PostHog 接线（三者互不阻塞，可并行）
Phase 1：M1 事件类型接入 + H2/H4 穿插
Phase 2：M2 讨论服务读取 Memory（用户可感知的核心交付）
Phase 3：M3 推荐引擎读取讨论记忆 + M4 性能评估
Phase 4：Round 6/7 audit → RC → planning→main → v3.6.0
```

节奏照旧：每 PR 一 review，每 2-3 PR 一次 Claude Code audit，交付物落库由 Claude 执行。

---

## 7. 发布标准（v3.6.0）

1. PostHog `analytics.init()` 在生产环境真实触发，`recommendation_viewed`/`recommendation_clicked`/`discussion_turn_sent`/`weekly_active` 四个新事件在 PostHog 后台能查到真实数据（不是"代码写了"，是"面板里能看到"）
2. discussion-service 读写 Business Memory，Memory 调用失败时有 Sentry 可见的降级 fallback，E2E 有覆盖
3. 推荐引擎能引用讨论历史（至少一个可验证的场景：用户反复讨论同一话题后，推荐或其解释文案发生可观测的变化）
4. H1/H2 完成且有明确结论落库（不管排查结果是"零用户"还是"需要迁移"，都要有记录，不能不了了之）
5. D-001 关闭，rate-limit 使用正确的可信 IP header
6. UI 逃逸基线有当前真实数字，写入 blueprint
7. 两轮 audit PASS 落库；release package + canonical status 一次到位

不在本版标准内、留给 OS 3.7 检查的：Master Roadmap 的"结果闸门 A"（≥10 真实用户周活）——OS 3.6 只负责把度量地基搭好，闸门本身的达成不是工程交付物，由 Steven 的获客轨（非工程）决定，不写进 audit 验收。

---

## 8. 风险

| 风险 | 缓解 |
|---|---|
| Memory 读取拖慢讨论响应延迟（多一次数据库查询在 LLM 调用之前） | M2 实现时测延迟；如果显著变慢，考虑缓存 `getBusinessContext()` 结果（现有 dashboard 消费方式可能已经有可复用的缓存模式，先查再造） |
| 事件量增长导致 event store 查询变慢 | M4 提前评估，必要时排入下一版本做归档，不阻塞 M1-M3 |
| H1 排查发现生产确实有 `admin` 角色用户，需要数据迁移 | 提前做，不要等到 OS 3.6 排期末尾才发现，参考执行顺序 Phase 0 |
| Memory 注入 prompt 后讨论质量下降（上下文太长或不相关信息干扰） | System prompt 设计阶段做限定—只注入 `recentActivities` 里最近 N 条、`executionPattern` 摘要，不是全量事件转储 |

---

## Audit Result

### Round 6 — PR #50-#60（M0 PostHog / M1-M4 Business Memory / H1-H4 遗留清理 / CI docs-skip）

Date: 2026-07-12
Auditor: Claude Code
HEAD: `db70620`（PR #60 merge commit）
Verdict: **PASS WITH CONDITION**

完整报告：[audit/OS36_R6_PR50_PR60_CODE_REVIEW_REPORT.md](../../audit/OS36_R6_PR50_PR60_CODE_REVIEW_REPORT.md)

检查点结论：CP1 M0 `analytics.init()` 经 `AnalyticsInit` 在根 layout 真实调用一次，缺 `NEXT_PUBLIC_POSTHOG_KEY` 时优雅降级不报错，4 个新事件调用点齐全且有 dedup/null 守卫 ✓；CP2 M1/M2 首轮写 `DISCUSSION_STARTED`、每轮成功回复后写 `DISCUSSION_TURN_COMPLETED`，Memory 读/写失败均不阻塞讨论且经 `runtimeFallbackLogger`（console.warn + Sentry.captureMessage）可见，system prompt 注入的是有界摘要而非原始 JSON，9 用例覆盖 ✓；CP3 M3 `discussionAttentionFor()`（最近 30 条、门槛 3 轮）逻辑正确，`packages/decision-brain` 零改动，`dashboard-recommendation-service.test.ts` 有可运行的场景测试证明讨论信号改变了推荐 explain ✓；CP4 M4 查询模式、现有索引（`(tenant_id,created_at)`+`(actor_id)`）、量级估算（≈86 行/日）、三个重评估触发器与 partial index 建议均经源码/schema 核对，结论可信、暂不加索引成立 ✓；CP5 H1/H2 `admin` 角色已从 `ADMIN_ROLES`/`INVITE_ROLES`/`Role` 联合/8 个路由守卫/测试夹具全部移除，残留 `'admin'` 仅为 feature key、保留 slug、i18n、H1 文档 SQL 文本 ✓；CP6 H3 5 个限流 route 统一 `getRequestIp()`，生产仅信任 `x-real-ip`、缺失返回 `unknown`，`deploy/nginx/nextshift-os.conf` 设置 `X-Real-IP $remote_addr`，伪造 `x-forwarded-for` 测试通过 ✓；CP7 H4 脚本两次独立重跑复现同样的 4,260 / 8 / 42 ✓；CP8 `paths-ignore` 语义正确（docs-only-proof 分支无 CI run、mixed-proof 分支跑全套 14m19s 绿），planning 与 main 均 "Branch not protected"，跳过不会卡合并 ✓。

CP9 本地 `type-check`（0 错）、`lint`（0 error / 416 warning 基线）、`lint:boundaries:check`（config in sync）、34 个 OS-3.6 目标测试全绿；`build`/`test` 全量/`E2E` 以 PR #59 GitHub Actions CI 全绿佐证（HEAD 相较最后一次绿灯 commit `4fb0e6d` 仅差一份 blueprint 文档，代码字节一致，PR #60 docs-only 跳过 CI 正确无损）。

Conditions（均为文档 / CI 接线问题，非代码缺陷，建议进 RC 前清除）：
- **F-1（CP10）**：M0 是唯一未标 `已完成` 的条目，且描述过时（仍写 "`analytics.init()` 目前…没有任何调用点…补：(a)(b)(c)"，实为已在 PR #51 交付）。需补 `已完成（2026-07-12）` 标记并更新描述；顺带修正 "现有 5 个事件调用点仍有效" —— 实际仅 3 个接线，`content_published`/`upgrade_clicked` 无调用点（功能未建，非回归，F-2）。
- **F-3（CP9/CP3）**：`business-context-tests.ts`、`journey-engine-tests.ts`（共 5 用例）因 `-tests.ts` 后缀不匹配 vitest `*.test.ts` include，从未在 CI 运行（强制运行时全绿）；PR #59 新增的讨论注意力用例落在这个被排除的文件里成了死测试。建议重命名为 `*.test.ts` 或放宽 include。CP3 已由可运行的 recommendation-service 场景测试独立覆盖。

Advisories（不阻塞）：A-1 off-topic 讨论分支返回结果（客户端会打 `discussion_turn_sent`）但不写 Memory 事件，客户端遥测与服务端记忆存在微小不一致；A-2 blueprint H3 引用生产路径 `/etc/nginx/sites-enabled/nextshiftos.com`，仓库内配置为 `deploy/nginx/nextshift-os.conf`，两者都设 `X-Real-IP`，保持引用一致即可。

**Round 6 结论：无代码缺陷，M0-M4 / H1-H4 功能全部正确实现并验证通过；两项文档 / CI 接线 condition 待清除后可进入 RC 准备。**

**Conditions cleared（2026-07-13）**：F-1 已由 Claude 补齐 M0 的完成标记与实际接线说明；F-3 由本 PR 将 `business-context-tests.ts` / `journey-engine-tests.ts` 重命名为 `business-context.test.ts` / `journey-engine.test.ts`，使原有 **5 个用例** 纳入 Vitest/CI 收集并通过。Round 6 conditions 已清除，可进入 RC 准备。
