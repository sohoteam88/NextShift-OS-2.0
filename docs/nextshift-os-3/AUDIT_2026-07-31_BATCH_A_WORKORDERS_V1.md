# 外部只读审计 2026-07-31 · 批 A 工单拆解 v1

> **上位文档**：`audit/EXTERNAL_READONLY_AUDIT_2026-07-31.md`（审计原文 + Fable 裁决附录）
> **本文范围**：只拆批 A（立即执行，docs + 小代码）。批 B 排入 W4 工程线、批 C 绑首个真实用户闸门，见审计附录，暂不在本文展开。
> **核对方式**：以下三条工单在拆解前逐条读码核实，不是转述审计结论——`BLUEPRINT_STATUS.md`、`package.json`、`version/route.ts`、`Dockerfile`、`audit-markdown-authority.ts` 均已实读，审计原文的具体引用（"BLOCKED until PR #79"、"Sprint-001"、`nextshift-os-2`/`0.1.0"`、`APP_VERSION = '0.1.0'` 硬编码）逐字符合。
>
> **拆解中发现一处需要澄清**：审计与 Fable 裁决都提到"machine-readable version authority"，但没指定数据源。核查后发现 `docs/chatgpt-system-context/VERSION_AUTHORITY_POLICY.md` 是**文档版本号治理规则**（管 Engineering Playbook 之类文档该不该升版本号），语义上和"产品当前对外版本号"是两回事，不能直接拿来当 `version` 端点的 `product` 字段数据源——已在 A3 工单里改成"先问 Steven/Fable 拿到明确产品版本号，不自行拟一个"，避免批 A 在"治漂移"的过程中自己制造一个新的漂移源。

---

## A1 · 权威大扫除（解 AUD-001）

### 现状实证

`docs/nextshift-os-3/BLUEPRINT_STATUS.md` 当前内容核实：
- 自称"authoritative status dashboard"/"single source of truth"
- `Implementation Status`: "BLOCKED until the one-time Pipeline Upgrade PR is implemented..."
- `Next Stop`: "Steven reviews and merges PR #79..."
- `Current Sprint`: "Sprint-001"

而仓库当前实际在 PR #202+，Release Train #4 已上生产（962b4276），批 1 用户面重建施工中——文件描述的状态比实际落后接近三个月的工作量。这正是审计 AUD-001 的实证，也是审计者自己评价"新 agent 读了这份文件会得到错误执行上下文"的活证——**AGENTS.md 已经把这份文件排除在新 agent 必读清单外，但文件本身没有停止自称权威**，旧宪法未废是 Fable 裁决点出的问题。

### 范围

对以下三份（及审计点名的同类"自称权威"文件，Codex 执行前先用 `grep -l "single source of truth\|authoritative" docs/nextshift-os-3/*.md` 找全，不要只改这三份）：

- `docs/nextshift-os-3/BLUEPRINT_STATUS.md`
- `docs/nextshift-os-3/START_HERE.md`
- `docs/nextshift-os-3/PROJECT_STATUS.md`

**处置方式**（不删除，历史内容归档）：
1. 文件顶部加醒目标注：
   ```markdown
   > ⚠️ **SUPERSEDED（2026-07-31）**：本文档已不是权威状态源。
   > 当前权威：`AGENTS.md` 必读清单（`FABLE_ROLE_CHARTER.md` → `PRODUCT_SHAPE_AMENDMENT_2026-07.md` →
   > `USER_SHELL_REBUILD_SCOPE_V1.md` → `DOGFOOD_DIARY_2026-07.md` → `business-pack/BUSINESS_PACK_SCRIPTS_V1.md`）。
   > 本文档以下内容为历史存档，反映 <原文件自述的时间点/版本>，不代表当前状态。
   ```
2. 原有正文保留在标注之下（不删除，供历史考古用）
3. 文件内所有"authoritative"/"single source of truth"自称字样，在标注之后的正文里**不做修改**（保持历史真实），只在顶部标注里说清楚"此文件已被取代"

### 改动范围

