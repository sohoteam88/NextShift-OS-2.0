# UI 宪法 — AI 执行者的界面组合规则

Version: 1.0 Draft — 待 Steven 批准后成为强制标准
Date: 2026-07-15
Author: Claude (Orchestration)
地位: 与 RUNTIME_ADAPTER_STANDARD 同级——**任何 PR 含 UI 改动,先读本文;违宪 = review FAIL**
背景: 设计系统采用率 11/68、24 套 Card、3,519 处 token 逃逸——AI 各写各的口音,产品长成了拼贴画。本宪法不要求重画存量,要求**从今起所有新 UI 只准从同一套积木搭**。

---

## 第一条:两种页面,没有第三种

全站用户页只允许两种版式(模板组件化,放 `src/components/layouts/`):

1. **任务页**(TaskPageLayout):单栏、一个主卡片、一个主 CTA、次要信息折叠。用于:今天、生成流程、onboarding。**默认版式——拿不准就用它**
2. **工具页**(ToolPageLayout):顶部一句话说明 + 工具卡网格(手机单列)。用于:内容、工具箱、名单、设置

新页面不从空白 div 开始,从模板开始。需要第三种版式 = 先修宪(Steven 批准),不准先斩后奏。

## 第二条:积木清单(只准用这些)

`@/components/ui` 现有 12 件为唯一基础件来源:Button/Badge/Input/MetricCard/PageHeader/Toast/Spinner/Skeleton/Avatar/Breadcrumb/HelpTooltip/FeedbackProvider。规则:

- 缺能力 → **扩展现有件**(加 variant/prop),不新造同类件
- 确需新基础件 → 独立 PR 加入 `@/components/ui` + 本文第六条登记,才可使用
- **禁止**在模块目录内出现任何名为 *Button/*Card/*Input 的自造组件(lint 规则化)

## 第三条:Token 即法律

- 颜色:只准语义类(bg-surface/text-foreground/text-muted/border-border/bg-primary)——**零 hex、零 rgb、零任意值**
- 间距/圆角/字号:只准 Tailwind 刻度;`-[...]` 任意值一律违宪(存量 3,519 处只降不升,基线在 CI)
- 暗示:如果你需要一个 token 里没有的值,那是设计问题不是 CSS 问题——停下来问

## 第四条:手机优先(§1.5-3)

- 所有新 UI 先写单列手机版式,`lg:` 起才允许多列
- 可点目标 ≥ 44px;主 CTA 在拇指热区(屏幕下半部)
- 核心闭环(今天→生成→编辑→复制)的任何改动,验收含 375px 宽截图

## 第五条:文案即界面(§1.5-5 教练语气)

- 每个用户可见数字旁必须有一句"所以呢"(下一步建议)
- 空状态必须说"接下来做什么",禁止裸的"暂无数据"
- 错误必须说人话+出路("今日 AI 额度已用完,明天再来或升级"),禁止透出 code/异常文本
- 三语(zh/ms/en)经 next-intl,禁止硬编码文案(i18n:audit 已在 CI)

## 第六条:执法机制(没有这条,前五条会烂掉)

1. **lint**:任意值/hex/自造件规则 warn 起步,基线只降不升(基建已有:boundaries 生成器同款打法)
2. **截图进 review**:UI 改动的 PR 必须附 375px+桌面截图(扩展 auth-visual-qa.ts;pipeline 的 review 步骤看图);nightly 截图对比进 CI
3. **样板间登记**:本文附录维护"每种组件/版式的标准长相"截图——AI 执行者写 UI 前先看样板,review 者对照样板判违宪
4. **修宪程序**:改本文 = 独立 docs PR + Steven 批准,禁止在功能 PR 里顺手改规则(C-1 原则)

---

## 附录 A:AI 执行者的 UI 任务前检查清单(复制进每个 UI task 的 brief)

```
□ 读过 UI_CONSTITUTION.md 与 U2_IA_ONE_PAGER.md
□ 版式:任务页 / 工具页(二选一,写明选择)
□ 组件:仅 @/components/ui 现有件(缺件先走第二条程序)
□ 零任意值/零 hex(交付前 grep 自查)
□ 手机 375px 截图 + 桌面截图附 PR
□ 每个数字带"所以呢";空/错态有出路;零硬编码文案
```
