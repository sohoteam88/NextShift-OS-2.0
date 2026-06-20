'use client';

import * as React from 'react';
import {
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  FileText,
  Fingerprint,
  LayoutTemplate,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type BrandProfile = Record<string, unknown>;

type Props = {
  interviewId?: string;
  initialProfile: BrandProfile;
  onComplete: (profile: BrandProfile) => void;
};

const PERSONALITY_OPTIONS = [
  { value: 'friendly', label: '亲切温暖' },
  { value: 'professional', label: '专业可靠' },
  { value: 'inspirational', label: '励志激励' },
  { value: 'humorous', label: '有趣好玩' },
];

type ReviewField = {
  keyName: string;
  title: string;
  hint: string;
  multiline?: boolean;
  required?: boolean;
};

const CORE_FIELDS: ReviewField[] = [
  { keyName: 'identity', title: '你是谁 / 身份定位', hint: '例如：帮助新手从零开始建立个人品牌的导师', required: true },
  { keyName: 'target_audience', title: '目标受众', hint: '你最想吸引哪一种人？', required: true },
  { keyName: 'value_proposition', title: '价值主张', hint: '你能帮他们得到什么结果？', required: true },
  { keyName: 'story', title: '品牌故事', hint: '你的经历、转折、为什么做这件事', multiline: true, required: true },
  { keyName: 'differentiator', title: '你的差异化', hint: '为什么不是别人，而是你？' },
  { keyName: 'trust_proof', title: '信任证明', hint: '案例、结果、经验、资格、客户反馈', multiline: true, required: true },
  { keyName: 'offer', title: 'Offer / 产品服务', hint: '你现在主推的产品、服务或机会是什么？', required: true },
  { keyName: 'cta', title: '行动入口', hint: '私信、WhatsApp、预约、领取资料、加入社群' },
];

const RETAIL_FIELDS: ReviewField[] = [
  { keyName: 'retail_audience', title: '零售客户是谁？', hint: '会购买产品或服务的人' },
  { keyName: 'retail_promise', title: '零售漏斗承诺', hint: '客户领取后会得到什么具体结果？', multiline: true },
];

const RECRUITMENT_FIELDS: ReviewField[] = [
  { keyName: 'recruitment_audience', title: '招募伙伴是谁？', hint: '适合一起做事业或加入团队的人' },
  { keyName: 'recruitment_promise', title: '招募漏斗承诺', hint: '为什么这个机会值得了解？', multiline: true },
];

const CONTENT_FIELDS: ReviewField[] = [
  { keyName: 'content_voice', title: '内容语气', hint: '专业、温暖、教育、激励、故事型' },
  { keyName: 'content_boundaries', title: '不想讲的内容 / 禁用词', hint: '避免后续 AI 生成错误方向', multiline: true },
];

const DOWNSTREAM_OUTPUTS = [
  { label: 'AI COO', help: '确认后判断第一个任务', icon: Bot },
  { label: '内容引擎', help: '生成零售/招募两种文案', icon: FileText },
  { label: '引流资源', help: '生成可领取资源和 CTA', icon: Target },
  { label: '双漏斗落地页', help: '零售漏斗 + 招募漏斗', icon: LayoutTemplate },
];

function valueOf(profile: BrandProfile, key: string) {
  const value = profile[key];
  if (Array.isArray(value)) return value.filter(Boolean).map(String).join('、');
  if (value === null || value === undefined) return '';
  return String(value);
}

function getReadiness(profile: BrandProfile) {
  const required = CORE_FIELDS.filter((field) => field.required);
  const missing = required.filter((field) => !valueOf(profile, field.keyName).trim());
  if (missing.length >= 3) return { label: 'Missing Critical Info', variant: 'warning' as const, missing };
  if (missing.length > 0) return { label: 'Needs Review', variant: 'info' as const, missing };
  return { label: 'Ready', variant: 'success' as const, missing };
}

function aiSummary(profile: BrandProfile) {
  const identity = valueOf(profile, 'identity') || '你的个人品牌';
  const audience = valueOf(profile, 'target_audience') || '目标受众';
  const offer = valueOf(profile, 'offer') || valueOf(profile, 'value_proposition') || '你的解决方案';
  const proof = valueOf(profile, 'trust_proof') || valueOf(profile, 'differentiator') || '你的经历和方法';
  return `我理解你是 ${identity}。你主要帮助 ${audience}，透过 ${offer} 让他们获得更清晰的下一步。你的可信度来自 ${proof}。如果这段理解准确，后面的内容、引流资源和双漏斗就会沿着这个方向生成。`;
}

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
  placeholder,
  multiline = false,
  onChange,
}: {
  value: string;
  placeholder?: string;
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
            placeholder={placeholder}
            rows={3}
            className={cn(sharedClass, 'resize-none')}
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
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
      <p className="flex-1 text-sm leading-6 text-[var(--color-text)]">
        {value || <span className="text-[var(--color-text-muted)] italic">{placeholder || '（未填写）'}</span>}
      </p>
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

function ReviewFieldCard({
  field,
  profile,
  onChange,
}: {
  field: ReviewField;
  profile: BrandProfile;
  onChange: (key: string, value: string) => void;
}) {
  const value = valueOf(profile, field.keyName);
  const missing = field.required && !value.trim();

  return (
    <div className={cn(FIELD_CLASS, missing && 'border-amber-200 bg-amber-50')}>
      <div className="flex items-center justify-between gap-3">
        <p className={LABEL_CLASS}>{field.title}</p>
        {missing ? (
          <Badge variant="warning">Needs Review</Badge>
        ) : value.trim() ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
        ) : null}
      </div>
      <InlineEditText
        value={value}
        placeholder={field.hint}
        multiline={field.multiline}
        onChange={(next) => onChange(field.keyName, next)}
      />
    </div>
  );
}

