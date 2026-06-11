'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  Loader2, ChevronDown, ChevronRight, Copy, CheckCheck,
  Users, Target, FileText, MessageCircle, Mail, BarChart3, Zap,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { FunnelBuilderInput, FunnelBuilderOutput } from '@/modules/ai/services/funnel-builder-service';

// ─── Types ───────────────────────────────────────────────────────────────────

type GenerateResult = { funnel: FunnelBuilderOutput; tokensUsed: number; provider: string; model: string };

// ─── API call ────────────────────────────────────────────────────────────────

async function generateFunnel(input: FunnelBuilderInput): Promise<GenerateResult> {
  const res = await fetch('/api/v1/ai/generate/world-class-funnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string; error?: { message?: string } };
    throw new Error(err.error?.message ?? err.message ?? '生成失败，请重试');
  }
  const json = await res.json() as { data: GenerateResult };
  return json.data;
}

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
    >
      {copied ? <CheckCheck className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function Section({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-1.5 text-[var(--color-primary)]">
            {icon}
          </div>
          <span className="font-medium text-[var(--color-text)]">{title}</span>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" /> : <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />}
      </button>
      {open && <div className="border-t border-[var(--color-border)] px-5 py-4">{children}</div>}
    </div>
  );
}

// ─── Field display ────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <div className="flex items-start gap-1">
        <p className="text-sm text-[var(--color-text)]">{value || '—'}</p>
        {value && <CopyButton text={value} />}
      </div>
    </div>
  );
}

function BulletList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mb-3">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text)]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Result display ───────────────────────────────────────────────────────────