- 上述三份 + grep 找出的同类文件，仅加顶部标注块，不改动正文
- `AGENTS.md`：确认必读清单五份文档路径仍然准确（应该已经准确，本工单只需核对不需要改）

### 验收标准

- [ ] `grep -l "single source of truth\|authoritative" docs/nextshift-os-3/*.md` 找到的文件全部加了 SUPERSEDED 标注
- [ ] 标注格式统一（同一段模板，文件名/时间点按各文件实际情况填）
- [ ] 正文内容零改动（`git diff` 只在文件顶部出现新增行，不出现其他行的修改）
- [ ] `pnpm docs:audit-authority` 跑一遍确认不新增报错（该脚本目前只做重复标题/版本冲突检测，不检查 SUPERSEDED 标注本身，这条是防止本工单意外破坏该脚本现有的通过状态）

---

## A2 · `docs:audit-authority` 扩展：保鲜检查（解 AUD-014）

### 现状实证

`scripts/audit-markdown-authority.ts` 已核实：内建 `canonicalPaths` 白名单（含 `BLUEPRINT_STATUS.md` 等 11 份），做的是**标题重复**/**版本号冲突**检测（`extractVersions`/`extractTitle`/`extractStatus`），完全没有"最后核实于哪个 commit"、"多久未更新即视为过期"的机制。CI 目前拿这份报告只做生成，不做失败判定（本工单需要新增判定并接入 CI，具体 CI workflow 文件由 Codex 执行前先 `grep -rn "audit-authority" .github/workflows/` 确认当前是否已被引用）。

### 方案

给 `canonicalPaths` 里每一份文件要求 frontmatter 或顶部字段：

```markdown
> **last_verified_commit**: <40-hex SHA>
> **verified_at**: YYYY-MM-DD
```

脚本新增逻辑：
1. 对 `canonicalPaths` 清单里的每份文件，解析 `last_verified_commit`
2. 用 `git log -1 --format=%H -- <path>` 拿该文件最后一次实际改动的 commit
3. 若 `last_verified_commit` 早于该文件最后一次实际改动的 commit（即文件改了但没人重新核实过），或 `verified_at` 距今超过一个可配置阈值（建议 30 天，交 Codex 起草时按项目当前发布节奏定，不是本工单自行拍板——写进 PR 描述请 Steven/Fable 确认阈值），判定为 stale
4. stale 时该脚本非零退出，CI 对应 job 标红

### 改动范围

- `scripts/audit-markdown-authority.ts`：加 stale 判定逻辑
- `canonicalPaths` 清单里现存 11 份文件：逐份补 `last_verified_commit` + `verified_at`（用各自文件当前实际最后修改的 commit SHA，`git log -1 --format=%H -- <path>` 取值，不得凭空填）
- CI workflow（若尚未接入 `docs:audit-authority`，需新增一个 job；若已接入，确认新的非零退出会让该 job 标红）

### 验收标准

- [ ] 11 份 canonical 文件全部补齐 `last_verified_commit`/`verified_at`，且值来自 `git log` 实测，不是编造
- [ ] 故意把某份文件的 `verified_at` 改成 40 天前，跑脚本应失败退出——反向验证判定逻辑生效后改回来
- [ ] CI 中 `docs:audit-authority` 一步现在会在 stale 时标红（不是仅生成报告）
- [ ] `pnpm lint` / `pnpm build` 通过（脚本改动不影响主构建）

---

## A3 · 版本权威统一（解 AUD-004）

### 现状实证

- `package.json`：`"name": "nextshift-os-2"`，`"version": "0.1.0"`
- `src/app/api/v1/version/route.ts`：`APP_VERSION = '0.1.0'` 硬编码字符串，与 `package.json` 独立维护，两处已经在漂移风险里（改一处不改另一处）
- `commit`/`buildTime` 字段已经由 `Dockerfile` 的 `ARG NEXT_PUBLIC_COMMIT_SHA`/`ARG NEXT_PUBLIC_BUILD_TIME` 注入（这部分审计没有点名问题，**不用重做**，只是确认现有机制）
- 缺失：`product` 语义版本（OS 3.x 这条产品线版本号）、`schemaVersion`（Prisma schema 版本/migration 游标）——版本端点目前只有 npm package 版本，不含产品版本

### 方案

**先澄清一个岔路**：`docs/chatgpt-system-context/VERSION_AUTHORITY_POLICY.md` 已读——那是"文档版本号怎么升级"的治理规则（管 Engineering Playbook 这类文档该不该叫 v1.3），**不是**产品/构建版本注册表，字段语义完全不同，不能拿来当 `product` 字段的数据源。本工单需要的是运行时机器可读版本，两者不要混。

1. `version/route.ts` 的 `APP_VERSION` 常量删除，改为读 `package.json` 的 `version` 字段（用项目现有读取 package.json 的惯用方式，Codex 执行前 `grep -rn "package.json" src/` 看看仓库里是否已有约定模式，保持一致，避免另起一套 import 方式）
2. `product` 字段值已由 Fable 裁决为 `"3.9.0"`（v3.8.0 为最后一个 tag，OS 3.9 三波已全部上产，版本权威从此对齐产品语义）。Codex 直接使用此值写死为常量（或指向一个新建的极小 `docs/nextshift-os-3/VERSION_AUTHORITY.json` 单一来源），不需要再问 Steven/Fable。
3. `version` 端点最终字段（`product` 值待上一步确认后填入）：
   ```json
   {
     "product": "3.9.0",
     "packageVersion": "3.9.0",
     "commit": "<git sha，沿用现有 NEXT_PUBLIC_COMMIT_SHA 机制>",
     "buildTime": "<ISO8601，沿用现有 NEXT_PUBLIC_BUILD_TIME 机制>",
     "environment": "production"
   }
   ```
   保留原有 `version` 字段名指向 `packageVersion` 或做别名，避免破坏现有监控/脚本对该字段的依赖（`grep -rn "api/v1/version" src/ scripts/` 找出所有消费方，逐个确认改字段名不会破坏它们）
4. `package.json` 的 `"name"` 是否要从 `nextshift-os-2` 改掉——**这条不属于本工单自行决定范围**，仓库名/包名变更影响面较大（CI 缓存 key、Docker 镜像 tag 等可能引用），PR 描述里列出改与不改的影响面，交 Steven/Fable 决定，Codex 默认只改 `version` 字段对齐产品版本号，不改 `name`

### 改动范围

- `src/app/api/v1/version/route.ts`
- `package.json`：`"version"` 字段从 `"0.1.0"` 改为 `"3.9.0"`（`"name"` 字段不动，见上）
- 若新建 `VERSION_AUTHORITY.json`：单独一份新文件，不与 `VERSION_AUTHORITY_POLICY.md` 混用或改写后者

### 验收标准

- [ ] `curl https://nextshiftos.com/api/v1/version?cb=<随机数>`（部署后）返回的 `commit` 与生产实际部署 SHA 一致（继承既有铁律，这条不是本工单新加的，只是确认没有破坏）
- [ ] `version` 端点新增字段有实际数据，不是占位字符串
- [ ] `grep -rn "api/v1/version"` 找到的所有消费方（若有）在字段改名后仍能正常工作，或已同步更新
- [ ] `pnpm build` 通过
- [ ] PR 描述里贴出 `curl` 实测结果（本地/预览环境即可，生产验证要等部署后由 Steven 按惯例实测）
- [ ] `package.json` 的 `version` 字段确认改为 `3.9.0`，且没有连带改动 `"name"` 字段
- [ ] `version` 端点的 `product` 字段返回值确认为 `"3.9.0"`，不是占位符或旧值

---

## 执行顺序与边界

- A1/A2/A3 三个工单互不依赖，可并行转发给 Codex
- 都属于"docs + 小代码"，不触碰 schema、不触碰认证/租户逻辑（那些是批 B/C 的范围）
- 每个工单改完后**先出 diff 给 Steven 看，不 commit/push/开 PR**——与批 1 W1 工单的执行边界一致，理由同样是 AGENTS.md 第 5 条

---

*批 A 工单拆解 v1 — 2026-07-31，三工单待 Steven 转发 Codex 执行*