function ReviewSection({
  title,
  helper,
  icon,
  fields,
  profile,
  onChange,
}: {
  title: string;
  helper: string;
  icon: React.ReactNode;
  fields: ReviewField[];
  profile: BrandProfile;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-blue-50 text-[var(--color-primary)]">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--color-text)]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{helper}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {fields.map((field) => (
          <ReviewFieldCard key={field.keyName} field={field} profile={profile} onChange={onChange} />
        ))}
      </div>
    </section>
  );
}

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
      if (interviewId) {
        const res = await fetch(`/api/v1/brand-builder/interview/${interviewId}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile }),
        });
        if (!res.ok) throw new Error('保存失败');
      } else {
        const res = await fetch('/api/v1/brand-builder/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        });
        if (!res.ok) throw new Error('保存失败');
      }
      onComplete(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请重试');
    } finally {
      setConfirming(false);
    }
  }

  async function handleReanalyze() {
    if (!interviewId) return;
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
  const readiness = getReadiness(profile);

  return (
    <div className="space-y-5">
      <section className="rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">Brand DNA Review Room</p>
            <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
              确认 AI 对你业务的理解。
            </h1>
            <p className="mt-3 text-sm leading-6 text-blue-900">
              这一步决定后面的 AI COO 任务、内容引擎、引流资源和双漏斗会不会生成对方向。请快速看一遍，必要时直接编辑。
            </p>
          </div>
          <Badge variant={readiness.variant}>{readiness.label}</Badge>
        </div>

        <div className="mt-5 rounded-[var(--radius-lg)] border border-blue-100 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-blue-50 text-[var(--color-primary)]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--color-text)]">AI 总结</p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-text)]">{aiSummary(profile)}</p>
            </div>
          </div>
        </div>
      </section>

      {readiness.missing.length > 0 ? (
        <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">还有几个关键资料需要确认。</p>
            <p className="mt-1 leading-6">
              建议先补齐：{readiness.missing.map((field) => field.title).join('、')}。
            </p>
          </div>
        </div>
      ) : null}

      <ReviewSection
        title="Brand DNA 核心"
        helper="确认身份、受众、故事、Offer 和信任证明。后续系统会以这些字段作为生成基础。"
        icon={<Fingerprint className="h-4 w-4" aria-hidden="true" />}
        fields={CORE_FIELDS}
        profile={profile}
        onChange={setField}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <ReviewSection
          title="零售漏斗方向"
          helper="给想购买产品、服务或方案的潜在客户。"
          icon={<UserRound className="h-4 w-4" aria-hidden="true" />}
          fields={RETAIL_FIELDS}
          profile={profile}
          onChange={setField}
        />
        <ReviewSection
          title="招募漏斗方向"
          helper="给可能成为伙伴、加入团队或了解事业机会的人。"
          icon={<UsersRound className="h-4 w-4" aria-hidden="true" />}
          fields={RECRUITMENT_FIELDS}
          profile={profile}
          onChange={setField}
        />
      </section>

      <ReviewSection
        title="内容引擎输入"
        helper="确认内容语气、内容支柱和边界，减少后续 AI 写错方向。"
        icon={<Megaphone className="h-4 w-4" aria-hidden="true" />}
        fields={CONTENT_FIELDS}
        profile={profile}
        onChange={setField}
      />

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-blue-50 text-[var(--color-primary)]">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--color-text)]">内容支柱与受众困扰</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              这些会直接影响内容引擎每天推荐什么主题。
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>你的专长 / 内容支柱</p>
            <TagsInput tags={expertise} onChange={(v) => setField('expertise', v)} />
          </div>

          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>受众困扰</p>
            <TagsInput tags={audiencePainPoints} onChange={(v) => setField('audience_pain_points', v)} />
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-[var(--color-text)]">品牌语气</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PERSONALITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setField('personality', opt.value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
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
      </section>

      <section className="rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50 p-4 shadow-sm">
        <p className="text-sm font-bold text-blue-950">确认后会发生什么？</p>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {DOWNSTREAM_OUTPUTS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-[var(--radius-md)] bg-white p-3">
                <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
                <p className="mt-2 text-xs font-bold text-[var(--color-text)]">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{item.help}</p>
              </div>
            );
          })}
        </div>
      </section>

      {error && (
        <div className="rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {interviewId && (
          <Button
            variant="secondary"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => void handleReanalyze()}
            loading={reanalyzing}
            disabled={confirming}
          >
            让 AI 重新分析
          </Button>
        )}
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
