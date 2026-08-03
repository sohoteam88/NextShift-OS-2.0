# Dependency Vulnerability Remediation Plan

> 状态：**仅分类与方案；等待 Fable 裁决。** 本工单没有修改 `package.json`、`pnpm-lock.yaml`、部署文件或生产环境。
>
> 审计基线：`main` at `00a16f1b6fbd14d122f5d31ac9a9e48765cf8c1d` (2026-08-03)
>
> 命令：Node 22 / pnpm 10.24.0，`pnpm audit --json`

## 1. 审计结论与范围变化

当前 main 的 `pnpm audit` exit code 是 `1`：**13 high**、6 moderate、1 low、0 critical（923 total dependencies）。

phase8 结案时的旧 lockfile 曾报告 12 high。main 现有额外的 `@sentry/nextjs → webpack → schema-utils → ajv → fast-uri` 两个 high advisory，因此本清单以**当前 main 的 13 个 high finding**为准；不应为了匹配历史数字而漏报。

没有 finding 可判为“误报”：每个路径都实际存在于 lockfile。部分仅在 lint/build 时暴露，不代表可忽略，只代表修复后的回归测试重点不同。

## 2. 逐项分类

| 优先级 | High finding（advisory） | 当前依赖路径 | 分类 | 拟议修复 | 必要验证 |
| --- | --- | --- | --- | --- |
| P0 | Next.js Server Actions DoS (`GHSA-m99w-x7hq-7vfj`) | direct `next@15.5.18` | 可直接升级 | 将 `next` 升至至少 `15.5.21`（同一 15.5 patch line） | `pnpm audit`、type-check、test、build、E2E、application image healthcheck |
| P0 | Next.js Server Actions custom-server SSRF (`GHSA-89xv-2m56-2m9x`) | direct `next@15.5.18` | 可直接升级 | 同上 | 同上，尤其检查 Server Actions / custom-server paths |
| P0 | Next.js rewrites SSRF (`GHSA-p9j2-gv94-2wf4`) | direct `next@15.5.18` | 可直接升级 | 同上 | 同上，尤其检查 rewrites 与 public funnel routing |
| P1 | PostCSS arbitrary file read (`GHSA-6g55-p6wh-862q`) | `next → postcss` | 需锁定解析结果 | 先升级 Next；若 lockfile 仍解析到 vulnerable PostCSS，再将 direct `postcss` 提升到至少 `8.5.18` | `pnpm build`、Tailwind/CSS snapshot 或页面 smoke |
| P1 | PostCSS source-map path traversal（direct path，`GHSA-r28c-9q8g-f849`） | direct `postcss@8.5.15` | 可直接升级 | 将 direct `postcss` 提升到至少 `8.5.18` | `pnpm build`、CSS/source-map build output 检查 |
| P1 | PostCSS source-map path traversal（Next transitive path，同 advisory） | `next → postcss` | 需锁定解析结果 | 与上项联动；升级后用 `pnpm why postcss` 确认所有解析路径均已修复 | audit 归零该 advisory + build |
| P1 | sharp/libvips inherited CVEs (`GHSA-f88m-g3jw-g9cj`) | `next → sharp@0.34.5` | 需代码/原生运行时适配评估 | 先验证 Next patch 是否带来 `sharp >=0.35.0`；否则只在裁决后的修复 PR 中使用受控 override 或 compatible Next upgrade | Docker application image build、image optimization smoke、healthcheck |
| P1 | fast-uri quadratic processing (`GHSA-...` advisory `1124064`) | `@sentry/nextjs → sentry webpack plugin → webpack → schema-utils → ajv → fast-uri` | 需工具链兼容评估 | 评估兼容的 `@sentry/nextjs` 更新，优先让上游解锁 `fast-uri >=3.1.4`；避免盲目 transitive override | production build、Sentry source-map upload/config path、audit |
| P1 | fast-uri unbounded parsing (`advisory 1130178`) | 同上 | 需工具链兼容评估 | 与上项同一升级 PR 处理，目标 `fast-uri >=3.1.4` | 同上 |
| P2 | brace-expansion exponential DoS (`GHSA-3jxr-9vmj-r5cp`) | `@eslint/eslintrc → minimatch → brace-expansion@1.1.15` | 可直接锁定/工具链升级 | 优先升级可兼容 ESLint/eslintrc；若上游尚未解锁，在裁决后的 PR 用最小 `pnpm.overrides` 锁至 `>=1.1.17` | lint、audit、lockfile diff 人工复核 |
| P2 | brace-expansion OOM DoS (`GHSA-mh99-v99m-4gvg`) | 同一 `@eslint/eslintrc` 路径 | 可直接锁定/工具链升级 | 与上项合并，较高 patched floor `1.1.17` | 同上 |
| P2 | brace-expansion exponential DoS (`GHSA-3jxr-9vmj-r5cp`) | `@typescript-eslint/* → minimatch → brace-expansion@5.0.6` | 需工具链兼容评估 | 优先成组升级 `@typescript-eslint` packages；否则受控 override 至 `>=5.0.8` | lint、type-check、tests、audit |
| P2 | brace-expansion OOM DoS (`GHSA-mh99-v99m-4gvg`) | 同一 TypeScript ESLint 路径 | 需工具链兼容评估 | 与上项合并，较高 patched floor `5.0.8` | 同上 |

说明：audit 输出给 fast-uri 的两个 advisory ID 为 `1124064` / `1130178`；它们在 pnpm 输出中未提供稳定的 short GHSA string，因此此处保留可复核 ID，修复 PR 再附上上游 advisory URL。

## 3. 建议的修复分批（不在本工单执行）

### A. Runtime framework patch（优先，独立 PR）

- 范围：Next `>=15.5.21`；必要时 direct PostCSS `>=8.5.18`。
- 目标：先消除三个 Next runtime high 与所有 PostCSS high；同时检查 sharp 是否随上游解锁。
- 风险：Next patch 虽不跨 major，仍需完整 CI、E2E、Docker image healthcheck；不能自动部署。

### B. Observability/build toolchain（独立 PR）

- 范围：`@sentry/nextjs` 的兼容更新，目标消除两个 fast-uri high。
- 风险：Sentry webpack/source-map 行为可能变化；必须做 production build 与 Sentry build integration 验证，不能只看 audit 绿。

### C. Lint toolchain / lockfile（独立 PR）

- 范围：ESLint、`@typescript-eslint/*` 的兼容更新；仅在上游无法及时解锁时才使用最小 `pnpm.overrides`。
- 风险：这些主要是 CI/build-time exposure，不是误报。override 必须是可追溯的临时措施，并在 PR 里列出受影响的完整 transitive paths。

## 4. 每个修复 PR 的固定验收

1. `pnpm install --frozen-lockfile` 后 `pnpm audit --json`，记录 high count 变化；
2. `pnpm db:generate`；
3. `pnpm type-check`、`pnpm test`、`pnpm build`、`pnpm lint`；
4. GitHub CI 全绿，含 production-readiness、migration image 与 application-image healthcheck fixtures；
5. 对 A/C 做 Docker application image build；对 A 做 public funnel + Server Actions / rewrites E2E smoke；对 B 验证 Sentry build integration；
6. 仅在 Fable 批准后进入 main；本计划本身不构成发布批准。

## 5. 明确不做的事

- 不把 dev/build-time exposure 标成 false positive；
- 不用 `--force` 或大范围 `pnpm update --latest`；
- 不在同一 PR 混合 runtime、Sentry、lint-toolchain 三类升级；
- 不修改生产 `.env`、不触发 deploy、不在本工单修改 `package.json` 或 lockfile。
