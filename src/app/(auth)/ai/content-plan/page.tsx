'use client';

import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Loader2, Copy, CheckCheck, ChevronDown, ChevronRight,
  BookOpen, Users, Star, Megaphone, Heart, Calendar,
  Globe, ImageIcon, Zap, Download, BadgeCheck, ClipboardList, Target,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ContentPlanInput, ContentPlanOutput, ContentType, ContentDay } from '@/modules/ai/services/content-plan-service';

// ─── Types ────────────────────────────────────────────────────────────────────

type GenerateResult = { plan: ContentPlanOutput; tokensUsed: number };

// ─── API ─────────────────────────────────────────────────────────────────────

async function generatePlan(input: ContentPlanInput): Promise<GenerateResult> {
  const res = await fetch('/api/v1/ai/generate/content-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? '生成失败，请重试');
  }
  const json = await res.json() as { data: GenerateResult };
  return json.data;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ContentType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  education: { label: '教育', color: 'text-blue-700', bg: 'bg-blue-100', icon: <BookOpen className="h-3 w-3" /> },
  story:     { label: '故事', color: 'text-purple-700', bg: 'bg-purple-100', icon: <Heart className="h-3 w-3" /> },
  authority: { label: '权威', color: 'text-amber-700', bg: 'bg-amber-100', icon: <Star className="h-3 w-3" /> },
  offer:     { label: '推广', color: 'text-red-700', bg: 'bg-red-100', icon: <Megaphone className="h-3 w-3" /> },
  community: { label: '社群', color: 'text-green-700', bg: 'bg-green-100', icon: <Users className="h-3 w-3" /> },
};

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  facebook:    <Globe className="h-3.5 w-3.5" />,
  instagram:   <ImageIcon className="h-3.5 w-3.5" />,
  tiktok:      <Zap className="h-3.5 w-3.5" />,
  xiaohongshu: <span className="text-xs font-bold">红</span>,
};

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  function handle() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      type="button"
      onClick={handle}
      className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]', className)}
    >
      {copied ? <CheckCheck className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

// ─── Day row ──────────────────────────────────────────────────────────────────

function DayRow({ day, activePlatform }: { day: ContentDay; activePlatform: string }) {
  const [open, setOpen] = React.useState(false);
  const cfg = TYPE_CONFIG[day.type];
  const platformContent = day[activePlatform as keyof ContentDay] as string;

  return (
    <div className="border-b border-[var(--color-border)] last:border-0">
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[var(--color-surface)]"
      >
        <span className="mt-0.5 shrink-0 w-8 text-center text-xs font-bold text-[var(--color-text-muted)]">
          {day.day}
        </span>
        <span className={cn('mt-0.5 shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', cfg.bg, cfg.color)}>
          {cfg.icon}{cfg.label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-text)] truncate">{day.theme}</p>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)] truncate">{day.hook}</p>
        </div>
        <span className="shrink-0 text-xs text-[var(--color-text-muted)] max-w-[120px] truncate hidden sm:block">{day.cta}</span>
        {open ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-muted)]" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />}
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="bg-[var(--color-surface)] px-4 pb-4 pt-2 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">主题</p>
            <div className="flex items-start gap-1">
              <p className="text-sm text-[var(--color-text)]">{day.theme}</p>
              <CopyBtn text={day.theme} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Hook 开头</p>
            <div className="flex items-start gap-1">
              <p className="text-sm text-[var(--color-text)]">{day.hook}</p>
              <CopyBtn text={day.hook} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              {activePlatform === 'xiaohongshu' ? '小红书' : activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)} 版本
            </p>
            <div className="flex items-start gap-1">
              <p className="text-sm text-[var(--color-text)]">{platformContent}</p>
              <CopyBtn text={platformContent} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">CTA</p>
            <div className="flex items-start gap-1">
              <p className="text-sm text-[var(--color-text)]">{day.cta}</p>
              <CopyBtn text={day.cta} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">支柱</p>
            <p className="text-sm text-[var(--color-text)]">{day.pillar}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Result display ───────────────────────────────────────────────────────────

