'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Calendar, CheckCircle2, Copy, FileText,
  Loader2, MessageCircle, PenLine, Sparkles, Trophy,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { GeneratedPost, Platform, ContentFormat, FunnelStage, ContentCalendar } from '../types';
import { validateContent } from '../contentValidator';
import { getContentAdvisorTips } from '../contentAdvisor';
import type { ContentPillar } from '@/modules/brand-dna/types';

// ============================================================
// Hooks
// ============================================================

function useContentEngine() {
  return useQuery({
    queryKey: ['content-engine'],
    queryFn: async () => {
      const res = await fetch('/api/v1/content-engine');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{
        data: {
          pillars: ContentPillar[];
          lastPost: GeneratedPost | null;
          calendar: ContentCalendar | null;
          publishedCount: number;
        };
      }>;
    },
    staleTime: 30_000,
  });
}

function useGeneratePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts: { platform: Platform; format: ContentFormat; funnelStage: FunnelStage; pillarName?: string }) => {
      const res = await fetch('/api/v1/content-engine/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-engine'] }),
  });
}

function useGenerateCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (days: 30 | 90 | 180) => {
      const res = await fetch('/api/v1/content-engine/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-engine'] }),
  });
}

// ============================================================
// Component
// ============================================================

type ContentEngineDashboardProps = {
  initialPlatform?: Platform;
  autoGenerate?: boolean;
};

