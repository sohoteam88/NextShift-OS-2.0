'use client';

import * as React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Sparkles, Loader2, TrendingUp, TrendingDown, CheckCircle2, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PostPerformanceInput } from './PostPerformanceInput';

type Period = '7d' | '30d' | '90d';

type Stats = {
  total: number;
  avgReach: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  engagementRate: number;
  byPillar: Record<string, { count: number; avgReach: number; avgEngagement: number }>;
  byFormat: Record<string, { count: number; avgReach: number }>;
  byPlatform: Record<string, { count: number; avgReach: number }>;
  trend: Array<{ date: string; reach: number; engagement: number }>;
} | null;

type Insights = {
  insufficient_data?: boolean;
  message?: string;
  minimum?: number;
  current?: number;
  summary?: string;
  best_pillar?: { name: string; avg_reach: number; reason: string };
  worst_pillar?: { name: string; avg_reach: number; suggestion: string };
  best_format?: { format: string; reason: string };
  recommendations?: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    reason: string;
    expected_impact: string;
  }>;
  pillar_adjustment?: {
    increase?: { pillar: string; from_pct: number; to_pct: number; reason: string };
    decrease?: { pillar: string; from_pct: number; to_pct: number; reason: string };
  };
  posting_insights?: string;
  next_30_day_focus?: string;
  raw_text?: string;
};

type Props = {
  initialStats: Stats;
  initialPeriod?: Period;
};

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700',
};

const PRIORITY_LABELS = { high: '高优先', medium: '中优先', low: '低优先' };

const PILLAR_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444'];

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--color-text)]">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{sub}</p>}
    </div>
  );
}