function FunnelResult({ funnel }: { funnel: FunnelBuilderOutput }) {
  return (
    <div className="space-y-3">
      {/* Funnel Summary */}
      <Section title="漏斗总结" icon={<Target className="h-4 w-4" />} defaultOpen>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="漏斗类型" value={funnel.funnelSummary.funnelType} />
          <Field label="选择原因" value={funnel.funnelSummary.reason} />
          <Field label="主要目标" value={funnel.funnelSummary.primaryGoal} />
          <Field label="成交渠道" value={funnel.funnelSummary.closingChannel} />
        </div>
      </Section>

      {/* Customer Avatar */}
      <Section title="目标客户画像" icon={<Users className="h-4 w-4" />} defaultOpen>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(funnel.customerAvatar).map(([k, v]) => (
            <Field key={k} label={avatarLabels[k] ?? k} value={v} />
          ))}
        </div>
      </Section>

      {/* Pain & Desire Map */}
      <Section title="痛点与渴望地图" icon={<BarChart3 className="h-4 w-4" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(funnel.painDesireMap).map(([k, v]) => (
            <Field key={k} label={painLabels[k] ?? k} value={v} />
          ))}
        </div>
      </Section>

      {/* Offer Positioning */}
      <Section title="产品定位" icon={<Zap className="h-4 w-4" />}>
        <Field label="定位公式" value={funnel.offerPositioning.formula} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="是什么" value={funnel.offerPositioning.whatIsIt} />
          <Field label="适合谁" value={funnel.offerPositioning.whoIsItFor} />
          <Field label="解决什么问题" value={funnel.offerPositioning.problemSolved} />
          <Field label="承诺什么结果" value={funnel.offerPositioning.resultPromised} />
          <Field label="有何不同" value={funnel.offerPositioning.whyDifferent} />
          <Field label="为何现在行动" value={funnel.offerPositioning.whyNow} />
        </div>
      </Section>

      {/* Landing Page */}
      <Section title="落地页文案" icon={<FileText className="h-4 w-4" />}>
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Hero 区块</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="主标题" value={funnel.landingPage.hero.headline} />
              <Field label="副标题" value={funnel.landingPage.hero.subheadline} />
              <Field label="CTA 按钮" value={funnel.landingPage.hero.ctaButton} />
              <Field label="信任句" value={funnel.landingPage.hero.trustLine} />
              <Field label="视觉方向" value={funnel.landingPage.hero.visualDirection} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">痛点区块</p>
            <Field label="核心问题" value={funnel.landingPage.problem.mainProblem} />
            <BulletList label="痛点清单" items={funnel.landingPage.problem.painBullets} />
            <BulletList label="常见错误" items={funnel.landingPage.problem.mistakes} />
            <Field label="情绪挫败感" value={funnel.landingPage.problem.emotionalFrustration} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">渴望区块</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="梦想结果" value={funnel.landingPage.desire.dreamOutcome} />
              <Field label="改变前" value={funnel.landingPage.desire.before} />
              <Field label="改变后" value={funnel.landingPage.desire.after} />
              <Field label="新可能性" value={funnel.landingPage.desire.newPossibility} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">解决方案区块</p>
            <Field label="系统名称" value={funnel.landingPage.solution.systemName} />
            <Field label="独特机制" value={funnel.landingPage.solution.uniqueMechanism} />
            <BulletList label="运作方式" items={funnel.landingPage.solution.howItWorks} />
            <Field label="为何有效" value={funnel.landingPage.solution.whyItWorks} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">引流磁铁</p>
            <Field label="名称" value={funnel.landingPage.leadMagnet.name} />
            <BulletList label="包含内容" items={funnel.landingPage.leadMagnet.whatTheyGet} />
            <Field label="价值说明" value={funnel.landingPage.leadMagnet.whyValuable} />
            <Field label="CTA" value={funnel.landingPage.leadMagnet.cta} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">FAQ</p>
            <div className="space-y-3">
              {funnel.landingPage.faq.map((faq, i) => (
                <div key={i} className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
                  <p className="text-sm font-medium text-[var(--color-text)]">Q: {faq.question}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">A: {faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">最终 CTA</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="标题" value={funnel.landingPage.finalCta.headline} />
              <Field label="紧迫感" value={funnel.landingPage.finalCta.urgencyLine} />
              <Field label="按钮" value={funnel.landingPage.finalCta.ctaButton} />
            </div>
            <div className="mt-2 rounded-[var(--radius-md)] bg-green-50 p-3">
              <p className="mb-1 text-xs font-medium text-green-700">WhatsApp 预填消息</p>
              <p className="text-sm text-green-800">{funnel.landingPage.finalCta.whatsappMessage}</p>
              <CopyButton text={funnel.landingPage.finalCta.whatsappMessage} />
            </div>
          </div>
        </div>
      </Section>

      {/* Lead Magnets */}
      <Section title="引流磁铁方案 (5个)" icon={<Zap className="h-4 w-4" />}>
        <div className="space-y-4">
          {funnel.leadMagnets.map((lm, i) => (
            <div key={i} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <p className="mb-2 text-sm font-medium text-[var(--color-text)]">
                {i + 1}. {lm.title}
                <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{lm.format}</span>
              </p>
              <div className="grid gap-2 sm:grid-cols-2 text-sm text-[var(--color-text-muted)]">
                <span>受众: {lm.targetAudience}</span>
                <span>解决: {lm.problemSolved}</span>
                <span className="sm:col-span-2">CTA: {lm.cta}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* WhatsApp System */}
      <Section title="WhatsApp 成交系统" icon={<MessageCircle className="h-4 w-4" />}>
        <div className="space-y-4">
          <div className="rounded-[var(--radius-md)] bg-green-50 p-3">
            <p className="mb-1 text-xs font-medium text-green-700">欢迎消息</p>
            <p className="text-sm text-green-800">{funnel.whatsappSystem.welcomeMessage}</p>
            <CopyButton text={funnel.whatsappSystem.welcomeMessage} />
          </div>
          <BulletList label="资格问题" items={funnel.whatsappSystem.qualificationQuestions} />
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Lead 分级</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(['a', 'b', 'c', 'd'] as const).map((grade) => (
                <div key={grade} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-2">
                  <span className={cn('mr-2 rounded px-1.5 py-0.5 text-xs font-bold', gradeColors[grade])}>
                    {grade.toUpperCase()}
                  </span>
                  <span className="text-sm text-[var(--color-text)]">{funnel.whatsappSystem.leadScoring[grade]}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">跟进序列</p>
            <div className="space-y-2">
              {funnel.whatsappSystem.followUpSequence.map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                  <span className="shrink-0 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold text-white">
                    Day {item.day}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-[var(--color-text)]">{item.message}</p>
                    <CopyButton text={item.message} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Email Sequence */}
      <Section title="邮件序列 (5封)" icon={<Mail className="h-4 w-4" />}>
        <div className="space-y-4">
          {funnel.emailSequence.map((email) => (
            <div key={email.email} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold text-white">Email {email.email}</span>
                <p className="font-medium text-[var(--color-text)]">{email.subject}</p>
                <CopyButton text={email.subject} />
              </div>
              <p className="mb-1 text-xs text-[var(--color-text-muted)]">预览: {email.preview}</p>
              <p className="mb-2 text-sm text-[var(--color-text)]">{email.body}</p>
              <p className="text-sm font-medium text-[var(--color-primary)]">CTA: {email.cta}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Ad Angles */}
      <Section title="广告角度 (10个)" icon={<BarChart3 className="h-4 w-4" />}>
        <div className="grid gap-3 sm:grid-cols-2">
          {funnel.adAngles.map((ad, i) => (
            <div key={i} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <span className="mb-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">{ad.type}</span>
              <p className="text-sm text-[var(--color-text)]">{ad.angle}</p>
              <CopyButton text={ad.angle} />
            </div>
          ))}
        </div>
      </Section>

      {/* Video Hooks */}
      <Section title="短视频开头 (20个)" icon={<Zap className="h-4 w-4" />}>
        <div className="space-y-2">
          {funnel.videoHooks.map((hook, i) => (
            <div key={i} className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2">
              <span className="shrink-0 text-xs font-bold text-[var(--color-primary)]">{i + 1}.</span>
              <p className="flex-1 text-sm text-[var(--color-text)]">{hook}</p>
              <CopyButton text={hook} />
            </div>
          ))}
        </div>
      </Section>

      {/* Objection Handling */}
      <Section title="异议处理脚本" icon={<MessageCircle className="h-4 w-4" />}>
        <div className="space-y-4">
          {funnel.objectionHandling.map((obj, i) => (
            <div key={i} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
              <p className="mb-2 font-medium text-[var(--color-text)]">
                异议: <span className="text-red-600">{obj.objection}</span>
              </p>
              <Field label="真正意思" value={obj.realMeaning} />
              <Field label="回应话术" value={obj.response} />
              <div className="mt-2 rounded-[var(--radius-md)] bg-green-50 p-2">
                <p className="text-xs font-medium text-green-700">软引导 CTA</p>
                <p className="text-sm text-green-800">{obj.softCta}</p>
                <CopyButton text={obj.softCta} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Analytics */}
      <Section title="数据追踪计划" icon={<BarChart3 className="h-4 w-4" />}>
        <BulletList label="追踪指标" items={funnel.analyticsTrackingPlan.metrics} />
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">参考基准</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {Object.entries(funnel.analyticsTrackingPlan.benchmarks).map(([k, v]) => (
              <div key={k} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-2 text-center">
                <p className="text-xs text-[var(--color-text-muted)]">{benchmarkLabels[k] ?? k}</p>
                <p className="text-sm font-semibold text-[var(--color-primary)]">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Optimization Checklist */}
      <Section title="优化清单" icon={<CheckCheck className="h-4 w-4" />}>
        <div className="space-y-2">
          {funnel.optimizationChecklist.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-[var(--color-text)]">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-[var(--color-border)] bg-white" />
              {item}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const avatarLabels: Record<string, string> = {
  name: '客户名字', ageRange: '年龄层', gender: '性别', location: '地区',
  currentSituation: '当前状况', mainPain: '主要痛点', hiddenFear: '隐藏恐惧',
  desiredOutcome: '期望结果', biggestObjection: '最大异议', buyingTrigger: '购买触发点',
  emotionalHook: '情感钩子', logicalHook: '逻辑钩子', bestPlatform: '最佳平台', bestCta: '最佳CTA',
};

const painLabels: Record<string, string> = {
  surfacePain: '表面痛点', deepPain: '深层痛点', dailyFrustration: '每日挫败感',
  emotionalCost: '情感代价', financialCost: '财务代价', socialCost: '社交代价',
  dreamOutcome: '梦想结果', fastWin: '快速胜利', longTermTransformation: '长期转变',
};

const benchmarkLabels: Record<string, string> = {
  optInRate: '落地页转化率', whatsappClickRate: 'WA点击率',
  replyRate: '回复率', appointmentRate: '预约率', closeRate: '成交率',
};

const gradeColors: Record<string, string> = {
  a: 'bg-green-100 text-green-700',
  b: 'bg-blue-100 text-blue-700',
  c: 'bg-yellow-100 text-yellow-700',
  d: 'bg-red-100 text-red-700',
};

// ─── Form fields config ───────────────────────────────────────────────────────

const CLOSING_OPTIONS = ['WhatsApp', 'Zoom Call', 'Direct Purchase', 'Webinar', 'Telegram'];
const TRAFFIC_OPTIONS = ['Facebook Ads', 'TikTok Ads', 'TikTok Organic', 'Instagram', 'Referral', 'Google Ads', 'WhatsApp Blast'];
const TONE_OPTIONS = ['Warm & Relatable', 'Professional', 'Casual', 'Motivational', 'Educational'];

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

function InputField({ label, value, onChange, placeholder, required, className }: InputFieldProps) {
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
        className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[] | string[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
      >
        {options.map((option) => {
          const opt = typeof option === 'string' ? { label: option, value: option } : option;
          return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        })}
      </select>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FunnelBuilderPage() {
  const [form, setForm] = React.useState<FunnelBuilderInput>({
    businessType: '',
    productOrService: '',
    targetAudience: '',
    marketLocation: 'Malaysia',
    language: 'zh',
    mainCustomerPain: '',
    desiredResult: '',
    offerPrice: '',
    funnelGoal: '',
    trafficSource: 'Facebook Ads',
    closingMethod: 'WhatsApp',
    brandTone: 'Warm & Relatable',
  });

  const [result, setResult] = React.useState<FunnelBuilderOutput | null>(null);

  const mutation = useMutation({
    mutationFn: generateFunnel,
    onSuccess: (data) => {
      setResult(data.funnel);
      setTimeout(() => {
        document.getElementById('funnel-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    },
  });

  function set(key: keyof FunnelBuilderInput, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(form);
  }

  const isValid = form.businessType && form.productOrService && form.targetAudience &&
    form.mainCustomerPain && form.desiredResult && form.funnelGoal && form.closingMethod;
  const requiredFields = [
    form.businessType,
    form.productOrService,
    form.targetAudience,
    form.mainCustomerPain,
    form.desiredResult,
    form.funnelGoal,
    form.closingMethod,
  ];
  const completedRequired = requiredFields.filter(Boolean).length;
  const completionPct = Math.round((completedRequired / requiredFields.length) * 100);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">AI 工具</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">世界级漏斗生成器</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-muted)]">
            输入核心业务信息，一次生成落地页、WhatsApp 成交脚本、广告角度、短视频 hooks、异议处理和优化清单。
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 shadow-sm">
          <p className="text-xs text-[var(--color-text-muted)]">表单完成度</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 w-28 rounded-full bg-[var(--color-surface)]">
              <div className="h-2 rounded-full bg-[var(--color-primary)]" style={{ width: `${completionPct}%` }} />
            </div>
            <span className="text-sm font-semibold text-[var(--color-text)]">{completedRequired}/{requiredFields.length}</span>
          </div>
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_360px]">
        <form onSubmit={handleSubmit} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">业务输入</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">越具体，生成出来的 funnel 越能直接使用。</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">30-60 秒</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="业务类型" value={form.businessType} onChange={(value) => set('businessType', value)} placeholder="例：副业机会 / 健康产品 / 美容护肤 / 教育课程" required />
            <InputField label="产品 / 服务" value={form.productOrService} onChange={(value) => set('productOrService', value)} placeholder="例：AI 副业系统 / 减肥代餐 / 英语口语班" required />
            <InputField className="sm:col-span-2" label="目标受众" value={form.targetAudience} onChange={(value) => set('targetAudience', value)} placeholder="例：马来西亚华人上班族和家庭主妇，25-38岁，对副业感兴趣" required />
            <InputField label="客户最大痛点" value={form.mainCustomerPain} onChange={(value) => set('mainCustomerPain', value)} placeholder="例：死薪水，每月财务压力大，存不到钱" required />
            <InputField label="期望结果" value={form.desiredResult} onChange={(value) => set('desiredResult', value)} placeholder="例：每月额外收入，不影响正职" required />
            <InputField label="漏斗目标" value={form.funnelGoal} onChange={(value) => set('funnelGoal', value)} placeholder="例：收集名单 -> WhatsApp 成交" required />
            <InputField label="价格区间" value={form.offerPrice ?? ''} onChange={(value) => set('offerPrice', value)} placeholder="例：免费引流 -> 付费课程 RM299" />
            <InputField label="市场地区" value={form.marketLocation} onChange={(value) => set('marketLocation', value)} placeholder="Malaysia" />
            <SelectField label="输出语言" value={form.language} onChange={(value) => set('language', value)} options={[{ label: '中文', value: 'zh' }, { label: 'English', value: 'en' }, { label: 'Bahasa Malaysia', value: 'ms' }]} />
            <SelectField label="流量来源" value={form.trafficSource ?? ''} onChange={(value) => set('trafficSource', value)} options={TRAFFIC_OPTIONS} />
            <SelectField label="成交方式" value={form.closingMethod} onChange={(value) => set('closingMethod', value)} options={CLOSING_OPTIONS} required />
            <SelectField label="品牌调性" value={form.brandTone ?? ''} onChange={(value) => set('brandTone', value)} options={TONE_OPTIONS} />
          </div>

          {mutation.error ? (
            <p className="mt-4 rounded-[var(--radius-md)] bg-red-50 px-3 py-2 text-sm text-red-600">
              {(mutation.error as Error).message}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
            <p className="text-xs text-[var(--color-text-muted)]">会消耗 AI 额度。生成后可复制每个模块的文案。</p>
            <button
              type="submit"
              disabled={mutation.isPending || !isValid}
              className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI 生成中...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  生成完整漏斗
                </>
              )}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              <h2 className="text-base font-semibold text-[var(--color-text)]">输出内容</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm text-[var(--color-text-muted)]">
              {['落地页完整文案', 'WhatsApp 欢迎与跟进脚本', '5 个引流磁铁方案', '5 封邮件序列', '10 个广告角度', '20 个短视频开头', '异议处理与数据追踪清单'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
              <h2 className="text-base font-semibold text-[var(--color-text)]">生成策略</h2>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ['1', '先定义客户画像与痛点'],
                ['2', '再定位 offer 与 lead magnet'],
                ['3', '最后生成成交与跟进系统'],
              ].map(([step, label]) => (
                <div key={step} className="flex gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[var(--color-primary)]">{step}</span>
                  <p className="text-sm text-[var(--color-text)]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {mutation.isPending ? (
        <div className="rounded-[var(--radius-lg)] border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-[var(--color-primary)]" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">正在生成漏斗系统</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                AI 正在组合 landing page、WhatsApp 脚本、广告角度和跟进序列。完成后会自动跳到结果区。
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {result ? (
        <div id="funnel-result">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">漏斗系统已生成</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">先检查漏斗总结和目标客户画像，再复制需要的模块。</p>
            </div>
            <button
              type="button"
              onClick={() => mutation.mutate(form)}
              disabled={mutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)] disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              重新生成
            </button>
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            {[
              ['类型', result.funnelSummary.funnelType],
              ['目标', result.funnelSummary.primaryGoal],
              ['成交', result.funnelSummary.closingChannel],
              ['Lead Magnet', result.landingPage.leadMagnet.name],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3 shadow-sm">
                <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
                <p className="mt-1 truncate text-sm font-semibold text-[var(--color-text)]">{value}</p>
              </div>
            ))}
          </div>
          <FunnelResult funnel={result} />
          <div className="mt-4">
            <Link
              href="/funnel"
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)]"
            >
              前往漏斗页面管理
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