export function ContentEngineDashboard({
  initialPlatform = 'instagram',
  autoGenerate = false,
}: ContentEngineDashboardProps) {
  const router = useRouter();
  const query = useContentEngine();
  const generatePost = useGeneratePost();
  const generateCalendar = useGenerateCalendar();
  const [platform, setPlatform] = React.useState<Platform>(initialPlatform);
  const [copied, setCopied] = React.useState(false);
  const [calendarStatus, setCalendarStatus] = React.useState<string | null>(null);
  const autoTriggeredRef = React.useRef(false);

  const data = query.data?.data;
  const pillars = data?.pillars ?? [];
  const lastPost = data?.lastPost ?? null;
  const calendar = data?.calendar ?? null;
  const publishedCount = data?.publishedCount ?? 0;
  const advisorTips = getContentAdvisorTips(pillars, publishedCount, !!calendar);

  const quality = lastPost ? validateContent(lastPost) : null;

  React.useEffect(() => {
    setPlatform(initialPlatform);
  }, [initialPlatform]);

  React.useEffect(() => {
    const generatedDays = generateCalendar.data?.data?.days;
    const generatedItems = generateCalendar.data?.data?.items?.length;
    if (generateCalendar.isSuccess && typeof generatedDays === 'number' && typeof generatedItems === 'number') {
      setCalendarStatus(`✅ ${generatedDays} 天日历已生成 · ${generatedItems} 条内容`);
    } else if (generateCalendar.isSuccess && calendar) {
      setCalendarStatus(`✅ ${calendar.days} 天日历已生成 · ${calendar.items.length} 条内容`);
    }
  }, [calendar, generateCalendar.data, generateCalendar.isSuccess]);

  React.useEffect(() => {
    if (generateCalendar.isError) {
      setCalendarStatus('生成失败，请重试。');
    }
  }, [generateCalendar.isError]);

  const triggerGeneratePost = React.useCallback(() => {
    generatePost.mutate({ platform, format: 'text_post', funnelStage: 'awareness' });
  }, [generatePost, platform]);

  function handleGeneratePost() {
    triggerGeneratePost();
  }

  React.useEffect(() => {
    if (!autoGenerate || autoTriggeredRef.current) return;
    if (query.isLoading || query.isFetching || !query.data) return;
    autoTriggeredRef.current = true;
    triggerGeneratePost();
  }, [autoGenerate, query.isLoading, query.isFetching, query.data, triggerGeneratePost]);

  function handleCopy() {
    if (lastPost) {
      navigator.clipboard.writeText(lastPost.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  if (query.isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button>
          <div>
            <h1 className="text-xl font-bold">内容引擎</h1>
            <p className="text-xs text-[var(--color-text-muted)]">我帮你准备今天可以发的内容。</p>
          </div>
        </div>
        {publishedCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />{publishedCount} 篇已发布
          </div>
        )}
      </div>

      {/* Advisor */}
      {advisorTips.length > 0 && advisorTips[0].priority < 99 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold text-amber-700 mb-2">💡 建议</p>
          <p className="text-sm text-amber-800">{advisorTips[0].body}</p>
        </div>
      )}

      {/* Main 2-column grid: Left = Pillars + Post Gen, Right = Calendar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-4">
          {/* Pillars */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold mb-3">📚 内容支柱</h3>
            <div className="flex flex-wrap gap-2">
              {pillars.map((p) => (
                <span key={p.name} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {p.emoji} {p.name} <span className="text-blue-400">{p.percentage}%</span>
                </span>
              ))}
            </div>
          </section>

          {/* Post Generator */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold mb-3">✍️ 生成帖子</h3>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {(['instagram', 'facebook', 'tiktok', 'xhs'] as Platform[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold', platform === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600')}
                >
                  {p === 'instagram' ? 'IG' : p === 'facebook' ? 'FB' : p === 'tiktok' ? 'TikTok' : 'XHS'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleGeneratePost}
              disabled={generatePost.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {generatePost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
              为 {platform === 'instagram' ? 'IG' : platform} 生成帖子
            </button>
          </section>

          {/* Generated Post Preview */}
          {lastPost && (
            <section className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">📝 {lastPost.title}</h3>
                <div className="flex items-center gap-2">
                  {quality && (
                    <span className={cn('text-xs font-bold', quality.score >= 70 ? 'text-emerald-600' : 'text-amber-600')}>
                      质量 {quality.score}%
                    </span>
                  )}
                  <button type="button" onClick={handleCopy} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                    {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {lastPost.body}
              </div>
              {lastPost.hashtags.length > 0 && (
                <p className="mt-2 text-xs text-blue-600">{lastPost.hashtags.join(' ')}</p>
              )}
            </section>
          )}
        </div>

        {/* Right column: Calendar */}
        <div className="space-y-4">
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5 lg:sticky lg:top-20">
            <h3 className="text-sm font-bold mb-3">📅 内容日历</h3>
            <p className="mb-3 text-xs text-[var(--color-text-muted)]">生成接下来 30、90 或 180 天的内容日历。</p>
            <div className="flex flex-wrap gap-2">
              {([30, 90, 180] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => generateCalendar.mutate(days)}
                  disabled={generateCalendar.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  生成 {days} 天
                </button>
              ))}
            </div>
            {generateCalendar.isPending && (
              <p className="mt-3 text-xs text-[var(--color-text-muted)]">正在生成日历...</p>
            )}
            {generateCalendar.isError && (
              <p className="mt-3 text-xs text-red-600">
                生成失败，请重试。
              </p>
            )}
            {calendarStatus && !generateCalendar.isPending && (
              <p className="mt-3 text-xs text-emerald-600">{calendarStatus}</p>
            )}
            {calendar && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold text-[var(--color-text)]">
                  ✅ {calendar.days} 天日历已生成 · {calendar.items.length} 条内容
                </p>
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {calendar.items.slice(0, 10).map((item) => (
                    <div key={`${item.date}-${item.platform}-${item.title}`} className="rounded-lg border border-[var(--color-border)] bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[var(--color-text)]">{item.date}</p>
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-purple-700">
                          {item.platform}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-[var(--color-text)]">
                        {item.pillarEmoji} {item.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)]">{item.hook}</p>
                    </div>
                  ))}
                </div>
                {calendar.items.length > 10 && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    已显示前 10 条。完整内容保存在内容日历数据中。
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
