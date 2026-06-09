'use client';

import * as React from 'react';
import { Check, Pencil, Plus, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type BrandProfile = Record<string, unknown>;

type Props = {
  interviewId: string;
  initialProfile: BrandProfile;
  onComplete: (profile: BrandProfile) => void;
};

const PERSONALITY_OPTIONS = [
  { value: 'friendly', label: '亲切温暖' },
  { value: 'professional', label: '专业可靠' },
  { value: 'inspirational', label: '励志激励' },
  { value: 'humorous', label: '有趣好玩' },
];

function TagsInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
}) {
  const [newTag, setNewTag] = React.useState('');
  const [adding, setAdding] = React.useState(false);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)]"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="ml-0.5 text-[var(--color-primary)] opacity-70 hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newTag.trim()) {
              onChange([...tags, newTag.trim()]);
              setNewTag('');
              setAdding(false);
            }
            if (e.key === 'Escape') {
              setNewTag('');
              setAdding(false);
            }
          }}
          onBlur={() => {
            if (newTag.trim()) onChange([...tags, newTag.trim()]);
            setNewTag('');
            setAdding(false);
          }}
          placeholder="输入后回车"
          className="h-6 w-28 rounded border border-[var(--color-primary)] px-2 text-xs outline-none focus:ring-1 focus:ring-blue-200"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <Plus className="h-3 w-3" />
          添加
        </button>
      )}
    </div>
  );
}

function InlineEditText({
  value,
  multiline = false,
  onChange,
}: {
  value: string;
  multiline?: boolean;
  onChange: (next: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  if (editing) {
    const sharedClass =
      'w-full rounded-[var(--radius-md)] border border-[var(--color-primary)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-blue-100';
    return (
      <div className="flex items-start gap-2">
        {multiline ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className={cn(sharedClass, 'resize-none')}
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={sharedClass}
          />
        )}
        <button
          type="button"
          onClick={() => {
            onChange(draft);
            setEditing(false);
          }}
          className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] text-white"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(false);
          }}
          className="mt-1 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-2">
      <p className="flex-1 text-sm text-[var(--color-text)]">{value || <span className="text-[var(--color-text-muted)] italic">（未填写）</span>}</p>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-0.5 shrink-0 text-[var(--color-text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

const FIELD_CLASS = 'space-y-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3 shadow-sm';
const LABEL_CLASS = 'text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]';

export function BrandProfileStep({ interviewId, initialProfile, onComplete }: Props) {
  const [profile, setProfile] = React.useState<BrandProfile>(initialProfile);
  const [confirming, setConfirming] = React.useState(false);
  const [reanalyzing, setReanalyzing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function setField(key: string, value: unknown) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function handleConfirm() {
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/brand-builder/interview/${interviewId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      if (!res.ok) throw new Error('保存失败');
      onComplete(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请重试');
    } finally {
      setConfirming(false);
    }
  }

  async function handleReanalyze() {
    setReanalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/brand-builder/interview/${interviewId}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('重新分析失败');
      const json = (await res.json()) as { data: BrandProfile };
      setProfile(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '重新分析失败，请重试');
    } finally {
      setReanalyzing(false);
    }
  }

  const expertise = (profile.expertise as string[] | undefined) ?? [];
  const audiencePainPoints = (profile.audience_pain_points as string[] | undefined) ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text)]">AI 对你的理解</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          请确认以下信息是否准确，你可以编辑任何部分
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={FIELD_CLASS}>
          <p className={LABEL_CLASS}>你的身份</p>
          <InlineEditText
            value={String(profile.identity ?? '')}
            onChange={(v) => setField('identity', v)}
          />
        </div>

        <div className={FIELD_CLASS}>
          <p className={LABEL_CLASS}>你的受众</p>
          <InlineEditText
            value={String(profile.target_audience ?? '')}
            onChange={(v) => setField('target_audience', v)}
          />
        </div>
      </div>

      <div className={FIELD_CLASS}>
        <p className={LABEL_CLASS}>你的故事</p>
        <InlineEditText
          value={String(profile.story ?? '')}
          multiline
          onChange={(v) => setField('story', v)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={FIELD_CLASS}>
          <p className={LABEL_CLASS}>你的专长</p>
          <TagsInput tags={expertise} onChange={(v) => setField('expertise', v)} />
        </div>

        <div className={FIELD_CLASS}>
          <p className={LABEL_CLASS}>受众困扰</p>
          <TagsInput tags={audiencePainPoints} onChange={(v) => setField('audience_pain_points', v)} />
        </div>
      </div>

      <div className={FIELD_CLASS}>
        <p className={LABEL_CLASS}>你的风格</p>
        <div className="flex flex-wrap gap-2">
          {PERSONALITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setField('personality', opt.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                profile.personality === opt.value
                  ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]',
              )}
            >
              {opt.label}
              {profile.personality === opt.value && <Check className="ml-1 inline h-3 w-3" />}
            </button>
          ))}
        </div>
      </div>

      <div className={FIELD_CLASS}>
        <p className={LABEL_CLASS}>价值主张</p>
        <InlineEditText
          value={String(profile.value_proposition ?? '')}
          onChange={(v) => setField('value_proposition', v)}
        />
      </div>

      <div className={FIELD_CLASS}>
        <p className={LABEL_CLASS}>你的差异化</p>
        <InlineEditText
          value={String(profile.differentiator ?? '')}
          onChange={(v) => setField('differentiator', v)}
        />
      </div>

      {error && (
        <div className="rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button
          variant="secondary"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={() => void handleReanalyze()}
          loading={reanalyzing}
          disabled={confirming}
        >
          让 AI 重新分析
        </Button>
        <Button
          onClick={() => void handleConfirm()}
          loading={confirming}
          disabled={reanalyzing}
        >
          确认，继续 →
        </Button>
      </div>
    </div>
  );
}
