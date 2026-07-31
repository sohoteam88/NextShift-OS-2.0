# 外部只读审计 2026-07-31(原文逐字存档)

> 来源: 外部 AI 只读审计,经 Steven 转交 Fable 窗口,原文逐字保存(未改动内容,仅加本头注与文末裁决附录)。
> 落仓执行: Fable 写入工作区,由执行层 commit+push。

---

## NextShift OS 全系统只读审计

### 审计基线
- Repository:sohoteam88/NextShift-OS-2.0
- Branch:main
- Commit:008e9f7aff73d96e6fdab1f5439264fb430f34dd
- 审计日期:2026年7月31日
- 审计方式:GitHub Repository 静态审计
- 修改记录:0(未创建 branch、commit、Issue、PR、comment,也未触发 workflow 或 deployment)

### Executive verdict

综合评级:**B+ / 条件性健康**

系统工程治理已经达到很高成熟度,但"治理文件、运行时代码和当前产品状态"之间开始出现明显漂移。目前不是"系统很差",而是进入了另一个风险阶段:文档治理非常强;发布流程非常严;架构抽象非常完整;但部分 authoritative status 已明显落后于实际进度;安全边界主要依赖应用层纪律,而不是数据库和统一 API gate 的强制约束;仓库的复杂度正在超过现阶段产品实际使用价值。

因此不给 A。核心原因不是代码明显失控,而是:**系统已经具备 enterprise governance,但尚未完全具备 enterprise enforcement。**

### 1. 关键发现

**P0:当前没有发现必须立即下线的明确证据**
本次静态检查范围内,没有看到:明文 production secret;明确跨 tenant 直接读取代码;明确绕过认证后执行高权限操作;明确破坏性 migration;release governance 被完全绕过;production 状态被伪造为已验证。
但这不等同于安全完全通过,因为本次没有:执行测试;启动应用;连接数据库;检查 Supabase RLS 实际策略;运行 dependency vulnerability scan;运行动态渗透测试。

**P1:Authoritative status 已严重过期(评级 High)**
BLUEPRINT_STATUS.md 自称架构状态 single source of truth,但仍写着:OS 3.8 implementation 被 pipeline upgrade 阻塞;下一步是 merge PR #79;当前 Sprint 仍为 Sprint-001;Production 为 "Not Started"。这些明显落后于当前状态(仓库已到 PR #202,已有多轮 release train 与 readiness/approval 证据)。
风险:新 AI agent 或开发者读取 authoritative 文件后得到错误执行上下文;Codex/Claude Code/ChatGPT 可能生成错误任务;审批与 release 判断可能引用旧状态。
建议:状态文件拆为 Current Product State / Current Release State / Historical Blueprint State,历史内容不与当前权威混放。

