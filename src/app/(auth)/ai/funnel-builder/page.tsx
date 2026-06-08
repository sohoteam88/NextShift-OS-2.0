'use client';

import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import {
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
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? '生成失败，请重试');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">世界级漏斗生成器</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          输入你的业务信息，AI 自动生成完整高转化漏斗系统——包括落地页文案、WhatsApp 成交脚本、广告角度、短视频开头、异议处理等 14 个模块。
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
        <h2 className="mb-4 text-base font-medium text-[var(--color-text)]">业务信息</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Business Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              业务类型 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.businessType}
              onChange={(e) => set('businessType', e.target.value)}
              placeholder="例：副业机会 / 健康产品 / 美容护肤 / 教育课程"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Product / Service */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              产品 / 服务 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.productOrService}
              onChange={(e) => set('productOrService', e.target.value)}
              placeholder="例：AI 副业系统 / 减肥代餐 / 英语口语班"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Target Audience */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              目标受众 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.targetAudience}
              onChange={(e) => set('targetAudience', e.target.value)}
              placeholder="例：马来西亚华人上班族和家庭主妇，25–38岁，对副业感兴趣"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Main Customer Pain */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              客户最大痛点 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.mainCustomerPain}
              onChange={(e) => set('mainCustomerPain', e.target.value)}
              placeholder="例：死薪水，每月财务压力大，存不到钱"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Desired Result */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              期望结果 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.desiredResult}
              onChange={(e) => set('desiredResult', e.target.value)}
              placeholder="例：每月额外赚 RM1,000–3,000，不影响正职"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Funnel Goal */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              漏斗目标 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.funnelGoal}
              onChange={(e) => set('funnelGoal', e.target.value)}
              placeholder="例：收集名单 → WhatsApp 成交"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Offer Price */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">价格区间</label>
            <input
              type="text"
              value={form.offerPrice}
              onChange={(e) => set('offerPrice', e.target.value)}
              placeholder="例：免费引流 → 付费课程 RM299"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Market Location */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">市场地区</label>
            <input
              type="text"
              value={form.marketLocation}
              onChange={(e) => set('marketLocation', e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Language */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">输出语言</label>
            <select
              value={form.language}
              onChange={(e) => set('language', e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
              <option value="ms">Bahasa Malaysia</option>
            </select>
          </div>

          {/* Traffic Source */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">流量来源</label>
            <select
              value={form.trafficSource}
              onChange={(e) => set('trafficSource', e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
            >
              {TRAFFIC_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Closing Method */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              成交方式 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.closingMethod}
              onChange={(e) => set('closingMethod', e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
            >
              {CLOSING_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Brand Tone */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">品牌调性</label>
            <select
              value={form.brandTone}
              onChange={(e) => set('brandTone', e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
            >
              {TONE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        {mutation.error && (
          <p className="mt-4 rounded-[var(--radius-md)] bg-red-50 px-3 py-2 text-sm text-red-600">
            {(mutation.error as Error).message}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-[var(--color-text-muted)]">
            生成时间约 30–60 秒，包含 14 个模块
          </p>
          <button
            type="submit"
            disabled={mutation.isPending || !isValid}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                AI 生成中...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                生成完整漏斗系统
              </>
            )}
          </button>
        </div>
      </form>

      {/* Result */}
      {result && (
        <div id="funnel-result">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">漏斗系统已生成</h2>
            <button
              type="button"
              onClick={() => mutation.mutate(form)}
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              重新生成
            </button>
          </div>
          <FunnelResult funnel={result} />
        </div>
      )}
    </div>
  );
}
