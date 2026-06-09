'use client';

import * as React from 'react';
import { Plus, Trash2, RotateCcw, Loader2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

type Pillar = { name: string; emoji: string; pct: number };

type ContentStrategy = {
  tone: string;
  visual: string;
  frequency: string;
  format: string;
};

type BrandProfile = Record<string, unknown>;

type Props = {
  brandProfile: BrandProfile;
  onComplete: (strategy: { contentPillars: Pillar[]; contentStrategy: ContentStrategy }) => void;
};

const DEFAULT_PILLARS: Pillar[] = [
  { name: '产品分享', emoji: '🛍', pct: 30 },
  { name: '客户见证', emoji: '⭐', pct: 25 },
  { name: '知识科普', emoji: '💡', pct: 25 },
  { name: '生活点滴', emoji: '🌸', pct: 20 },
];

const DEFAULT_STRATEGY: ContentStrategy = {
  tone: 'friendly',
  visual: 'lifestyle',
  frequency: 'daily',
  format: 'short_video',
};

const TONE_OPTIONS = [
  { value: 'friendly', label: '亲切友善 😊' },
  { value: 'professional', label: '专业权威 💼' },
  { value: 'inspirational', label: '励志激励 🔥' },
  { value: 'humorous', label: '幽默风趣 😄' },
];

const VISUAL_OPTIONS = [
  { value: 'lifestyle', label: '生活日常 🌿' },
  { value: 'product', label: '产品展示 📦' },
  { value: 'educational', label: '图文教育 📚' },
  { value: 'testimonial', label: '见证分享 🏆' },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: '每日一发' },
  { value: 'twice_daily', label: '每日两发' },
  { value: 'every_other_day', label: '隔日发布' },
  { value: '3_per_week', label: '每周三发' },
];

const FORMAT_OPTIONS = [
  { value: 'short_video', label: '短视频 🎬' },
  { value: 'carousel', label: '多图轮播 🖼' },
  { value: 'photo', label: '单图 📸' },
  { value: 'story', label: 'Stories 📱' },
  { value: 'live', label: '直播 🔴' },
];

const EMOJI_OPTIONS = ['🛍', '⭐', '💡', '🌸', '💪', '❤️', '🎯', '✨', '🙏', '🌟', '🎁', '📣'];

function snapTo5(n: number) {
  return Math.round(n / 5) * 5;
}

function redistribute(pillars: Pillar[], changedIdx: number, newPct: number): Pillar[] {
  const snapped = Math.max(5, Math.min(85, snapTo5(newPct)));
  const others = pillars.filter((_, i) => i !== changedIdx);
  const otherTotal = 100 - snapped;
  const currentOtherTotal = others.reduce((s, p) => s + p.pct, 0);

  const adjusted = others.map((p) => ({
    ...p,
    pct: currentOtherTotal > 0 ? Math.max(5, snapTo5((p.pct / currentOtherTotal) * otherTotal)) : snapTo5(otherTotal / others.length),
  }));

  // Fix rounding drift
  const sum = adjusted.reduce((s, p) => s + p.pct, 0);
  const diff = otherTotal - sum;
  if (diff !== 0 && adjusted.length > 0) {
    adjusted[adjusted.length - 1]!.pct = Math.max(5, adjusted[adjusted.length - 1]!.pct + diff);
  }

  const result = [...pillars];
  result[changedIdx] = { ...result[changedIdx]!, pct: snapped };
  let ai = 0;
  for (let i = 0; i < result.length; i++) {
    if (i !== changedIdx) {
      result[i] = adjusted[ai]!;
      ai++;
    }
  }
  return result;
}

