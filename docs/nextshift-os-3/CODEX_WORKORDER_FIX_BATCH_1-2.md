# Codex 修复工单:Dogfood 批 1 + 批 2

> 依据: docs/nextshift-os-3/DOGFOOD_DIARY_2026-07.md (F-01~F-24)
> 流程: Codex 执行 → Claude 审查 → Claude Code 审计 → Steven 验收
> 纪律: 每批一个 PR,分支 `fix/batch-1-p0` / `fix/batch-2-data-sync`;修改必须带测试;不许顺手重构无关代码
> 基线: 合并部署后 Steven 按日记复现步骤逐条回归,以 version 端点实测为准

---

## 批 1(P0,先做)

### W1-A 限流桶拆分 — F-22 / F-24

**Root cause(已在代码确认,不用再排查)**
- `src/lib/ai-rate-limit.ts`: 默认 `userLimit=20`、`windowMs=1h`
- 全站 **~30 个端点全部用 `feature: 'generation'`** → 共用同一个 `ai:generation:user:{id}` 桶(grep `sharedAiRateLimitGuard(` 可见完整清单)
- 连 **非生成类写操作** 也在扣桶: `funnel-copy/apply`、`funnel-builder/publish-landing-page`
- `src/lib/rate-limit.ts`: 固定窗口,expire 只在首次 incr 设置 → F-22 是 60 分钟窗口、非永久锁(此点向 Steven 确认复测即可,无需修)
- 上游失败(如 F-24 的部分生成失败)已扣的配额不返还

**修复要求**
1. 每个端点用自己的 feature 名(按路由取名,如 `content-engine`、`lead-magnet`、`brand-bio`),不再共用 `generation`
2. `apply` / `publish` / 保存类端点改用普通操作限流(如 60/h 独立桶),不占 AI 配额
3. 单端点默认额度提到 30/h,总量护栏另加一个跨 feature 的 `ai:total:user` 桶(如 150/h)防滥用
4. 429 响应带 `Retry-After` 秒数与剩余配额;前端 toast 显示"约 X 分钟后可重试",替换现在的裸"操作过于频繁"
5. 批量生成任务(如引流资源批量生成)整批预检:剩余配额不足条目数时,开跑前就提示,不要跑一半断掉
6. AI 上游失败(非用户原因)返还本次扣减(redis DECR / 内存 count--)

**验收**
- [ ] 在模块 A 连续生成 5 次后,模块 B 仍可正常生成
- [ ] 429 文案含预计恢复时间
- [ ] 批量生成要么整批开跑、要么开跑前拦截,不出现半批失败
- [ ] `src/__tests__/security/rate-limiting.test.ts` 更新并通过,新增 feature 隔离测试

### W1-B 编辑丢数据 — F-19(P0 数据损毁)

**现象**: 内容编辑后离开页面/切换,已输入内容无保存、无确认、直接丢失(复现步骤见日记 F-19)

**修复要求**
1. 编辑态 debounce 自动存草稿(3s 无输入即存,后端草稿字段或 draft 表;若后端改动过大,先落 localStorage 键 `draft:{module}:{id}` 作为止血)
2. 有未保存改动时离开:路由切换拦截 + `beforeunload` 确认
3. 重新进入页面检测到草稿 → 提示"恢复上次未保存的编辑?"

**文件线索**: `src/modules/content-engine/components/ContentCommandCenter.tsx`(已有 autosave 相关字样,查为何未生效/未覆盖该路径);同类编辑面参照 `src/app/(auth)/funnel/[id]/edit/page.tsx` 的 beforeunload 实现

**验收**
- [ ] 编辑 → 直接关标签页:有浏览器确认弹窗
- [ ] 编辑 → 站内跳转:有确认弹窗
- [ ] 强制丢失后重进:草稿可恢复
- [ ] 单测覆盖草稿保存/恢复逻辑

---

## 批 2(架构):状态不传播 / 数据同源化 — F-13 / F-17 / F-21 / F-23 / F-24

**现象族**: Brand DNA 人设已更新为新版(20年 Herbalife),但内容计划主题、Lead Magnet 标题、Retail 内容方向等下游仍显示旧人设("电子厂技术人员+副业教练"),同屏新旧混杂(F-24 截图)

**Root cause 假设(Codex 先验证再动手)**: 下游模块在生成时把 brand-dna 快照**冗余存储**进自己的记录,之后 brand-dna 更新不触发任何失效/更新

