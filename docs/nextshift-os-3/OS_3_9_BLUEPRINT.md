# OS 3.9 Blueprint — "The AI Becomes Real"(AI 真的开始工作)

> 状态: **APPROVED**(Steven 2026-07-24 拍板,三决策点均照稿:G1 先行、重生成默认覆盖、范围外维持)
> **执行姿态(Steven 授权)**: 尚无真实用户,以最短路径最高效率执行——**允许破坏性简化**:测试数据可清可弃(如 G6 直接清库而非渐进去重)、无需为存量数据做兼容迁移、旧模板生成物可批量作废。**不变的**: 发布门禁与代码审查流程(护的是代码库不是数据)、合规硬过滤(护的是未来的输出)。此授权随第一个真实用户到来自动失效。
> 依据: DOGFOOD_DIARY_2026-07.md(F-01~F-29,两天实测)、F-28 结案报告(Codex git 考古)、ONBOARDING_REDESIGN_ONE_PAGER.md、MASTER_ROADMAP v1.2(§0.1 三断点/§1.5 小白七条件/§1.6 双轨隔离)
> 前置事实: 四个生成模块从未接入 LLM(确定性模板,224c1f8 起);新 video 管线(src/modules/video)已真调 router,是重建参照
> 成败标尺不变: 55 岁阿姨 10 分钟发出第一帖,第七天还回来——且那一帖是 AI 真写的、像她的、合规的

---

## 为什么是这两条主轴

Dogfood 揭开的所有大 findings 归结为一件事:**产品的核心承诺"AI 帮你写"不真**。
- F-28: 生成层全是模板复读机(点十次一样)
- F-15: 内容薄、变量兜底、语法崩坏——因为根本没有 LLM 在写
- F-29: 零售页跑招募话术+收入承诺——因为模板不认 mode、不认合规
- F-13/17/21/23/24: 新旧人设混杂——因为模板快照不认 Brand DNA 版本
- F-27: 访谈重、补填墙——因为建档被当成用户的工作

Track G 让 AI 真写;Track O 让 AI 有料可写(人)、有规可依(事业包)。两轨共用同一批基础件(事业包、硬过滤、Brand DNA 注入),是一件事的两面。

---

## 任务清单(pipeline 索引)

> 本表是 `scripts/os-pipeline/run-pipeline.sh` Step 1 选题的唯一依据:按物理顺序(自上而下)取第一个状态非"已完成"的行。W1→W2→W3 即交付顺序,不代表 Track 分组。G4/G5 的"review 强制暂停"是 pipeline 侧的人工闸门(Step 3 本地验证通过后不进入 Step 4 自动 review/合并,PR 留 open 等 Fable 窗口人工复审),不是 blueprint 本身的状态。

