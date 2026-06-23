'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  Check,
  ClipboardCheck,
  FileText,
  Fingerprint,
  Gift,
  HelpCircle,
  Layers3,
  Loader2,
  MessageCircle,
  RefreshCw,
  Route,
  Sparkles,
  Target,
} from 'lucide-react';
import type {
  ContentCalendar,
  ContentTrack,
} from '@/modules/content-engine/types';
import { RevenueDriverIntentResolver } from '@/modules/revenue-drivers/components/RevenueDriverIntentResolver';
import type { LeadMagnetConfig, LeadMagnetTrack } from '../types';

type BrandProfile = Record<string, unknown>;

type LeadMagnetResponse = {
  data: LeadMagnetConfig | null;
  trackLeadMagnets?: Record<LeadMagnetTrack, LeadMagnetConfig | null>;
};

type ContentEngineResponse = {
  data: {
    trackCalendars?: Record<ContentTrack, ContentCalendar | null>;
  };
};

const TRACKS: Array<{
  id: LeadMagnetTrack;
  title: string;
  goal: string;
  examples: string[];
  cta: string;
  recommendedType: 'guide' | 'checklist' | 'template';
}> = [
  {
    id: 'retail',
    title: 'Retail Lead Magnet',
    goal: '吸引客户，帮助他们先看清问题、获得小结果，并愿意留下联系方式。',
    examples: [
      '免费检查表',
      '产品选择指南',
      '诊断问卷',
      '7 天挑战',
      '迷你课程',
    ],
    cta: '领取资源 / 预约咨询 / 加 WhatsApp',
    recommendedType: 'guide',
  },
  {
    id: 'recruitment',
    title: 'Recruitment Lead Magnet',
    goal: '吸引伙伴，帮助他们判断合作机会、理解起步路径，并进入 WhatsApp 对话。',
    examples: [
      '副业起步指南',
      '团队机会说明',
      '新手路线图',
      '事业评估表',
      '30 天启动清单',
    ],
    cta: '了解合作 / 申请加入 / 加 WhatsApp',
    recommendedType: 'checklist',
  },
];

const FORMAT_RULES = [
  { label: 'Checklist', reason: 'Beginner 用户优先，降低行动门槛。' },
  { label: 'Guide', reason: '适合教育市场和建立信任。' },
  { label: 'Quiz', reason: 'Offer 需要诊断时优先使用。' },
  { label: 'Challenge', reason: '目标是行动执行时更适合。' },
  { label: 'Mini Course', reason: '适合需要解释机制或方法。' },
  { label: 'Roadmap', reason: 'Recruitment 路径优先，帮助新人看见下一步。' },
];

const QUALITY_ITEMS = [
  '受众匹配',
  'Offer 清晰',
  'CTA 清晰',
  '信任元素',
  '跟进准备',
  '漏斗承接准备',
];

function valueOf(
  profile: BrandProfile | null | undefined,
  keys: string[],
  fallback = '等待 Brand DNA 确认',
) {
  if (!profile) return fallback;

  for (const key of keys) {
    const value = profile[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value) && value.length > 0) {
      return value
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'name' in item)
            return String((item as { name: unknown }).name);
          return '';
        })
        .filter(Boolean)
        .slice(0, 3)
        .join('、');
    }
  }

  return fallback;
}

function hasBrandDNA(profile: BrandProfile | null | undefined) {
  if (!profile) return false;
  const audience = valueOf(profile, ['target_audience', 'targetAudience'], '');
  const offer = valueOf(
    profile,
    ['offer', 'primaryOffer', 'value_proposition', 'coreMessage'],
    '',
  );
  const positioning = valueOf(
    profile,
    ['identity', 'brandName', 'brandPositioning', 'positioning'],
    '',
  );
  return Boolean(audience && offer && positioning);
}

function qualityStatus(resource?: LeadMagnetConfig | null) {
  if (!resource) return 'Missing Info';
  if (resource.qualityScore >= 70) return 'Ready';
  return 'Needs Review';
}