**修复要求(按此优先序)**
1. **展示层同源**: 所有页面上"人设/定位/信任证明"类展示字段,一律实时读 brand-dna 单一来源,禁止读本模块存的快照副本
2. **快照标记**: 已生成的内容(计划、Lead Magnet 等)保留生成时快照属正常,但须存 `brandDnaVersion`;brand-dna 更新时版本号 +1,下游检测到落后 → 页面顶部显示"人设已更新,此内容基于旧版人设,建议重新生成"横幅 + 一键重新生成
3. **不做**全自动级联重生成(消耗配额且用户可能不想覆盖),只做提示 + 手动触发

**排查入口**: `src/modules/brand-dna/components/BrandDNAStudio.tsx`(保存路径)、brand-dna 更新的 API route、以及 content-plan / lead-magnet / traffic-engine 各自的读取来源

**验收**
- [ ] 修改人设 → 刷新内容计划/引流资源/Retail 页,展示类字段全部为新人设,同屏无新旧混杂
- [ ] 旧生成物页面出现"基于旧版人设"横幅,点击可重新生成
- [ ] 加 brandDnaVersion 迁移脚本(存量数据默认 v1)
- [ ] 单测: 版本比对 + 横幅触发条件

---

## 批 3(排队,本工单不做,仅登记)
- F-09 语音生成失败静默吞错 → 按 F-24 的"明示失败项 + 单项重试"模式改造
- F-18 / F-20 体验碎项
- 全站推广单项重试模式为错误处理标准

---

## 批 4(可与批 1/2 并行):首页整顿 + 术语降门槛 — F-25 / F-26

> 分支 `fix/batch-4-dashboard`;只动 dashboard 相关组件与文案,不碰批 1/2 涉及的 API/limiter 文件
> 依据: DOGFOOD_DIARY F-25(首页信息过载,截图实证)、F-26(术语超纲)
> 设计原则: 第一屏只回答一个问题——"我今天做什么"。同一信息全页只允许出现一次。

### W4-A 首页组件删/留/移清单

| 组件 | 处置 | 说明 |
|---|---|---|
| 业务评分卡(评分/准备度/预测信心) | **撤出首页** | 移入 Journey 页;数据自相矛盾问题(评分18+信心0 vs 成果100%)一并排查 |
| 主任务卡 | **保留,瘦身** | 只留: 任务标题(中文)+ 一句话说明 + 主按钮 + 预计时间。三段"为什么"折叠为一个"为什么是这个?"展开项;删除卡内多套进度(33%/已验证/待补齐/100%成果/0%成果) |
| 右栏(已完成/执行步骤/紧急/缺口/预期结果/里程碑) | **整栏删除** | 全部为主卡片信息重述 |
| Journey Snapshot | **压缩为一条细进度条** | 上一步✓ → 当前 → 下一步,点击跳 Journey 页 |
| Business Momentum | **空状态不渲染** | 有数据才出现;其 CTA 与主卡片重复,删 |
| 每周复盘(日志列表) | **撤出首页** | 收成一句话摘要;详情移独立页;去重(Build Authority x2 等)、翻译成用户语言 |

### W4-B 内部信息泄漏清理(全站扫,不限首页)
- 禁止向用户展示内部字段名: `leadMagnet.exists`、`facebook.cta`、`facebook.pageName` 等 → 建字段名→用户文案映射表
- "剩余 47.44 小时" → "约 2 天";所有数字展示过一遍人性化格式化
- 中英混杂: 用户界面标题/正文统一走 i18n,禁止硬编码英文标题(如 "Create Your First Lead Magnet")

### W4-C 术语改名与降门槛(F-26)
1. **"AI COO" 全站改为 "AI 教练"**: UI 文案、i18n 键值、onboarding、AI prompt 里的自称,全部替换;代码内部标识符可保留不动,只改用户可见层
2. 术语统一: "引流资源" vs "引流磁铁" 二选一(建议"引流资源"),全站唯一
3. 产出 `docs/nextshift-os-3/GLOSSARY.md`: 用户语言 ↔ 内部术语对照表,后续所有新文案照表写

### 验收
- [ ] 首页首屏只有: 一张瘦身任务卡 + 一条 Journey 进度条(无数据时 Momentum 不出现)
- [ ] 全页 grep 不到 "COO"(用户可见层)、不到内部字段名裸露
- [ ] 界面无中英混杂标题;"引流磁铁"字样清零
- [ ] Steven 3 秒测试: 打开首页 3 秒内能说出"我现在该做什么"