export function InsightsPageClient({ initialStats, initialPeriod = '30d' }: Props) {
  const [period, setPeriod] = React.useState<Period>(initialPeriod);
  const [stats, setStats] = React.useState<Stats>(initialStats);
  const [loadingStats, setLoadingStats] = React.useState(false);
  const [insights, setInsights] = React.useState<Insights | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);
  const [showInputForm, setShowInputForm] = React.useState(false);
  const [applyingAdj, setApplyingAdj] = React.useState(false);
  const [adjApplied, setAdjApplied] = React.useState(false);

  async function loadStats(p: Period) {
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/v1/brand-builder/performance/stats?period=${p}`);
      const json = (await res.json()) as { data: Stats };
      setStats(json.data);
    } finally {
      setLoadingStats(false);
    }
  }

  function handlePeriodChange(p: Period) {
    setPeriod(p);
    void loadStats(p);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalysisError(null);
    setInsights(null);
    try {
      const res = await fetch('/api/v1/brand-builder/insights', { method: 'POST' });
      const json = (await res.json()) as { data?: Insights; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Analysis failed');
      setInsights(json.data ?? null);
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleApplyAdjustment() {
    if (!insights?.pillar_adjustment) return;
    setApplyingAdj(true);
    try {
      const res = await fetch('/api/v1/brand-builder/profile');
      const profileJson = (await res.json()) as { data?: Record<string, unknown> };
      const profile = profileJson.data ?? {};
      const pillars = (profile.contentPillars as Array<{ name: string; emoji: string; pct: number }>) ?? [];

      const { increase, decrease } = insights.pillar_adjustment;
      const updated = pillars.map((p) => {
        if (increase && p.name === increase.pillar) return { ...p, pct: increase.to_pct };
        if (decrease && p.name === decrease.pillar) return { ...p, pct: decrease.to_pct };
        return p;
      });

      await fetch('/api/v1/brand-builder/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentPillars: updated }),
      });
      setAdjApplied(true);
    } finally {
      setApplyingAdj(false);
    }
  }

  const pillarChartData = stats
    ? Object.entries(stats.byPillar)
        .map(([name, v]) => ({ name, avgReach: v.avgReach, avgEngagement: v.avgEngagement }))
        .sort((a, b) => b.avgReach - a.avgReach)
    : [];

  return (
    <div className="space-y-6">
      {/* Period selector + add button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5">
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePeriodChange(p)}
              className={cn(
                'rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors',
                period === p
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )}
            >
              {p === '7d' ? '7天' : p === '30d' ? '30天' : '90天'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowInputForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]"
        >
          <Plus className="h-4 w-4" />
          记录数据
        </button>
      </div>

      {/* Post performance input form */}
      {showInputForm && (
        <PostPerformanceInput
          onSaved={() => {
            setShowInputForm(false);
            void loadStats(period);
          }}
          onSkip={() => setShowInputForm(false)}
          onClose={() => setShowInputForm(false)}
        />
      )}

      {loadingStats && (
        <div className="flex items-center gap-2 py-4 text-sm text-[var(--color-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          加载数据中...
        </div>
      )}

      {!stats && !loadingStats && (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] py-12 text-center">
          <p className="font-medium text-[var(--color-text)]">还没有发布数据</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            记录至少 5 条帖子的数据后，AI 即可生成内容分析建议
          </p>
          <button
            type="button"
            onClick={() => setShowInputForm(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
          >
            <Plus className="h-4 w-4" />
            记录第一条数据
          </button>
        </div>
      )}

      {stats && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="发布数" value={String(stats.total)} />
            <KpiCard label="平均触及" value={stats.avgReach.toLocaleString()} />
            <KpiCard label="互动率" value={`${stats.engagementRate}%`} />
            <KpiCard label="平均点赞" value={String(stats.avgLikes)} />
          </div>

          {/* Trend chart */}
          {stats.trend.length > 1 && (
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">触及趋势</h3>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={stats.trend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => v.slice(5)}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reach"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#reachGrad)"
                    name="触及"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Pillar performance bar chart */}
          {pillarChartData.length > 0 && (
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">内容支柱表现</h3>
              <ResponsiveContainer width="100%" height={Math.max(120, pillarChartData.length * 36)}>
                <BarChart
                  layout="vertical"
                  data={pillarChartData}
                  margin={{ top: 0, right: 60, bottom: 0, left: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(v) => [typeof v === 'number' ? v.toLocaleString() : String(v), '平均触及']}
                  />
                  <Bar dataKey="avgReach" name="平均触及" radius={[0, 4, 4, 0]}>
                    {pillarChartData.map((_, idx) => (
                      <Cell key={idx} fill={PILLAR_COLORS[idx % PILLAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Format + Platform summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.keys(stats.byFormat).length > 0 && (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">格式表现</h3>
                <div className="space-y-1">
                  {Object.entries(stats.byFormat)
                    .sort(([, a], [, b]) => b.avgReach - a.avgReach)
                    .map(([fmt, v]) => (
                      <div key={fmt} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--color-text)] capitalize">{fmt}</span>
                        <span className="tabular-nums text-[var(--color-text-muted)]">
                          {v.avgReach.toLocaleString()} 触及 · {v.count} 条
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            {Object.keys(stats.byPlatform).length > 0 && (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">平台表现</h3>
                <div className="space-y-1">
                  {Object.entries(stats.byPlatform)
                    .sort(([, a], [, b]) => b.avgReach - a.avgReach)
                    .map(([plat, v]) => (
                      <div key={plat} className="flex items-center justify-between text-sm">
                        <span className="capitalize text-[var(--color-text)]">{plat}</span>
                        <span className="tabular-nums text-[var(--color-text-muted)]">
                          {v.avgReach.toLocaleString()} 触及 · {v.count} 条
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Analysis section */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <h3 className="font-semibold text-[var(--color-text)]">AI 内容分析建议</h3>
              {!insights && (
                <button
                  type="button"
                  onClick={() => void handleAnalyze()}
                  disabled={analyzing || stats.total < 5}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                >
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {analyzing ? '分析中...' : '生成 AI 分析'}
                </button>
              )}
              {insights && !insights.insufficient_data && (
                <button
                  type="button"
                  onClick={() => void handleAnalyze()}
                  disabled={analyzing}
                  className="text-sm text-[var(--color-primary)] hover:underline"
                >
                  重新分析
                </button>
              )}
            </div>

            <div className="p-5">
              {stats.total < 5 && !insights && (
                <p className="text-sm text-[var(--color-text-muted)]">
                  需要至少 5 条发布数据才能生成分析（当前 {stats.total} 条）。
                </p>
              )}

              {analysisError && (
                <p className="text-sm text-red-600">{analysisError}</p>
              )}

              {insights?.insufficient_data && (
                <p className="text-sm text-[var(--color-text-muted)]">
                  {insights.message} （当前 {insights.current}/{insights.minimum} 条）
                </p>
              )}

              {insights && !insights.insufficient_data && (
                <div className="space-y-5">
                  {insights.summary && (
                    <p className="text-sm text-[var(--color-text)]">{insights.summary}</p>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {insights.best_pillar && (
                      <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-green-50 p-3">
                        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <div>
                          <p className="text-xs font-medium text-green-800">🥇 最佳支柱</p>
                          <p className="mt-0.5 text-sm font-semibold text-green-900">
                            {insights.best_pillar.name}
                          </p>
                          <p className="mt-0.5 text-xs text-green-700">
                            均触及 {insights.best_pillar.avg_reach.toLocaleString()} · {insights.best_pillar.reason}
                          </p>
                        </div>
                      </div>
                    )}
                    {insights.worst_pillar && (
                      <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-amber-50 p-3">
                        <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <div>
                          <p className="text-xs font-medium text-amber-800">需改进支柱</p>
                          <p className="mt-0.5 text-sm font-semibold text-amber-900">
                            {insights.worst_pillar.name}
                          </p>
                          <p className="mt-0.5 text-xs text-amber-700">
                            {insights.worst_pillar.suggestion}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {insights.pillar_adjustment && (
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                      <p className="mb-2 text-xs font-semibold text-[var(--color-text)]">建议调整支柱比例</p>
                      <div className="space-y-1">
                        {insights.pillar_adjustment.increase && (
                          <p className="text-sm text-green-700">
                            ↑ {insights.pillar_adjustment.increase.pillar}:{' '}
                            {insights.pillar_adjustment.increase.from_pct}% →{' '}
                            {insights.pillar_adjustment.increase.to_pct}%
                            <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                              {insights.pillar_adjustment.increase.reason}
                            </span>
                          </p>
                        )}
                        {insights.pillar_adjustment.decrease && (
                          <p className="text-sm text-red-600">
                            ↓ {insights.pillar_adjustment.decrease.pillar}:{' '}
                            {insights.pillar_adjustment.decrease.from_pct}% →{' '}
                            {insights.pillar_adjustment.decrease.to_pct}%
                            <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                              {insights.pillar_adjustment.decrease.reason}
                            </span>
                          </p>
                        )}
                      </div>
                      {!adjApplied ? (
                        <button
                          type="button"
                          onClick={() => void handleApplyAdjustment()}
                          disabled={applyingAdj}
                          className="mt-3 inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                        >
                          {applyingAdj && <Loader2 className="h-3 w-3 animate-spin" />}
                          应用建议到内容策略 →
                        </button>
                      ) : (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          已更新内容策略
                        </div>
                      )}
                    </div>
                  )}

                  {insights.recommendations && insights.recommendations.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-[var(--color-text)]">优先行动</p>
                      <div className="space-y-2">
                        {insights.recommendations.map((rec, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
                          >
                            <span
                              className={cn(
                                'mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                                PRIORITY_COLORS[rec.priority] ?? 'bg-gray-100 text-gray-600',
                              )}
                            >
                              {PRIORITY_LABELS[rec.priority]}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-[var(--color-text)]">{rec.action}</p>
                              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                                {rec.reason} · 预期: {rec.expected_impact}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {insights.next_30_day_focus && (
                    <div className="rounded-[var(--radius-md)] bg-blue-50 px-4 py-3 text-sm text-blue-700">
                      <span className="font-medium">下月重点：</span> {insights.next_30_day_focus}
                    </div>
                  )}

                  {insights.posting_insights && (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      💡 {insights.posting_insights}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
