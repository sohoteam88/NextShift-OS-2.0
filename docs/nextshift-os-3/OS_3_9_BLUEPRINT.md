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
| G1 | content-engine 首个接入 | G | W1 | 已完成(generatePlatformPost 帖子正文经 G0 网关走 LLM:结构化产物 title/hook/body/cta/hashtags 落库,模板降为显式 fallback,generatedByAi 诚实反映来源+降级带 GENERATION_DEGRADE_LABEL,F-15 三缺陷护栏单测覆盖;PR #148 / 2e56a3b) |
| O1 | 事业包 data pack | O | W1(并行,Steven 口述) | 未开始 |
| G4 | 输出硬过滤层(合规闸) | G | W2 | 未开始(review 强制暂停) |
| G5 | 失败可见性 | G | W2 | 未开始(review 强制暂停) |
| G2 | lead-magnet + webinar-center 接入 | G | W2 | 未开始 |
| O2 | 分叉访谈 | O | W3 | 未开始 |
| O3 | 默认值全填满 + confidence | O | W3 | 未开始 |
| O4 | Review Room 下线 → just-in-time 字段 | O | W3 | 未开始 |
| O5 | F-14 硬闸门拆除 | O | W3 | 未开始 |
| G3 | video-production 旧管线退役 | G | W3 | 未开始 |
| G6 | 内容库卫生(F-28 库污染) | G | W3 | 未开始 |
| M1 | 双轨隔离贯通验收(F-29 根治) | M | W3(贯穿,验收收尾) | 未开始 |

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
- 验收: 零售页 grep 无副业/收入/招募词根;招募页无产品疗效话术

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