| ID | 名称 | Track | Wave | 状态 |
|---|---|---|---|---|
| G0 | 统一生成网关(地基,先行) | G | W1 | 已完成(统一生成网关落地 src/modules/ai/generation:GenerationContext + 上下文/prompt 组装 + router 接线 helper + 显式降级契约;PR #147 / fef84f2) |
| G1 | content-engine 首个接入 | G | W1 | 已完成(generatePlatformPost 帖子正文经 G0 网关走 LLM:结构化产物 title/hook/body/cta/hashtags 落库,模板降为显式 fallback,generatedByAi 诚实反映来源+降级带 GENERATION_DEGRADE_LABEL,parseGeneratedPostJson 五处拒绝路径+一条正向路径单测覆盖;PR #148 / 2e56a3b) |
| O1 | 事业包 data pack | O | W1(并行,Steven 口述) | 已完成(事业包数据落地 src/modules/ai/business-pack:版本化 JSON 资产 version+priceListEffectiveDate,含产品线/双轨话术/异议库/合规红线/替代词表/追问模板/B路径默认引导,每条目带 track+visibility 目的地分级(价格/体重框架标 private);typed 校验 loader + getBusinessPackSlice({track}) 公开安全切片经 G0 seam 注入,替代词表脱敏后零品牌名/价格/体重数字承诺;content-engine 首个真实消费者接入且保留 CONTENT_POST_JSON_SYSTEM_INSTRUCTION,G1 解析与 F-15 护栏不回归;PR #149 / 3b8e80d) |
| G4 | 输出硬过滤层(合规闸) | G | W2 | 已完成(公开面三判定硬过滤 src/modules/ai/compliance/hardFilter.ts:income_promise/medical_claim/weight_claim/public_price 四类拒绝码,命中即拒绝并要求重生成;品牌/商标残留自动改写为安全通用词,替代词表来自事业包;体重数字承诺按动词锚定拦截(瘦/减重/减脂/掉+数字+单位),价格公开面硬拒绝(价格私聊专属);Fable 复审两轮(阻断项+微修正)后放行;PR #151 / f33c60d) |
| G5 | 失败可见性 | G | W2 | 已完成(LLM 失败重试耗尽后经 src/modules/ai/generation/gateway.ts runGeneration 明示标注失败+可点击重试,不再静默回退模板;成功路径 logAIUsage 遥测改为 best-effort(try/catch 吞掉,失败不污染真实成功结果,补测覆盖);provider 错误经 runtimeFallbackLogger 上报;UI 端 ContentGenerationDegradedNotice 呈现降级提示+重试按钮;'点此重试'硬编码中文记入后续跨模块文案迁移批次;Fable 复审后放行;PR #152 / b5b1dc9)
| G2 | lead-magnet + webinar-center 接入 | G | W2 | 已完成(经 G0 网关真实接入 LLM;PR #155 / 8d208df) |
| O2 | 分叉访谈 | O | W3 | 已完成(数据驱动 5 主题 A/B 三步漏斗接入向导;确认句经 G0+G4/B 路径加严后直接写入版本化 Brand DNA,无二次提取;PR #163 / 1e1f2f9) |
| O3 | 默认值全填满 + confidence | O | W3 | 已完成(纯函数 brandDnaDefaults(src/modules/brand-discovery/forkedInterview/brandDnaDefaults.ts):5 确认答案+推断+事业包中性合规默认→零空字段(content.contentPillars≥3),validateBrandDNA(...).missingFields 输出为空;BrandDNAMeta 增可选 fieldProvenance,按 ${section}.${field} 键(复用 findMissingFields 约定)区分 user-confirmed/coach-defaulted,存 User.metadata 专用键并在 getBrandDNA 读路径回并,跨主路径 BrandProfile 重载存活、无 schema 迁移;confirmForkedInterviewTopic 于 saveBrandDNA 前一次性填充并记 provenance,v(n+1) 首版即零空字段、无二次保存;profile PATCH 的 DNA 字段编辑改走 brandDnaService.updateBrandDNA 使 meta.version +1 并把该字段 provenance 翻回 user-confirmed,非 DNA 遗留 metadata 键行为不变;BrandProfileStep 仅在 coach-defaulted 字段渲染"教练猜的,点此改"标注;A/B 双路径默认填充/provenance/版本+1 均有 co-located 单测,默认文案零品牌名/价格/体重/收入承诺;PR #164 / 7403202) |
| O4 | Review Room 下线 → just-in-time 字段 | O | W3 | 已完成(移除入门 profile 补填墙，DNA 权威资料直达 accounts/guides；Facebook 主页、头像、WhatsApp 在首次需要处单字段可跳过追问；PR #165 / 0504707) |
| O5 | F-14 硬闸门拆除 | O | W3 | 已完成(拆除下游生成前的 Brand-DNA-完整度 UI 硬闸:content-engine 的 BrandDNAGate 与 lead-magnet 的 ReadinessGate 早退拦截移除,生成面永远渲染并经既有 G0 网关走 O3 默认值填充+G4 硬过滤,不再 bounce 回 /brand-builder/step/profile;资料不全只降质不锁门——改以内联、非阻断、教练口吻质量提示("资料越全成品越像你",零品牌名/价格/体重/收入承诺)呈现;区分"资料不完整(永不锁门,显示教练提示)"与"资料加载失败(可点击重试,沿用 G5 模式)"两态,后者不再是须补完 Brand DNA 的死胡同;server generate 路由与 G0/G4/G5/O3/sharedAiRateLimitGuard 均无回归;ContentCommandCenter 补测(不完整档案渲染生成控件而非 BrandDNAGate、完整档案不回归、加载错误呈现重试)+ 新增 LeadMagnetDashboard co-located 测试证明不再硬锁;PR #166 / f4c9c0e) |
| G3 | video-production 旧管线退役 | G | W3 | 已完成(旧 video-production 模块代码删除,功能并入 video/;PR #167 / fde5660) |
| G6 | 内容库卫生(F-28 库污染) | G | W3 | 已完成(草稿去重防污染;PR #169 / 5c64867) |
| W1 | UserAccount schema + businessStartAt | 批 1 | 地基 | 已完成（PR #204，2026-07-31 合并；完整 CI 全绿，59 条 readiness fixtures 含迁移登记断言） |
| W2 | 「今天做什么」确定性逻辑 + 底部一句 | 批 1 | 地基 | 已完成（PR #203，2026-07-31 合并；lint/type-check/build exit code 均为 0） |
| W3 | 新首页 `/` 骨架 | 批 1 | 下一批 | 已完成（PR #213，2026-08-04 合并；RSC 边界修复后完整 CI/E2E 全绿，人工收尾） |
| W4 | 路由占位 + 旧路由下线 | 批 1 | 下一批 | 已完成（PR #216，2026-08-04 合并；完整 CI/E2E 全绿；退役路由统一由 middleware 302 到裸 `/`，显式丢弃 query） |
| W5 | 「我的账号」管理页 UI | 批 1 | 下一批 | 待办（依赖 W1，已满足） |
| U2 | 用户面重建·批2（内容页 /post 发） | U | 重建批2 | 待启动（依赖批1 全部完成；规格 USER_SHELL_REBUILD_SCOPE_V1.md §7 批2） |
| U3 | 用户面重建·批3（跟进页 /follow 跟） | U | 重建批3 | 待启动（依赖 U2；信号源按修订一降级，webinar 进度事件留接口） |
| U4 | 用户面重建·批4（admin 归位） | U | 重建批4 | 待启动（依赖批1 全部完成；6.2 八项清单已锁定） |
| M1 | 双轨隔离贯通验收(F-29 根治) | M | W4/T2（并入模板实例化） | 已撤回（PR #180 / Fable 2026-07-28 决议：不作为独立待办；缺口并入批 1 W4/T2） |
| SA1 | 超管用户数据重置(走查前置工具) | U | W3.5（走查前置，HUMAN_GATE） | 已完成（PR #182，2026-07-28 合并） |

---

## Wave 1(W1)— 地基:生成网关 + 事业包

### G0 统一生成网关(地基,先行)
所有 generate service 一律经 `modules/ai` router(`getRouterForTenant().generate()`),照抄新 video 管线的接线模式。定义统一的生成上下文注入:Brand DNA(带版本)+ mode(Retail/Recruitment)+ 平台特征 + 事业包切片。
- 架构铁律沿用: LLM 必须走 modules/ai router,禁止 service 直连 provider
- 每模块的模板文案降级为 **LLM 不可用时的显式降级路径**(带用户可见标注"AI 暂时不可用,这是基础版本"),不再冒充生成结果

### G1 content-engine 首个接入(最痛处先修)
- prompt 组装: Brand DNA 故事字段 + mode 内容方向 + 平台风格(FB/XHS/IG 各自成文习惯)
- 验收: 同参数连续生成 3 次,内容各不相同且都贴合人设;F-15 三缺陷(变量兜底/正文薄/枚举裸奔)随之消灭

### O1 事业包 data pack(两轨共同地基,依赖 Steven 口述)
- 结构: 产品线/双轨话术/异议库/合规红线/替代词表/追问模板/B路径默认引导,JSON/DB 数据包,不硬编码
- 内容源: Steven 口述(问题清单已发),我整理,Steven 审定
- **这是 3.9 唯一的非代码关键路径,越早口述越早解锁 O2/G1 的 prompt 质量**

---

## Wave 2(W2)— 合规闸 + 失败可见 + 第二个模块接入

### G4 输出硬过滤层(合规闸,全模块共用)
生成后强制过滤,不靠 prompt 自觉:
- **品牌隐身**: 对外输出零 "Herbalife/贺宝芙/康宝莱/产品商标名",命中即改写(替代词表来自事业包)
- **收入承诺**: "月入/日入 RM|X千|X万/保证收入"类模式命中即拒绝并重生成(F-29 活证)
- **疗效宣称**: 禁"治/治愈/根治/降三高"类医疗承诺
- 验收: 自动化测试批量生成 N 篇跑三类断言全零命中
- **pipeline 侧标记**: review 步强制暂停,Step 3 本地验证通过后不自动合并,人工交 Fable 窗口复审

### G5 失败可见性(F-09/F-24 模式全站化)
- LLM 失败: 重试(router 已有)→ 仍失败则**明示**"生成失败,点此重试",绝不静默回退模板
- 批量任务沿用 F-24 单项重试模式
- provider 错误上报 Sentry(现状:纯模板 service 零上报,生产 7 天日志零 AI 行——以后这里必须有心跳)
- **pipeline 侧标记**: review 步强制暂停,Step 3 本地验证通过后不自动合并,人工交 Fable 窗口复审

### G2 lead-magnet + webinar-center 接入
- 同 G0 上下文;Webinar 标题类畸形句(受众整段塞标题)从根消失
- 双轨内容方向强制分流(见 M1)

---

## Wave 3(W3)— 反转式入门 + 视频归一 + 清库 + 双轨验收

### O2 分叉访谈(5 主题 × 三步漏斗)
- 主题1 分叉(A 产品先行/B 事业先行),选择题起步→事实追问→AI 组稿确认
- 确认即入 Brand DNA(带版本),无二次提取

### O3 默认值全填满 + confidence
- 事业包默认值 + 5 答案推断,零空字段;低置信字段成品内标注"教练猜的,点此改"
- 修正回写 Brand DNA 版本 +1(接批 2 的 brandDnaVersion)

### O4 Review Room 下线 → just-in-time 字段
- 按一页纸触发表;一次一问、可跳过、跳过不挡路

### O5 F-14 硬闸门拆除
- 下游永远可生成,资料不全只降质不锁门

### G3 video-production 旧管线退役
- 截图对应的 `/api/v1/video-production` 旧模板管线下线,统一到 src/modules/video 新管线
- 顺手修新管线 json.ts 的静默模板回退(改为重试→明示失败,见 G5)

### G6 内容库卫生(F-28 库污染)
- 重新生成默认**覆盖当前草稿**(用户显式"另存副本"才新建);已污染的重复草稿出一次性清理脚本
- 库列表按内容哈希去重提示

### M1 双轨隔离贯通验收(F-29 根治)
- mode 作为生成上下文一等字段贯穿 G1-G3 与漏斗文案:Retail=产品/健康故事(卖效果或过程),Recruitment=路径卖点("系统带你做",见一页纸招募主卖点节)
- 漏斗落地页文案纳入 brandDnaVersion 同源体系(批 2 延伸)
- **F-33 根因补充(截图实证 @2a6fd20,2026-07-25)**:双层根因——①Brand DNA 目标字段用"零售侧——…;招募侧——…"两轨拼接存储在同一个字段里,读取时没有做 track-scoped 拆分,导致跨轨内容互相泄漏;②漏斗「AI 生成文案」路径没有接入 G0 的 mode 隔离与 G4 硬过滤,是一条绕开生成管线的独立路径。复现基准:DOGFOOD_DIARY F-33 截图场景,修复后须以同一场景逐条复验。
- 验收: 零售页 grep 无"创业/副业/收入"词根;招募页 grep 无疗效词根;以 F-33 截图场景为复现基准逐条验证

**2026-07-27 Fable 改判(撤回本项独立完成状态)**:产品形态修正案第五节定漏斗编辑器降为 admin 工具(用户面不再暴露),Fable 判定"修一条即将拆除的路径是浪费圈数"。PR #171 的真实范围重新核实为仅 1 行改动(`track` 字段加 `.default('retail')`,funnel-copy 路由),并未实现本节标题所称"mode 贯穿漏斗文案"的全链路隔离。本项状态改回未完成,原验收标准(零售页无创业/副业/收入词根、招募页无疗效词根、F-33 场景复验)不变但整体并入 W4/T2 模板实例化重做,一并解决:①`track` 必填,缺失即 400,禁止静默默认(现状 `AIFunnelCopyButton` 不发 `track`,招募漏斗会被静默当零售生成);②`Funnel` 表加 `track` 归属列(现状 schema 无此字段)。现有用户面自由生成的漏斗页按既有破坏性简化授权全部作废清库(不做兼容迁移、不做过期横幅),清库脚本另行执行,不在本次文档改动范围内。

### SA1 超管用户数据重置(走查前置工具)

**背景**:无真实用户期需要反复跑"全新账号端到端走查",每次换邮箱注册会撞 F-02/F-03(auth 不级联、软删占唯一键、FK 拦截)。做 reset 而非 delete,可完全绕开 auth 层。

**范围**:super admin 界面对指定用户一键重置业务数据。
- auth 账号、User 行、租户归属、角色 一律保留(用户仍能用原邮箱密码登录)
- 清除 user-scoped 表中该 userId 的全部记录(以 prisma/schema.prisma 为准复核实际表清单,不得照抄任何草稿清单;参考范围含 UserProgress/Mission/Achievement/BrandProfile/Lead/Note/Activity/Funnel/AIUsageLog/ScheduledMessage/DailyAction/TrainingProgress/Content/VoiceProfile/AnalyticsEvent/Customer/BrandInterview/PostPerformance/ContentCalendar/VideoProject 等约 22 张表)
- 同时清 `User.metadata` 中 Brand DNA 相关键(`brand_dna`/`brand_profile`/`fieldProvenance`/`brand_dna_track_audience`)——漏清会导致重置后访谈仍显示已完成
- 不清:`AuditLog`(审计完整性)、`Feedback`(dogfood findings)

**硬性安全要求(缺一不予通过)**:
1. 删除条件严格按 userId/ownerId;禁止出现任何仅以 tenantId 为条件的删除语句(同租户存在其他账号,按租户删会连坐)
2. 二次确认需操作者输入目标账号完整 email 字符串,非布尔确认
3. 全部删除包在单一事务内,任一步失败整体回滚
4. 写 AuditLog:操作者/时间/目标 userId+email/逐表删除条数
5. API 返回逐表删除条数收据并在 UI 呈现
6. 仅 super admin 可见可调用,普通 admin 与用户面零入口

**验收**:
- 对测试账号执行 reset → 用原邮箱密码仍可登录 → 首页呈现全新用户状态 → 访谈可从头做(不显示已完成) → 内容库/漏斗/日历全空
- 同租户另一账号数据零变化(多租户连坐防回归,必须有测试覆盖)
- AuditLog 有本次记录且未被清除
- 收据条数与实际删除一致

**闸门**:进 `HUMAN_GATE_ITEMS`,PR 留 open 等 Fable 复审,不自动合并。排在端到端走查之前,是走查的前置工具。

---

## 交付顺序(建议)

```
W1: G0 网关 + G1 content-engine ←→ O1 事业包录入(并行,Steven 口述)
W2: G4 硬过滤 + G5 失败可见性 + G2(lead-magnet/webinar)
W3: O2/O3 访谈+默认值 → O4/O5 拆墙 + G3 视频归一 + G6 清库 + M1 双轨隔离验收
持续: Dogfood 闸门继续,每步上产即实测
```

前置依赖: 批 2(brandDnaVersion)与批 4(#123 新首页)合并并随下一 release 部署——它们是 3.9 的地板。

## 闸门与验收(整版)

- [ ] 阿姨测试: 新账号 10 分钟发出第一帖(计时实测,含真实小白一名)
- [ ] 生成真实性: 任一模块同参数生成 3 次,三篇不同且贴合人设
- [ ] 合规零命中: 批量生成断言(品牌词/收入承诺/疗效)全绿
- [ ] 双轨隔离: 零售/招募页 grep 验收通过
- [ ] 失败可见: 断开 provider key 的演练环境中,用户看到的是"重试"而非模板假货
- [ ] 含 schema 迁移 → 发布前重跑完整备份+隔离恢复演练(既定规矩)

## 明确不做(3.9 范围外)
- 计费/订阅、Stage B 扩建(Creative Studio 个性化等)、B4 配图模板、C0 广告分析——待结果闸门 A(≥10 真实周活)
- AI 讨论/"问教练"入口重建(服务层已保留,等入门与生成两轴落地后按 F-27 假设验证)