**P1:API authentication 不是统一强制门禁(评级 High)**
Middleware 对 API 路由无用户时仍放行(`if (!user && isApiPath) return supabaseResponse;`),认证由每个 route handler 自行负责。设计上因 health/webhook/public funnel 需匿名访问而如此,但形成治理风险:**任何新 route 忘记调用 auth helper 就可能意外成为公开接口**。
建议:default-deny——/api/v1/** 默认必须认证;公开 endpoint 显式 allowlist;webhook 独立签名校验;health 单独豁免;CI 自动检查 route 访问策略声明。

**P1:Tenant isolation 主要靠应用层过滤(评级 High)**
核心实体普遍有 tenantId(正确),但记录同时保存 tenantId 与 userId 时,数据库外键只验证 user 存在,不验证其属同一 tenant——逻辑上可能出现 Mission.tenantId=Tenant A 而 userId 属 Tenant B。
建议:PostgreSQL RLS 作为最终防线;或 composite relation (tenantId, userId);repository 层强制 tenant context;Prisma extension 自动注入 tenant filter;专门的 cross-tenant denial 集成测试。

**P1:状态、版本和产品身份没有统一(评级 High)**
package.json 仍为 "nextshift-os-2"/"0.1.0",而产品与发布历史已进入 OS 3.x。至少三套版本语义并存(仓库名 2.0 / package 0.1.0 / product 3.8.x)。
建议:建立单一 machine-readable version authority(product/release/schemaVersion/runtimeVersion/commit),由 build pipeline 注入 health endpoint、Sentry、OCI labels 与 release artifacts。

### 2. 架构审计
优点:Runtime layering 清晰(shared→contracts→domain→event-bus→business-brain→decision-brain→execution-layer→learning-system→application→agents→capability-layer),核心 runtime package 冻结需 RFC;代码入口有明确索引;边界治理已入工程脚本(lint:boundaries:check、docs:audit-authority、docs:links 等)。
问题:**冻结层数量过多**——对 0-user/early-user 产品,一次冻结 11 个 package 可能带来 architecture ossification;冻结原则应保护稳定接口,而不是冻结大量内部抽象。

### 3. 数据模型审计
健康点:核心表普遍带 tenantId;大量 cascade;常用查询字段有 index;部分关键实体 soft-delete;AuditScope 区分 tenant/platform;email 用 tenant composite uniqueness。
风险点:①**String 状态字段过多**(tenant plan/status、user role/status、mission status、pipeline stage 等)——typo 可入库、contract 漂移、analytics 脏值;应转 Prisma enum 或 validated domain value object。②**JSON 使用范围较大**——适合 metadata/prompt config/AI output/UI settings,不适合长期承担高频筛选、权限、关键业务状态、财务输入、可审计 decision outcome;防"先放 JSON 永不正规化"。③**updatedAt 行为不一致**(@default(now()) 与 @updatedAt 混用)——影响 sync/增量处理/audit/stale 检测。

### 4. Authentication 与 authorization 审计
健康点:使用 supabase.auth.getUser();tenant compatibility path 验证 profile;检查 user status active;tenant deleted 清 session;legacy member query 限 operator;redirect 策略集中抽象。
风险点:①**Middleware 内部再请求自身 API**(fetch /api/v1/auth/me)——额外网络与 DB 开销、internal endpoint 故障导致合法用户 401、双请求难观测;应共享 server-side auth/profile service。②Public path 使用 startsWith(如 /login-anything 匹配 /login)——应使用明确 pathname matcher。③Role 使用 String,无 schema-level enum enforcement。

### 5. CI/CD 与 release governance 审计
优势:production readiness evidence、migration image digest、checksum、rollback target、architecture review request、final release approval、merge ancestry、禁 squash、multi-agent collaboration rules——高于一般 early-stage SaaS。
风险:①**Governance 成本过高**——大量 approval/corrective/evidence/runbook/archival PR 与 ancestry repair;当 release governance 本身需要频繁修正与解释,说明流程可能超过团队操作容量。②最新 main commit(008e9f7a)无可见 combined status context——无法仅凭当前 status surface 证明所有 checks 通过;应保证 main HEAD 有机器可读的 required checks conclusion。

### 6. 测试策略审计
已具备:ESLint/TypeScript/Vitest/Playwright/i18n audit/document authority audit/link+navigation validation/architecture boundary validation。
主要缺口(静态无法证明覆盖):tenant isolation integration tests;role matrix;unauthenticated API enumeration;webhook signature;migration upgrade/rollback;database constraint;concurrency/idempotency;AI provider timeout/fallback;billing/usage race;queue retry/poison-message;disaster recovery restore test。
下一阶段测试 KPI 应看 **Critical business invariant coverage**,而非 assertion 数量。

### 7. Dependency 与技术栈审计
栈:Next.js 15/React 18/Prisma 6/Supabase/Sentry/PostHog/Upstash Redis/ioredis/OpenAI/Anthropic/Google GenAI/Zustand/React Query/Vitest/Playwright。
判断:选择合理但平台重叠(Upstash+ioredis;Supabase+Prisma;多家 AI SDK;Zustand+React Query;Sentry+PostHog)。需明确每个 concern 的唯一 ownership,否则形成隐性 platform fragmentation。

### 8. 文档治理审计
优点:canonical index、do-not-duplicate、protected files、change control、authority boundaries、engineering playbook、architecture review、audit history、implementation contract、release evidence archive。
核心问题:**文档数量已成为产品风险**——极易出现"文档正确、代码正确,但两者描述的不是同一个时间点"。BLUEPRINT_STATUS.md 即实证。
建议:authoritative 文件应可机器更新、有 last_verified_commit、verified_at、owner、expiry policy、stale 时 CI fail、历史内容自动归档。

### 9. 产品与 UX 层判断
系统能力密度已超过普通副业用户认知负荷:过多入口、状态、workspace、AI action,不清楚今天该做什么。最重要产品原则:**One user → One current stage → One primary bottleneck → One mission → One CTA → One measurable result**。功能应藏在 mission execution 后面,而非全部暴露在 navigation。

### 10. 风险清单

| ID | 风险 | 等级 |
|---|---|---|
| AUD-001 | Blueprint authoritative status 严重过期 | High |
| AUD-002 | API authentication 非 default-deny | High |
| AUD-003 | Tenant relational consistency 未由数据库强制 | High |
| AUD-004 | Product/repository/package version 漂移 | High |
| AUD-005 | Governance complexity 超过团队操作容量 | Medium-High |
| AUD-006 | Middleware 通过内部 HTTP 获取 profile | Medium |
| AUD-007 | String 状态与角色缺乏 schema enforcement | Medium |
| AUD-008 | JSON business fields 可能持续膨胀 | Medium |
| AUD-009 | updatedAt 行为不统一 | Medium |
| AUD-010 | Tool/platform ownership 有重叠 | Medium |
| AUD-011 | 最新 main HEAD CI conclusion 无法从当前 status surface 证明 | Medium |
| AUD-012 | 产品能力密度可能造成 UX cognitive overload | High |
| AUD-013 | Frozen runtime 可能过早固化架构 | Medium |
| AUD-014 | 文档 freshness 缺少自动 expiry gate | High |

### 最终结论
可以继续开发,但不建议立刻继续增加大模块。应进入 **System Coherence & Enforcement Phase**,优先顺序:修复 authoritative status 漂移;建立 API default-deny;强化 tenant isolation;统一 version authority;治理自动化减少人工 PR 仪式;完整 route/access matrix;收敛 UI 为 mission-first;最后才继续新增功能。

最终判断:NextShift OS 并非"乱到需要重做",而是"架构能力强、治理成熟、产品雄心高,但系统复杂度开始超过一致性控制能力"。当前最大风险是 **Architecture truth ≠ Documentation truth ≠ Runtime truth ≠ Product truth**。对齐四者,可从 B+ 升 A。

---

## 附录:Fable 裁决(2026-07-31)

审计价值背书:审计者只读仓库、无聊天上下文——其第一大发现(AUD-001)正是"新大脑被过期权威文件带偏"的活体演示;其 UX 处方(One mission → One CTA)与已定稿的 USER_SHELL_REBUILD_SCOPE_V1 逐字一致,方向获独立背书。核心命题"四真相漂移"成立,但需补一句:新宪法(AGENTS.md Multi-Agent Rules + 必读五文档)已立,问题在**旧宪法未废**。

三批执行裁决:

**批 A(立即,docs+小代码)**
- 权威大扫除:过期 authority 文件(BLUEPRINT_STATUS / START_HERE / PROJECT_STATUS 等自称权威者)标 SUPERSEDED 指向 AGENTS.md 必读清单,历史内容归档 → 解 AUD-001
- docs:audit-authority 扩展:authority 文件须带 last_verified_commit,过期即 CI fail → 解 AUD-014
- 版本权威:machine-readable version authority(product/release/commit)由 build 注入 version 端点等;package.json 对齐 → 解 AUD-004

**批 B(排入重建/W4 工程线)**
- API default-deny 路由矩阵 CI 检查(/api/v1/** 默认须认证,公开走显式 allowlist;HUMAN_GATE 安全类)→ 解 AUD-002
- String 状态→Prisma enum + updatedAt 统一(**趁无用户窗口,迁移成本最低**)→ 解 AUD-007/009
- middleware 去自 HTTP(共享 server-side profile service)→ 解 AUD-006
- 冻结层收窄 RFC(冻接口不冻内部抽象)→ 解 AUD-013

**批 C(绑定"首个真实用户"闸门,与 Supabase Pro/完整 DR 演练同清单)**
- RLS 或 composite (tenantId,userId) 数据库级强制 → 解 AUD-003
- 现在先补便宜的一半:cross-tenant denial 集成测试

**已在途/已解决对照**
- AUD-012 → 用户面重建(范围清单已定稿,批 1 施工中)
- AUD-005 → RELEASE-1(prepare-release 一条命令收编取证+request+approval),借本审计提升优先级
- AUD-010 → ownership 表并入 AGENTS.md 待办
- AUD-011 → docs-only 合并的已知形态,低优先

*裁决人:Fable(裁决层)。执行分派:批 A 即刻,批 B 随 W4,批 C 入真实用户前置清单。*