function PlanResult({ plan, platforms }: { plan: ContentPlanOutput; platforms: string[] }) {
  const [activeType, setActiveType] = React.useState<ContentType | 'all'>('all');
  const [activePlatform, setActivePlatform] = React.useState(platforms[0] ?? 'facebook');

  const filteredDays = activeType === 'all' ? plan.days : plan.days.filter(d => d.type === activeType);

  const counts = plan.days.reduce<Record<string, number>>((acc, d) => {
    acc[d.type] = (acc[d.type] ?? 0) + 1;
    return acc;
  }, {});

  function exportCSV() {
    const header = ['Day', 'Type', 'Pillar', 'Theme', 'Hook', 'CTA', 'Facebook', 'Instagram', 'TikTok', '小红书'];
    const rows = plan.days.map(d => [
      d.day, d.type, d.pillar, d.theme, d.hook, d.cta, d.facebook, d.instagram, d.tiktok, d.xiaohongshu,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '30day-content-plan.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Strategy */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
        <h3 className="mb-3 font-medium text-[var(--color-text)]">策略总结</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(plan.strategy).map(([k, v]) => (
            <div key={k}>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{strategyLabels[k] ?? k}</p>
              <p className="mt-0.5 text-sm text-[var(--color-text)]">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pillars */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
        <h3 className="mb-3 font-medium text-[var(--color-text)]">内容支柱</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {plan.pillars.map((pillar, i) => (
            <div key={i} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <p className="mb-1 font-medium text-sm text-[var(--color-text)]">P{i + 1}: {pillar.name}</p>
              <p className="mb-2 text-xs text-[var(--color-text-muted)]">{pillar.description}</p>
              <ul className="space-y-0.5">
                {pillar.topics.map((t, j) => (
                  <li key={j} className="text-xs text-[var(--color-text-muted)]">• {t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white">
        {/* Calendar toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[var(--color-primary)]" />
            <h3 className="font-medium text-[var(--color-text)]">30天内容日历</h3>
            <span className="text-xs text-[var(--color-text-muted)]">({filteredDays.length} 条)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]"
            >
              <Download className="h-3.5 w-3.5" />
              导出 CSV
            </button>
          </div>
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-1.5 border-b border-[var(--color-border)] px-4 py-2.5">
          <button
            type="button"
            onClick={() => setActiveType('all')}
            className={cn('rounded-full px-3 py-1 text-xs font-medium', activeType === 'all' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]')}
          >
            全部 ({plan.days.length})
          </button>
          {(Object.keys(TYPE_CONFIG) as ContentType[]).map(type => {
            const cfg = TYPE_CONFIG[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium', activeType === type ? cn(cfg.bg, cfg.color) : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]')}
              >
                {cfg.icon}{cfg.label} ({counts[type] ?? 0})
              </button>
            );
          })}
        </div>

        {/* Platform filter */}
        <div className="flex gap-1.5 border-b border-[var(--color-border)] px-4 py-2">
          {platforms.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setActivePlatform(p)}
              className={cn('inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1 text-xs font-medium', activePlatform === p ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]')}
            >
              {PLATFORM_ICONS[p]}
              {p === 'xiaohongshu' ? '小红书' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Day list */}
        <div>
          {filteredDays.map(day => (
            <DayRow key={day.day} day={day} activePlatform={activePlatform} />
          ))}
        </div>
      </div>

      {/* Hook Bank */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
        <h3 className="mb-3 font-medium text-[var(--color-text)]">Hook 素材库</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {plan.hookBank.map((bank) => {
            const cfg = TYPE_CONFIG[bank.type];
            return (
              <div key={bank.type}>
                <p className={cn('mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', cfg.bg, cfg.color)}>
                  {cfg.icon}{cfg.label}
                </p>
                <ul className="space-y-2">
                  {bank.hooks.map((hook, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <p className="flex-1 text-xs text-[var(--color-text)]">{hook}</p>
                      <CopyBtn text={hook} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Library */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
        <h3 className="mb-3 font-medium text-[var(--color-text)]">CTA 话术库</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.entries(plan.ctaLibrary) as [string, string[]][]).map(([key, items]) => (
            <div key={key}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{ctaLabels[key] ?? key}</p>
              <ul className="space-y-2">
                {items.map((cta, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <p className="flex-1 text-xs text-[var(--color-text)]">{cta}</p>
                    <CopyBtn text={cta} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Repurposing */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
        <h3 className="mb-2 font-medium text-[var(--color-text)]">一稿多发 攻略</h3>
        <p className="text-sm text-[var(--color-text)]">{plan.repurposingWorkflow}</p>
        <CopyBtn text={plan.repurposingWorkflow} />
      </div>
    </div>
  );
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const strategyLabels: Record<string, string> = {
  niche: '领域定位', positioning: '个人定位', audiencePain: '受众痛点', corePromise: '核心承诺',
};

const ctaLabels: Record<string, string> = {
  engagement: '互动 CTA', dm: '私信 CTA', leadMagnet: '引流 CTA', sales: '成交 CTA',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PLATFORM_OPTIONS = ['facebook', 'instagram', 'tiktok', 'xiaohongshu'];
const TONE_OPTIONS = ['温暖亲切', '专业权威', '轻松随性', '激励人心', '教育分享'];

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
      />
    </div>
  );
}

export default function ContentPlanPage() {
  const [form, setForm] = React.useState<ContentPlanInput>({
    niche: '',
    targetAudience: '',
    offer: '',
    platforms: ['facebook', 'instagram', 'tiktok', 'xiaohongshu'],
    language: 'zh',
    postingFrequency: 1,
    brandTone: '温暖亲切',
    personalStory: '',
  });

  const [result, setResult] = React.useState<ContentPlanOutput | null>(null);

  const mutation = useMutation({
    mutationFn: generatePlan,
    onSuccess: (data) => {
      setResult(data.plan);
      setTimeout(() => document.getElementById('plan-result')?.scrollIntoView({ behavior: 'smooth' }), 100);
    },
  });

  function set<K extends keyof ContentPlanInput>(key: K, value: ContentPlanInput[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function togglePlatform(p: string) {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...prev.platforms, p],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.platforms.length === 0) return;
    mutation.mutate(form);
  }

  const isValid = form.niche && form.targetAudience && form.offer && form.platforms.length > 0;

  const requiredFields = [form.niche, form.targetAudience, form.offer];
  const completedRequired = requiredFields.filter(Boolean).length;
  const completionPct = Math.round((completedRequired / requiredFields.length) * 100);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">AI 工具</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">30天文案规划</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-muted)]">
            生成 30 天内容日历、内容支柱、Hook 素材库和 CTA 话术库，让每天发布内容有清楚节奏。
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 shadow-sm">
          <p className="text-xs text-[var(--color-text-muted)]">输入完成度</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 w-28 rounded-full bg-[var(--color-surface)]">
              <div className="h-2 rounded-full bg-[var(--color-primary)]" style={{ width: `${completionPct}%` }} />
            </div>
            <span className="text-sm font-semibold text-[var(--color-text)]">{completedRequired}/{requiredFields.length}</span>
          </div>
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <form onSubmit={handleSubmit} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">内容策略输入</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">先告诉 AI 你卖什么、卖给谁、用什么语气说。</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">30 days</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="领域 / 行业" value={form.niche} onChange={(value) => set('niche', value)} placeholder="例：副业系统 / 健康产品 / 英语教育 / 美容护肤" required />
            <TextField label="产品 / 服务" value={form.offer} onChange={(value) => set('offer', value)} placeholder="例：AI 副业课程 / 减肥代餐 / 一对一英语辅导" required />
            <TextField className="sm:col-span-2" label="目标受众" value={form.targetAudience} onChange={(value) => set('targetAudience', value)} placeholder="例：马来西亚华人上班族25-38岁，想要多一份收入，不知道从哪里开始" required />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">个人故事 / 信任证明</label>
              <textarea
                value={form.personalStory}
                onChange={(e) => set('personalStory', e.target.value)}
                placeholder="例：你的经历、客户常见问题、为什么你理解这个受众"
                rows={3}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">发布平台 <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-medium transition-colors',
                      form.platforms.includes(p)
                        ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]',
                    )}
                  >
                    {PLATFORM_ICONS[p]}
                    {p === 'xiaohongshu' ? '小红书' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">输出语言</label>
              <select value={form.language} onChange={(e) => set('language', e.target.value as 'zh' | 'en' | 'ms')} className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]">
                <option value="zh">中文</option>
                <option value="en">English</option>
                <option value="ms">Bahasa Malaysia</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">品牌调性</label>
              <select value={form.brandTone} onChange={(e) => set('brandTone', e.target.value)} className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]">
                {TONE_OPTIONS.map((tone) => <option key={tone} value={tone}>{tone}</option>)}
              </select>
            </div>
          </div>

          {mutation.error ? (
            <p className="mt-4 rounded-[var(--radius-md)] bg-red-50 px-3 py-2 text-sm text-red-600">{(mutation.error as Error).message}</p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
            <p className="text-xs text-[var(--color-text-muted)]">生成 30 天 × {form.platforms.length} 平台内容，约需 60-90 秒。</p>
            <button type="submit" disabled={mutation.isPending || !isValid} className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50">
              {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />AI 规划中...</> : <><Calendar className="h-4 w-4" />生成内容日历</>}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
              <h2 className="text-base font-semibold text-[var(--color-text)]">内容比例</h2>
            </div>
            <div className="mt-4 space-y-2">
              {(Object.entries(TYPE_CONFIG) as [ContentType, typeof TYPE_CONFIG[ContentType]][]).map(([type, cfg]) => {
                const countMap: Record<ContentType, number> = { education: 12, story: 6, authority: 6, offer: 3, community: 3 };
                const pctMap: Record<ContentType, string> = { education: '40%', story: '20%', authority: '20%', offer: '10%', community: '10%' };
                return (
                  <div key={type} className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2">
                    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', cfg.color)}>{cfg.icon}{cfg.label}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">{pctMap[type]} / {countMap[type]}天</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              <h2 className="text-base font-semibold text-[var(--color-text)]">输出内容</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm text-[var(--color-text-muted)]">
              {['30 天内容日历', '5 个内容支柱', '各平台文案版本', 'Hook 素材库', 'CTA 话术库', '一稿多发流程'].map((item) => (
                <div key={item} className="flex items-center gap-2"><CheckCheck className="h-4 w-4 text-emerald-600" />{item}</div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {mutation.isPending ? (
        <div className="rounded-[var(--radius-lg)] border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-[var(--color-primary)]" />
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">正在规划 30 天内容</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">AI 正在生成内容支柱、每日主题、平台文案、Hook 和 CTA 库。</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Result */}
      {result && (
        <div id="plan-result">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">文案规划已生成</h2>
            <button
              type="button"
              onClick={() => mutation.mutate(form)}
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-50"
            >
              <Calendar className="h-4 w-4" />
              重新生成
            </button>
          </div>
          <PlanResult plan={result} platforms={form.platforms} />
        </div>
      )}
    </div>
  );
}
