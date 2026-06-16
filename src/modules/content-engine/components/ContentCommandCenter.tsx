'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BarChart3, Calendar, Clock, FileText, Lightbulb, Sparkles, Target, Zap, TrendingUp } from 'lucide-react';
import { useDashboardMission } from '@/modules/dashboard/hooks/useDashboardMission';
import { usePublishingCenter } from '@/modules/content-publishing/hooks/usePublishingCenter';

const AI_RECOMMENDATIONS = [
  { title: '为什么大部分人副业失败？', type: '教育型', platform: 'Facebook', impact: '互动率高' },
  { title: '我犯过最大的健康错误', type: '故事型', platform: 'Instagram', impact: '信任建立' },
  { title: '客户最常问我的问题', type: '问答型', platform: 'TikTok', impact: '潜在客户' },
];

const WEEKLY_PLAN = [
  { day: '周一', type: '故事型', pillar: 'personal_story' },
  { day: '周三', type: '教育型', pillar: 'education' },
  { day: '周五', type: '案例型', pillar: 'social_proof' },
  { day: '周日', type: '邀请型', pillar: 'offer' },
];

export function ContentCommandCenter() {
  const router = useRouter();
  const { mission } = useDashboardMission();
  const publishing = usePublishingCenter();

  const completedTasks = mission.tasks.filter(t => t.completed).length;
  const totalTasks = mission.tasks.length;

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">内容指挥中心</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">AI 内容引擎</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">系统知道你是谁、你的受众、你应该发布什么。只需要决定生成、编辑、发布。</p>
        </div>
        <Link href="/content-engine" className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]">
          <BarChart3 className="h-4 w-4" />完整仪表盘
        </Link>
      </div>

      {/* Section 1: Today's Content Mission */}
      <section className="rounded-[var(--radius-lg)] border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-blue-800">今日内容任务</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-[var(--color-text-muted)]" />
              <span className="text-[var(--color-text-muted)]">目标：<span className="font-medium text-[var(--color-text)]">建立信任</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-[var(--color-text-muted)]" />
              <span className="text-[var(--color-text-muted)]">建议内容：<span className="font-medium text-[var(--color-text)]">为什么我开始经营副业</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-[var(--color-text-muted)]" />
              <span className="text-[var(--color-text-muted)]">内容类型：<span className="font-medium text-[var(--color-text)]">故事型内容</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />
              <span className="text-[var(--color-text-muted)]">预计时间：<span className="font-medium text-[var(--color-text)]">10 分钟</span></span>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-2">
            <p className="text-xs text-[var(--color-text-muted)]">任务进度：{completedTasks}/{totalTasks}</p>
            <button
              onClick={() => router.push('/content-engine?generate=smart&platform=facebook')}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              生成推荐内容 <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: AI Recommendations + Weekly Calendar */}
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-3">AI 推荐内容</h2>
          <div className="space-y-2">
            {AI_RECOMMENDATIONS.map((rec, i) => (
              <div key={i} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 hover:bg-[var(--color-surface)] cursor-pointer" onClick={() => router.push('/content-engine?generate=smart')}>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">{rec.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{rec.type} · {rec.platform} · {rec.impact}</p>
                </div>
                <Sparkles className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-base font-semibold">本周内容计划</h2>
          </div>
          <div className="space-y-2">
            {WEEKLY_PLAN.map((day, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-10 font-semibold text-[var(--color-text)]">{day.day}</span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-xs">{day.type}</span>
              </div>
            ))}
          </div>
          <Link href="/content-engine" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]">查看完整日历 →</Link>
        </section>
      </div>

      {/* Section 3: Queue + Performance */}
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-3">内容队列</h2>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded bg-gray-50 p-2"><span className="font-semibold text-gray-600">{publishing.stats.drafts}</span><br /><span className="text-gray-400">草稿</span></div>
            <div className="rounded bg-blue-50 p-2"><span className="font-semibold text-blue-600">{publishing.stats.approved}</span><br /><span className="text-blue-400">待审核</span></div>
            <div className="rounded bg-purple-50 p-2"><span className="font-semibold text-purple-600">{publishing.stats.scheduled}</span><br /><span className="text-purple-400">已排程</span></div>
            <div className="rounded bg-emerald-50 p-2"><span className="font-semibold text-emerald-600">{publishing.stats.published}</span><br /><span className="text-emerald-400">已发布</span></div>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-base font-semibold">表现快照</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">故事型内容</p>
              <div className="flex gap-4 mt-1 text-xs">
                <span className="text-emerald-600">互动率 +38%</span>
                <span className="text-blue-600">潜在客户 +12</span>
              </div>
            </div>
            <div className="h-1 w-full rounded-full bg-[var(--color-surface)]">
              <div className="h-full w-[72%] rounded-full bg-emerald-500" />
            </div>
          </div>
        </section>
      </div>

      {/* AI Coach */}
      <section className="rounded-[var(--radius-lg)] border border-amber-100 bg-amber-50 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-5 w-5 text-amber-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">AI 教练建议</h2>
        </div>
        <p className="text-sm text-[var(--color-text)]">
          过去30天，你的<span className="font-semibold">故事型内容</span>表现比教育型高 <span className="font-semibold text-emerald-600">2.4 倍</span>。
          建议本周发布 <span className="font-semibold">2 篇</span> 故事型内容。
        </p>
      </section>
    </div>
  );
}