function qualityClass(status: string) {
  if (status === 'Ready')
    return 'border-emerald-100 bg-emerald-50 text-emerald-700';
  if (status === 'Needs Review')
    return 'border-amber-100 bg-amber-50 text-amber-700';
  return 'border-gray-200 bg-gray-50 text-gray-600';
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <div className="h-[340px] animate-pulse rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
        <div className="h-80 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
      </div>
    </div>
  );
}

function ReadinessGate({
  brandReady,
  contentReady,
}: {
  brandReady: boolean;
  contentReady: boolean;
}) {
  return (
    <div className="mx-auto max-w-5xl pb-12">
      <section className="rounded-[var(--radius-lg)] border border-amber-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle
            className="mt-1 h-5 w-5 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
              Lead Magnet Required Inputs
            </p>
            <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)]">
              引流资源还不能生成。
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)]">
              系统需要先完成 Brand DNA 和内容计划，才能生成对准受众的 Retail 与
              Recruitment 引流资源。
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div
                className={`rounded-[var(--radius-md)] border p-4 ${brandReady ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}
              >
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  Brand DNA
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {brandReady
                    ? '已准备，可以读取受众、Offer 和信任证明。'
                    : '还需要确认定位、受众和 Offer。'}
                </p>
              </div>
              <div
                className={`rounded-[var(--radius-md)] border p-4 ${contentReady ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}
              >
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  内容计划
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {contentReady
                    ? '已准备，可以读取 Retail / Recruitment 内容方向。'
                    : '还需要先生成内容主题和双方向文案。'}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/content-engine"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                回到内容引擎{' '}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/brand-builder/step/profile"
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              >
                确认 Brand DNA
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function LeadMagnetDashboard() {
  const queryClient = useQueryClient();
  const brandProfileQuery = useQuery({
    queryKey: ['brand-builder-profile'],
    queryFn: async () => {
      const response = await fetch('/api/v1/brand-builder/profile');
      if (!response.ok) throw new Error('Failed to load Brand DNA');
      const payload = (await response.json()) as { data: BrandProfile | null };
      return payload.data;
    },
  });

  const contentQuery = useQuery({
    queryKey: ['content-engine'],
    queryFn: async () => {
      const response = await fetch('/api/v1/content-engine');
      if (!response.ok) throw new Error('Failed to load content plan');
      return response.json() as Promise<ContentEngineResponse>;
    },
  });

  const leadMagnetQuery = useQuery({
    queryKey: ['lead-magnet'],
    queryFn: async () => {
      const response = await fetch('/api/v1/lead-magnet');
      if (!response.ok) throw new Error('Failed to load lead magnet');
      return response.json() as Promise<LeadMagnetResponse>;
    },
    staleTime: 30_000,
  });

  const generateResources = useMutation({
    mutationFn: async () => {
      const responses = await Promise.all(
        TRACKS.map(async (track) => {
          const response = await fetch('/api/v1/lead-magnet/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: track.recommendedType,
              track: track.id,
            }),
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as {
              error?: { message?: string };
              message?: string;
            };
            throw new Error(
              payload.error?.message ??
                payload.message ??
                '引流资源暂时无法生成。',
            );
          }

          return response.json() as Promise<{ data: LeadMagnetConfig }>;
        }),
      );

      return responses.map((response) => response.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lead-magnet'] });
      void queryClient.invalidateQueries({
        queryKey: ['dashboard-projection'],
      });
    },
  });

  if (
    brandProfileQuery.isLoading ||
    contentQuery.isLoading ||
    leadMagnetQuery.isLoading
  ) {
    return <LoadingState />;
  }

  const profile = brandProfileQuery.data;
  const brandReady = hasBrandDNA(profile);
  const contentCalendars = contentQuery.data?.data.trackCalendars;
  const contentReady = Boolean(
    contentCalendars?.retail && contentCalendars?.recruitment,
  );

  if (!brandReady || !contentReady) {
    return (
      <ReadinessGate brandReady={brandReady} contentReady={contentReady} />
    );
  }

  const trackLeadMagnets = leadMagnetQuery.data?.trackLeadMagnets ?? {
    retail: null,
    recruitment: null,
  };
  const retailResource =
    trackLeadMagnets.retail ?? leadMagnetQuery.data?.data ?? null;
  const recruitmentResource = trackLeadMagnets.recruitment ?? null;
  const hasGeneratedResources = Boolean(retailResource && recruitmentResource);
  const brandSummary = [
    {
      label: 'Brand DNA',
      value: valueOf(profile, ['identity', 'brandName', 'brandPositioning']),
    },
    {
      label: '目标受众',
      value: valueOf(profile, ['target_audience', 'targetAudience']),
    },
    {
      label: '核心痛点',
      value: valueOf(profile, [
        'audience_pain_points',
        'painPoints',
        'audiencePainPoints',
      ]),
    },
    {
      label: 'Offer / 产品 / 服务',
      value: valueOf(profile, [
        'offer',
        'primaryOffer',
        'value_proposition',
        'coreMessage',
      ]),
    },
    {
      label: '信任证明',
      value: valueOf(profile, [
        'trust_proof',
        'differentiator',
        'uniqueAngle',
        'expertise',
      ]),
    },
    {
      label: '内容计划主题',
      value:
        contentCalendars?.retail?.items[0]?.title ??
        'Retail / Recruitment 内容计划已生成',
    },
    {
      label: 'Retail 内容方向',
      value:
        contentCalendars?.retail?.items[0]?.hook ??
        '客户教育、信任建立、方案领取。',
    },
    {
      label: 'Recruitment 内容方向',
      value:
        contentCalendars?.recruitment?.items[0]?.hook ??
        '伙伴吸引、机会说明、团队路径。',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <RevenueDriverIntentResolver route="/lead-magnet" />

      <section className="rounded-[var(--radius-lg)] border border-blue-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex min-h-[360px] flex-col justify-between p-5 md:p-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <Gift className="h-4 w-4" aria-hidden="true" />
                AI COO 任务
              </div>
              <h1 className="mt-5 max-w-2xl text-3xl font-bold leading-tight text-[var(--color-text)] md:text-4xl">
                生成你的引流资源
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)]">
                AI COO
                判断你目前缺少可以让受众留下联系方式的资源。先生成引流资源，后面才能生成漏斗落地页和流量测试。
              </p>
            </div>

            <div className="mt-8 space-y-4 border-l-2 border-blue-100 pl-4">
              <div>
                <p className="text-xs font-semibold uppercase text-blue-700">
                  根据什么生成
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  根据 Brand DNA + 内容计划自动生成，不重新问基础资料。
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-blue-700">
                  当前目标
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  同时生成 Retail 与 Recruitment
                  两套可领取资源，让内容带来的兴趣可以进入跟进系统。
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-blue-700">
                  生成后下一步
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  确认引流资源后进入漏斗落地页，生成领取页、感谢页和跟进流程。
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              {hasGeneratedResources ? (
                <Link
                  href="/funnel"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  确认并进入漏斗落地页{' '}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => generateResources.mutate()}
                  disabled={generateResources.isPending}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {generateResources.isPending ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      正在生成引流资源
                    </>
                  ) : (
                    <>
                      生成引流资源{' '}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              )}
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              >
                回到 AI COO
              </Link>
            </div>

            {generateResources.isError ? (
              <div className="mt-4 rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  引流资源暂时无法生成。
                </p>
                <p className="mt-1 text-xs leading-5 text-red-700">
                  {(generateResources.error as Error).message}{' '}
                  你可以重试，或回到 AI COO 继续当前任务。
                </p>
                <button
                  type="button"
                  onClick={() => generateResources.mutate()}
                  className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-red-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  重试
                </button>
              </div>
            ) : null}
          </div>

          <aside className="border-t border-blue-100 bg-blue-50/40 p-5 lg:border-l lg:border-t-0 md:p-6">
            <div className="flex items-center gap-2">
              <Fingerprint
                className="h-4 w-4 text-blue-700"
                aria-hidden="true"
              />
              <p className="text-xs font-semibold text-blue-700">输入摘要</p>
            </div>
            <div className="mt-4 space-y-3">
              {brandSummary.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[var(--radius-md)] border border-blue-100 bg-white p-3"
                >
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                    {item.label}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-[var(--color-text)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              双引流资源方向
            </h2>
          </div>
          <div className="grid gap-3">
            {TRACKS.map((track) => {
              const resource =
                track.id === 'retail' ? retailResource : recruitmentResource;
              const status = qualityStatus(resource);
              return (
                <div
                  key={track.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-text)]">
                        {track.title}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                        {track.goal}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${qualityClass(status)}`}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {track.examples.map((example) => (
                      <span
                        key={example}
                        className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-muted)]"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
                    <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                      CTA
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                      {track.cta}
                    </p>
                  </div>
                  {resource ? (
                    <div className="mt-3 rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50 p-3">
                      <p className="text-sm font-semibold text-emerald-950">
                        {resource.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-emerald-800">
                        {resource.promise}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Route className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              推荐资源格式
            </h2>
          </div>
          <div className="grid gap-3">
            {FORMAT_RULES.map((item) => (
              <div
                key={item.label}
                className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3"
              >
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {item.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                  {item.reason}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Layers3 className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            资源内容结构
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            '标题',
            '一句话承诺',
            '适合谁',
            '解决什么问题',
            '资源大纲',
            '领取 CTA',
            'WhatsApp 跟进开场白',
          ].map((item) => (
            <div
              key={item}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>

      {hasGeneratedResources ? (
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              生成结果
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {[retailResource, recruitmentResource]
              .filter(Boolean)
              .map((resource) => (
                <div
                  key={resource!.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
                >
                  <h3 className="text-base font-semibold text-[var(--color-text)]">
                    {resource!.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                    {resource!.promise}
                  </p>
                  <div className="mt-4 space-y-2">
                    {(resource!.sections ?? []).slice(0, 3).map((section) => (
                      <div
                        key={section.id}
                        className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3"
                      >
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                          {section.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                          {section.body}
                        </p>
                      </div>
                    ))}
                    {(resource!.checklistItems ?? [])
                      .slice(0, 5)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"
                        >
                          <ClipboardCheck
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                            aria-hidden="true"
                          />
                          <span>{item.text}</span>
                        </div>
                      ))}
                  </div>
                  <div className="mt-4 rounded-[var(--radius-md)] border border-blue-100 bg-blue-50 p-3">
                    <p className="text-xs font-semibold text-blue-700">
                      WhatsApp 跟进开场白
                    </p>
                    <p className="mt-1 text-sm leading-6 text-blue-950">
                      {resource!.cta.whatsappCta}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            质量检查
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUALITY_ITEMS.map((item) => (
            <div
              key={item}
              className={`rounded-[var(--radius-md)] border p-3 ${hasGeneratedResources ? 'border-emerald-100 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}
            >
              <div className="flex items-center gap-2">
                <Check
                  className={`h-4 w-4 ${hasGeneratedResources ? 'text-emerald-700' : 'text-gray-400'}`}
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {item}
                </p>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {hasGeneratedResources ? 'Ready' : 'Missing Info'}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <MessageCircle
              className="mt-1 h-5 w-5 text-emerald-700"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">
                下一步：漏斗落地页
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                引流资源确认后，系统会生成领取页、感谢页和 WhatsApp 跟进流程。
              </p>
            </div>
          </div>
          <Link
            href={hasGeneratedResources ? '/funnel' : '#'}
            aria-disabled={!hasGeneratedResources}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 text-sm font-semibold ${
              hasGeneratedResources
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'pointer-events-none bg-emerald-100 text-emerald-400'
            }`}
          >
            进入漏斗落地页 <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
