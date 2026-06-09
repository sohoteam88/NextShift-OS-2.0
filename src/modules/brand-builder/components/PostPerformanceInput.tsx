'use client';

import * as React from 'react';
import { Loader2, X, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = {
  defaultPlatform?: string;
  defaultPillar?: string;
  defaultFormat?: string;
  postTitle?: string;
  calendarId?: string;
  contentId?: string;
  onSaved?: () => void;
  onSkip?: () => void;
  onClose?: () => void;
};

type FormData = {
  platform: string;
  postUrl: string;
  publishedAt: string;
  reach: string;
  impressions: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  clicks: string;
};

const HELP_TEXT: Record<string, string> = {
  facebook: 'FB 主页后台 → 数据分析 → 帖子 → 每条帖子的「查看结果」',
  instagram: 'IG 专业账号 → 帖子下方「查看洞察数据」',
  tiktok: 'TikTok 创作者中心 → 分析 → 内容',
};

function NumberInput({
  label,
  name,
  value,
  onChange,
  required = false,
  note,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  note?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor={name}
        className="w-36 shrink-0 text-sm text-[var(--color-text)]"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
        {note && <span className="ml-1 text-xs text-[var(--color-text-muted)]">({note})</span>}
      </label>
      <input
        id={name}
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="w-28 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1.5 text-sm tabular-nums text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />
    </div>
  );
}

export function PostPerformanceInput({
  defaultPlatform = 'facebook',
  defaultPillar,
  defaultFormat,
  postTitle,
  calendarId,
  contentId,
  onSaved,
  onSkip,
  onClose,
}: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [form, setForm] = React.useState<FormData>({
    platform: defaultPlatform,
    postUrl: '',
    publishedAt: todayStr,
    reach: '',
    impressions: '',
    likes: '',
    comments: '',
    shares: '',
    saves: '',
    clicks: '',
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function set(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.reach || !form.likes || !form.comments || !form.shares) {
      setError('请填写触及人数、点赞、评论和分享');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/brand-builder/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: form.platform,
          postUrl: form.postUrl || undefined,
          pillar: defaultPillar,
          format: defaultFormat,
          publishedAt: new Date(form.publishedAt).toISOString(),
          reach: Number(form.reach),
          impressions: form.impressions ? Number(form.impressions) : 0,
          likes: Number(form.likes),
          comments: Number(form.comments),
          shares: Number(form.shares),
          saves: form.saves ? Number(form.saves) : 0,
          clicks: form.clicks ? Number(form.clicks) : 0,
          calendarId,
          contentId,
        }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? 'Save failed');
      }
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  const helpText = HELP_TEXT[form.platform] ?? '';
  const showSaves = form.platform === 'instagram';

  return (
    <div className="relative space-y-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div>
        <h3 className="text-base font-semibold text-[var(--color-text)]">记录发布数据</h3>
        {postTitle && (
          <p className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-1">
            帖子: &ldquo;{postTitle}&rdquo;
          </p>
        )}
      </div>

      {/* Platform selector */}
      <div className="flex flex-wrap gap-2">
        {['facebook', 'instagram', 'tiktok'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => set('platform', p)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm font-medium transition-colors capitalize',
              form.platform === p
                ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]',
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Published date */}
      <div className="flex items-center gap-3">
        <label className="w-36 shrink-0 text-sm text-[var(--color-text)]">发布日期</label>
        <input
          type="date"
          value={form.publishedAt}
          onChange={(e) => set('publishedAt', e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      {/* Post URL */}
      <div className="flex items-center gap-3">
        <label className="w-36 shrink-0 text-sm text-[var(--color-text)]">
          发布链接 <span className="text-xs text-[var(--color-text-muted)]">(选填)</span>
        </label>
        <input
          type="url"
          value={form.postUrl}
          onChange={(e) => set('postUrl', e.target.value)}
          placeholder="https://..."
          className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[var(--color-text)]">📊 数据（从平台后台获取）</p>
        <NumberInput label="触及人数 Reach" name="reach" value={form.reach} onChange={(v) => set('reach', v)} required />
        <NumberInput label="曝光次数 Impressions" name="impressions" value={form.impressions} onChange={(v) => set('impressions', v)} />
        <NumberInput label="点赞 Likes" name="likes" value={form.likes} onChange={(v) => set('likes', v)} required />
        <NumberInput label="评论 Comments" name="comments" value={form.comments} onChange={(v) => set('comments', v)} required />
        <NumberInput label="分享 Shares" name="shares" value={form.shares} onChange={(v) => set('shares', v)} required />
        {showSaves && (
          <NumberInput label="收藏 Saves" name="saves" value={form.saves} onChange={(v) => set('saves', v)} note="IG only" />
        )}
        <NumberInput label="点击 Clicks" name="clicks" value={form.clicks} onChange={(v) => set('clicks', v)} />
      </div>

      {/* Help text */}
      {helpText && (
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>💡 去哪里看这些数据？{helpText}</span>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          保存
        </button>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            跳过
          </button>
        )}
      </div>
    </div>
  );
}
