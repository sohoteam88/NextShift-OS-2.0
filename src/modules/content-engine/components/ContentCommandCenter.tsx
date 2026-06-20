'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Calendar, CheckCircle2, Clock, FileText, Lightbulb, Sparkles, Target, Zap, TrendingUp } from 'lucide-react';
import { useDashboardMission } from '@/modules/dashboard/hooks/useDashboardMission';
import { usePublishingCenter } from '@/modules/content-publishing/hooks/usePublishingCenter';

const CONTENT_MIX = [
  { type: '教育', ratio: '40%', reason: '让受众先理解问题和方法' },
  { type: '故事', ratio: '20%', reason: '建立信任和个人连接' },
  { type: '权威', ratio: '20%', reason: '证明你有能力带他们前进' },
  { type: '邀约', ratio: '10%', reason: '把兴趣转成私聊或表单' },
  { type: '社群', ratio: '10%', reason: '制造互动和持续触达' },
];

export function ContentCommandCenter() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mission, nextAction, isLoading } = useDashboardMission();
  const publishing = usePublishingCenter();
  const generateCalendar = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/content-engine/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 30 }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: { message?: string }; message?: string };
        throw new Error(payload.error?.message ?? payload.message ?? '生成失败，请先完成 AI 访谈和品牌资料。');
      }
      return response.json() as Promise<{ data: { days: number; items: unknown[] } }>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['content-engine'] });
    },
  });

  const completedTasks = mission.tasks.filter(t => t.completed).length;
  const totalTasks = mission.tasks.length;
  const hasQueuedContent = publishing.queue.length > 0;
  const hasPublishedContent = publishing.stats.published > 0;
  const nextMissionLabel = isLoading ? '读取当前 Journey...' : nextAction.title;

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">内容指挥中心</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">AI 内容引擎</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">系统知道你是谁、你的受众、你应该发布什么。只需要决定生成、编辑、发布。</p>
        </div>
        <Link href="/brand-builder/calendar" className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]">
          <Calendar className="h-4 w-4" />查看内容日历
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
              <span className="text-[var(--color-text-muted)]">目标：<span className="font-medium text-[var(--color-text)]">建立稳定内容节奏</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-[var(--color-text-muted)]" />
              <span className="text-[var(--color-text-muted)]">建议行动：<span className="font-medium text-[var(--color-text)]">先规划你的内容日历</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-[var(--color-text-muted)]" />
              <span className="text-[var(--color-text-muted)]">为什么现在：<span className="font-medium text-[var(--color-text)]">没有持续内容，漏斗不会有新触点</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />
              <span className="text-[var(--color-text-muted)]">预计时间：<span className="font-medium text-[var(--color-text)]">10-15 分钟</span></span>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-2">
            <p className="text-xs text-[var(--color-text-muted)]">当前 Journey：{nextMissionLabel}</p>
            <p className="text-xs text-[var(--color-text-muted)]">任务进度：{completedTasks}/{totalTasks}</p>
            <button
              onClick={() => generateCalendar.mutate()}
              disabled={generateCalendar.isPending}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {generateCalendar.isPending ? '正在读取品牌资料...' : '自动生成内容日历'} <ArrowRight className="h-4 w-4" />
            </button>
            {generateCalendar.isSuccess ? (
              <p className="text-xs font-medium text-emerald-700">已根据品牌资料生成 30 天内容日历。</p>
            ) : null}
            {generateCalendar.isError ? (
              <p className="text-xs font-medium text-red-600">{(generateCalendar.error as Error).message}</p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Section 2: AI Recommendations + Weekly Calendar */}
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-3">AI 推荐下一步</h2>
          <div className="space-y-2">
            {[
              { title: '生成 30 天内容计划', meta: '根据 AI 访谈和品牌资料自动生成', href: 'generate-calendar' },
              { title: '查看内容日历', meta: '确认已生成内容和发布节奏', href: '/brand-builder/calendar' },
              { title: '回到 Journey', meta: '确认内容动作是否推进当前阶段', href: '/journey' },
            ].map((rec) => (
              <div
                key={rec.href}
                className="flex cursor-pointer items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 hover:bg-[var(--color-surface)]"
                onClick={() => rec.href === 'generate-calendar' ? generateCalendar.mutate() : router.push(rec.href)}
              >
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">{rec.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{rec.meta}</p>
                </div>
                <Sparkles className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-base font-semibold">内容比例</h2>
          </div>
          <div className="space-y-2">
            {CONTENT_MIX.map((item) => (
              <div key={item.type} className="flex items-start gap-3 text-sm">
                <span className="w-12 font-semibold text-[var(--color-text)]">{item.ratio}</span>
                <div>
                  <p className="font-medium text-[var(--color-text)]">{item.type}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => generateCalendar.mutate()}
            disabled={generateCalendar.isPending}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] disabled:opacity-60"
          >
            {generateCalendar.isPending ? '正在生成...' : '生成内容计划'} →
          </button>
        </section>
      </div>

      {/* Section 3: Queue + Performance */}
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-3">内容队列</h2>
          {hasQueuedContent ? (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded bg-gray-50 p-2"><span className="font-semibold text-gray-600">{publishing.stats.drafts}</span><br /><span className="text-gray-400">草稿</span></div>
                <div className="rounded bg-blue-50 p-2"><span className="font-semibold text-blue-600">{publishing.stats.approved}</span><br /><span className="text-blue-400">待审核</span></div>
                <div className="rounded bg-purple-50 p-2"><span className="font-semibold text-purple-600">{publishing.stats.scheduled}</span><br /><span className="text-purple-400">已排程</span></div>
                <div className="rounded bg-emerald-50 p-2"><span className="font-semibold text-emerald-600">{publishing.stats.published}</span><br /><span className="text-emerald-400">已发布</span></div>
              </div>
              <div className="space-y-2">
                {publishing.queue.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                    <p className="text-sm font-medium text-[var(--color-text)]">{item.title}</p>
                    <p className="text-xs capitalize text-[var(--color-text-muted)]">{item.platform} · {item.status}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-medium text-[var(--color-text)]">还没有内容队列</p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">先完成内容计划。生成后的草稿、审核和排程状态会出现在这里。</p>
            </div>
          )}
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-base font-semibold">表现快照</h2>
          </div>
          {hasPublishedContent ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">已发布内容</p>
                <div className="flex gap-4 mt-1 text-xs">
                  <span className="text-emerald-600">{publishing.stats.published} 篇已发布</span>
                  <span className="text-blue-600">{publishing.stats.successRate}% 发布成功率</span>
                </div>
              </div>
              <div className="h-1 w-full rounded-full bg-[var(--color-surface)]">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${publishing.stats.successRate}%` }} />
              </div>
            </div>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-medium text-[var(--color-text)]">还没有表现数据</p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">发布第一篇内容后，互动、线索和转化表现会自动出现在这里。</p>
            </div>
          )}
        </section>
      </div>

      {/* AI Coach */}
      <section className="rounded-[var(--radius-lg)] border border-amber-100 bg-amber-50 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-5 w-5 text-amber-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">AI 教练建议</h2>
        </div>
        <p className="text-sm text-[var(--color-text)]">
          先不要同时打开太多工具。今天最重要的是把内容节奏定下来，然后从第一篇可发布内容开始执行。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => generateCalendar.mutate()}
            disabled={generateCalendar.isPending}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {generateCalendar.isPending ? '正在规划' : '规划内容'} <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <Link href="/journey" className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100">
            查看 Journey <CheckCircle2 className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
