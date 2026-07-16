# U2 — 信息架构一页纸(45 路由收敛决定表)

Version: 1.0 Draft — 待 Steven 逐项拍板
Date: 2026-07-15
Author: Claude (Orchestration)
原则来源: Master Roadmap v1.2 §1.5-1(永远只有一个下一步)、§1.6(招募/零售隔离)
规则: 小白用户可见目的地 ≤ 8;其余合并/隐藏/admin;**本文档批准前 U3 不得动手**

---

## 1. 用户可见的 7 个目的地(提案)

| # | 目的地 | 吸收哪些现有路由 | 小白视角的一句话 |
|---|---|---|---|
| 1 | **今天** `/dashboard` | dashboard, mission, journey(进度条内嵌) | "今天做这件事" |
| 2 | **内容** `/content` | content-engine, video, video-production, brand-builder(生成类工具入口收拢于此) | "帮我写/拍今天的帖子" |
| 3 | **内容库** `/library`(E2 新建) | (新) | "我做过的东西都在这" |
| 4 | **名单** `/leads` | leads, customers, crm, crm-center, sales → 一个双管道界面(§1.6:客户/伙伴两 tab + 毕业桥) | "该跟进谁" |
| 5 | **工具箱** `/tools` | funnel, funnel-builder, funnel-context, lead-magnet, webinar-center, whatsapp-ai, revenue-drivers(hub 形式,随 journey 解锁,未解锁不显示) | "进阶武器,练到了才开" |
| 6 | **学习** `/learn` | help, onboarding(起号教程 B5 落这里), social-setup | "手把手教我" |
| 7 | **设置** `/settings` | settings, billing, member, team(个人与团队管理合并进多 tab) | "我的账号" |

**导航形态**:手机底部 5 键(今天/内容/名单/工具/我) + "内容库""学习"从相应页面内进入。桌面侧栏同 7 项。**Retail/Recruitment 切换保留在顶部**,切换后 1/2/4/5 的内容按 mode 过滤(§1.6),导航结构本身不变——两个模式一张地图,减少迷路。

## 2. Admin 完全分离(团队长/平台侧,不在用户导航)

admin, admin-command, platform-admin, analytics(-center 合并为 admin 内报表页), ai-workforce, automation, ceo-mode, traffic-engine → 收进 `/admin` 单入口,角色守卫已有(v3.4 root layout)。**团队长看组员卡点的那页(User Management/成员判断)是产品资产,保留并强化;其余 admin 子页在 U1 盘点后合并。**

## 3. 隐藏/冻结(路由保留但从导航消失,等复活或归档)

| 路由 | 理由 | 处置 |
|---|---|---|
| franchise, saas, localization, blueprints, workspace | Roadmap v1.1 已冻结/内部概念,对小白是噪音 | 导航移除,直链可达,U1 盘点后定去留 |
| brand-discovery, brand-dna | 并入"学习"或 onboarding 流程步骤,不做独立目的地 | 合并 |
| ai | 基础设施模块的杂项页,面向用户的部分并入"内容" | 合并 |
| analytics(用户侧) | §1.5-5:小白不看面板;其数字以教练语气出现在"今天"和 Weekly Review | 并入今天/admin |
| unauthorized, member(公开注册相关) | 功能页,不属导航 | 保持 |

## 4. Steven 拍板清单

- [ ] 7 目的地命名与划分(尤其:"工具箱"随 journey 解锁的策略)
- [ ] 名单页双管道 + 毕业桥的形态
- [ ] analytics 从用户导航消失(数字改由教练语气送达)——这是最激进的一条
- [ ] 隐藏/冻结清单有无异议
- [ ] 底部 5 键的取舍(今天/内容/名单/工具/我)

批准后:U3 按此实施;每合并/隐藏一个路由,旧路径 301 到新家,绝不 404。