function ChipSelector({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-sm transition-colors',
            value === opt.value
              ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)] font-medium'
              : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ContentStrategyStep({ brandProfile, onComplete }: Props) {
  const existing = brandProfile as {
    contentPillars?: Pillar[];
    contentStrategy?: Partial<ContentStrategy>;
  };

  const [pillars, setPillars] = React.useState<Pillar[]>(
    existing.contentPillars ?? DEFAULT_PILLARS,
  );
  const [strategy, setStrategy] = React.useState<ContentStrategy>({
    ...DEFAULT_STRATEGY,
    ...existing.contentStrategy,
  });
  const [saving, setSaving] = React.useState(false);
  const [editingEmoji, setEditingEmoji] = React.useState<number | null>(null);
  const [newPillarName, setNewPillarName] = React.useState('');

  const totalPct = pillars.reduce((s, p) => s + p.pct, 0);
  const isBalanced = totalPct === 100;

  function handleSliderChange(idx: number, raw: number) {
    setPillars((prev) => redistribute(prev, idx, raw));
  }

  function handleNameChange(idx: number, name: string) {
    setPillars((prev) => prev.map((p, i) => (i === idx ? { ...p, name } : p)));
  }

  function handleEmojiSelect(idx: number, emoji: string) {
    setPillars((prev) => prev.map((p, i) => (i === idx ? { ...p, emoji } : p)));
    setEditingEmoji(null);
  }

  function addPillar() {
    if (pillars.length >= 7 || !newPillarName.trim()) return;
    const newPct = 10;
    const adjustedExisting = pillars.map((p) => ({
      ...p,
      pct: Math.max(5, snapTo5(p.pct * (1 - newPct / 100))),
    }));
    setPillars([...adjustedExisting, { name: newPillarName.trim(), emoji: '✨', pct: newPct }]);
    setNewPillarName('');
  }

  function removePillar(idx: number) {
    if (pillars.length <= 3) return;
    const removed = pillars[idx]!;
    const remaining = pillars.filter((_, i) => i !== idx);
    const share = removed.pct / remaining.length;
    const rebalanced = remaining.map((p) => ({ ...p, pct: snapTo5(p.pct + share) }));
    // Fix rounding
    const sum = rebalanced.reduce((s, p) => s + p.pct, 0);
    if (sum !== 100 && rebalanced.length > 0) {
      rebalanced[0]!.pct = Math.max(5, rebalanced[0]!.pct + (100 - sum));
    }
    setPillars(rebalanced);
  }

  function resetToDefaults() {
    setPillars(DEFAULT_PILLARS);
    setStrategy(DEFAULT_STRATEGY);
  }

  async function handleConfirm() {
    if (!isBalanced) return;
    setSaving(true);
    try {
      await fetch('/api/v1/brand-builder/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentPillars: pillars, contentStrategy: strategy }),
      });
      onComplete({ contentPillars: pillars, contentStrategy: strategy });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Content Pillars */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[var(--color-text)]">内容支柱</h3>
            <p className="text-xs text-[var(--color-text-muted)]">每个主题的发布比例</p>
          </div>
          <button
            type="button"
            onClick={resetToDefaults}
            className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
          >
            <RotateCcw className="h-3 w-3" />
            重置
          </button>
        </div>

        <div className="space-y-3">
          {pillars.map((pillar, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center gap-2">
                {/* Emoji selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setEditingEmoji(editingEmoji === idx ? null : idx)}
                    className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-lg hover:bg-[var(--color-surface)]"
                  >
                    {pillar.emoji}
                  </button>
                  {editingEmoji === idx && (
                    <div className="absolute left-0 top-9 z-10 flex flex-wrap gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-2 shadow-lg w-48">
                      {EMOJI_OPTIONS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => handleEmojiSelect(idx, e)}
                          className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-[var(--color-surface)]"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Name */}
                <input
                  value={pillar.name}
                  onChange={(e) => handleNameChange(idx, e.target.value)}
                  className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent px-2 py-1 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  maxLength={20}
                />

                {/* Percentage display */}
                <span className="w-10 text-right text-sm font-medium tabular-nums text-[var(--color-text)]">
                  {pillar.pct}%
                </span>

                {/* Delete */}
                {pillars.length > 3 && (
                  <button
                    type="button"
                    onClick={() => removePillar(idx)}
                    className="text-[var(--color-text-muted)] hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Slider */}
              <div className="flex items-center gap-2 pl-10">
                <div className="relative flex-1">
                  {/* Bar fill */}
                  <div className="h-2 w-full rounded-full bg-[var(--color-border)]">
                    <div
                      className="h-2 rounded-full bg-[var(--color-primary)] transition-all"
                      style={{ width: `${pillar.pct}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={85}
                    step={5}
                    value={pillar.pct}
                    onChange={(e) => handleSliderChange(idx, Number(e.target.value))}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total indicator */}
        <div
          className={cn(
            'text-right text-xs font-medium',
            isBalanced ? 'text-green-600' : 'text-amber-600',
          )}
        >
          合计: {totalPct}% {isBalanced ? '✓' : `(需要 ${100 - totalPct > 0 ? '+' : ''}${100 - totalPct}%)`}
        </div>

        {/* Add pillar */}
        {pillars.length < 7 && (
          <div className="flex items-center gap-2">
            <input
              value={newPillarName}
              onChange={(e) => setNewPillarName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPillar()}
              placeholder="新增支柱主题..."
              className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              maxLength={20}
            />
            <button
              type="button"
              onClick={addPillar}
              disabled={!newPillarName.trim()}
              className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              添加
            </button>
          </div>
        )}
      </section>

      {/* Tone */}
      <section className="space-y-3">
        <h3 className="font-semibold text-[var(--color-text)]">内容语气</h3>
        <ChipSelector
          options={TONE_OPTIONS}
          value={strategy.tone}
          onChange={(v) => setStrategy((s) => ({ ...s, tone: v }))}
        />
      </section>

      {/* Visual Style */}
      <section className="space-y-3">
        <h3 className="font-semibold text-[var(--color-text)]">视觉风格</h3>
        <ChipSelector
          options={VISUAL_OPTIONS}
          value={strategy.visual}
          onChange={(v) => setStrategy((s) => ({ ...s, visual: v }))}
        />
      </section>

      {/* Frequency */}
      <section className="space-y-3">
        <h3 className="font-semibold text-[var(--color-text)]">发布频率</h3>
        <ChipSelector
          options={FREQUENCY_OPTIONS}
          value={strategy.frequency}
          onChange={(v) => setStrategy((s) => ({ ...s, frequency: v }))}
        />
      </section>

      {/* Format */}
      <section className="space-y-3">
        <h3 className="font-semibold text-[var(--color-text)]">主要形式</h3>
        <ChipSelector
          options={FORMAT_OPTIONS}
          value={strategy.format}
          onChange={(v) => setStrategy((s) => ({ ...s, format: v }))}
        />
      </section>

      <button
        type="button"
        onClick={() => void handleConfirm()}
        disabled={!isBalanced || saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            确认策略，生成日历
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
