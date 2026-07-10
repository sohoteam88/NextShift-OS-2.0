# NextShift OS 2.0 全项目审计报告

Date: 2026-07-08
Auditor: Claude (Cowork)
Scope: 全仓库 — 架构、安全、测试、CI/CD、依赖、代码质量、文档治理
Branch: `planning/os-3.3-runtime-platform` (HEAD: 7a1edfd)

---

## 总评

| 维度 | 评分 | 摘要 |
|---|---|---|
| 安全 | 🟢 良好 | 无密钥泄露；中间件统一安全头；公开端点有 zod 校验；multi-tenant 隔离设计到位 |
| 代码质量 | 🟢 良好 | 70 处 `any`（占比极低）、0 处 `@ts-ignore`、1 处 TODO、1 处 console.log |
| CI/CD | 🟡 有缺口 | 流程完整（type-check/lint/audit/build/test/e2e），但 **packages 测试完全没进 CI** |
| 测试 | 🟡 有缺口 | packages 102 个测试文件从不在 CI 运行；root vitest include 只覆盖 src 的部分目录 |
| 架构 | 🟡 脱节 | packages（48k LOC）与 src（113k LOC）零连接，新架构未进产品 |
| 文档治理 | 🔴 失衡 | 1,949 个 md vs ~1,680 个代码文件；状态文档已漂移 |

**整体判断：这是一个工程质量高于平均水平的单人项目。安全和代码卫生做得好，主要风险不在代码本身，而在"测试假象"（CI 绿灯但一半测试没跑）和"架构孤岛"（新大脑未接入产品）。**

---

## P0 — 必须尽快修复

### P0-1 packages 的 102 个测试文件从不在 CI 中运行

- 根 `vitest.config.ts` 的 `include` 只含 `src/__tests__/...` 等 src 目录
- `.github/workflows/ci.yml` 没有 `pnpm -r test` 或任何 packages 测试步骤
- **后果**：business-brain / decision-brain / runtime 等所有 "audit passed" 的 v1.0 发布，其测试证据在 CI 里从未被验证过。回归会静默通过
- **修复**：CI 增加 `pnpm -r --filter './packages/*' test`；或根 vitest 用 workspace 模式

### P0-2 packages 与 src 零集成（沿用前次评估）

- `grep "@nextshift/" src` 零命中。48k 行新架构代码没有一行跑在产品里
- **修复**：执行 `CODEX_EXECUTION_PLAN_2026-07-08.md` Phase 4（decision-brain 接线试点）

---

## P1 — 应该修复

### P1-1 状态文档漂移

- `PROJECT_STATUS.md` / `platform/status.md` 声称 active branch 是 `os-3.1-mvp-governance`，实际 HEAD 在 `os-3.3-runtime-platform`
- 根目录 roadmap 文件（🧠 Layer 1...md）untracked
- **修复**：执行计划 Phase 1

### P1-2 root vitest include 白名单可能漏掉 src 测试

- src 有 66 个 `*.test.ts*`，但 include 只列了 5 个目录模式。白名单外的测试文件静默不跑
- **修复**：改为 `src/**/*.test.ts?(x)` + 明确 exclude，让"新增测试默认被执行"

### P1-3 `images.remotePatterns` 全通配（含 http）

- `next.config.mjs` 允许任意 hostname 的 http/https 图片 → 图片代理可被滥用（带宽 / SSRF 面）
- **修复**:收敛到实际用到的域名（Supabase storage、CDN、社交平台头像等）

### P1-4 公开端点缺 rate limit 证据

- `api/v1/public/funnel/[slug]/submit` 有 zod 校验但未见 rate limit（lead 表单是刷量/垃圾数据高发点）
- 项目已有 `src/lib/rate-limit.ts`，只需应用
- **修复**：public/track、public/submit、check-slug、invite 四个端点加限流

---

## P2 — 建议改进

- **文档治理开销**：audit/ 569 项、migration 4 件套 → 执行计划 Phase 3 瘦身
- **分支堆积**：10+ 条 planning/release/codex 分支 → 执行计划 Phase 5 清单
- **eslint 配置最小化**：仅 `next/core-web-vitals`。建议加 `@typescript-eslint` 规则集（尤其 `no-explicit-any` 设为 warn，压住现有 70 处不再增长）
- **70 处 `any`**：绝对值不高，但集中清理一次成本低（多数在 API 响应类型）
- **e2e 覆盖**:tests/e2e 有 8 个 spec，相对 206 个 API route 偏薄。优先给 auth、payments、tenant 隔离补 e2e

---

## 做得好的地方（保持）

- 无任何密钥进 git；只有 `.example` env 文件被跟踪
- `src/middleware.ts` 统一 CORS 预检 + 安全头 + tenant 子域解析，结构清晰
- 206 个 API route 中仅 7 个无鉴权，且全部是合理的公开端点（health/version/public funnel/invite）
- Prisma 31 个模型、97 处 tenantId 引用 — 多租户隔离在 schema 层设计到位
- Dockerfile 多阶段构建 + 非 root 用户运行
- CI 含 `pnpm audit --audit-level=high` 依赖漏洞门禁
- 代码卫生极佳：0 ts-ignore、1 TODO、1 console.log

---

## 建议执行顺序

1. **P0-1**（CI 加 packages 测试）— 半小时的改动，立刻消除测试假象
2. `CODEX_EXECUTION_PLAN_2026-07-08.md` Phase 0-2（基线 + 文档修复 + OS 3.2 收尾）
3. **P1-3 / P1-4**（图片域名收敛 + 公开端点限流）— 各 1 小时内
4. 执行计划 Phase 3-4（治理瘦身 + 架构接线）
5. P2 项随日常迭代处理

本报告可直接追加为 Codex 执行计划的输入：P0-1、P1-2、P1-3、P1-4 可合并为一个新的 "Phase 1.5 — CI 与安全加固" 插入现有计划。
