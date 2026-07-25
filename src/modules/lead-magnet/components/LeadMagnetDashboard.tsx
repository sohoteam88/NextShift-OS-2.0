'use client';

import { type ReactNode, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  Check,
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
import { BrandDnaStaleBanner } from '@/components/BrandDnaStaleBanner';
import { isBrandDnaArtifactStale } from '@/lib/brand-dna-versioning';
import { RevenueDriverIntentResolver } from '@/modules/revenue-drivers/components/RevenueDriverIntentResolver';
import { AccessibleDialog } from '@/components/ui/AccessibleDialog';
import type { LeadMagnetConfig, LeadMagnetTrack } from '../types';
import {
  generateLeadMagnetTracks,
  reconcileLeadMagnetTrack,
  type LeadMagnetGenerationOutcome,
} from '../leadMagnetGeneration';
import { LeadMagnetWorkingLoopCard } from './LeadMagnetWorkingLoopCard';
import { JustInTimeFieldPrompt } from '@/modules/brand-builder/components/JustInTimeFieldPrompt';

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

function GenerationQualityNotice({
  children,
  tone = 'amber',
}: {
  children: ReactNode;
  tone?: 'amber' | 'blue';
}) {
  return (
    <section
      className={`rounded-[var(--radius-lg)] border p-4 shadow-sm ${tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className={`mt-0.5 h-5 w-5 shrink-0 ${tone === 'amber' ? 'text-amber-600' : 'text-blue-600'}`}
          aria-hidden="true"
        />
        <div className="flex-1 text-sm leading-6">{children}</div>
      </div>
    </section>
  );
}

export function LeadMagnetDashboard() {
  const queryClient = useQueryClient();
  const [generationIssues, setGenerationIssues] = useState<
    Partial<
      Record<
        LeadMagnetTrack,
        Extract<
          LeadMagnetGenerationOutcome,
          { status: 'definite_failure' | 'ambiguous' }
        >
      >
    >
  >({});
  const [replaceTrack, setReplaceTrack] = useState<LeadMagnetTrack | null>(
    null,
  );
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

  function currentTrackResource(track: LeadMagnetTrack) {
    const current = queryClient.getQueryData<LeadMagnetResponse>([
      'lead-magnet',
    ]);
    return (
      current?.trackLeadMagnets?.[track] ??
      (track === 'retail' ? current?.data : null) ??
      null
    );
  }

  function applyGenerationOutcomes(outcomes: LeadMagnetGenerationOutcome[]) {
    const successes = outcomes.filter(
      (
        outcome,
      ): outcome is Extract<
        LeadMagnetGenerationOutcome,
        { status: 'success' }
      > => outcome.status === 'success',
    );
    setGenerationIssues((current) => {
      const next = { ...current };
      for (const outcome of outcomes) {
        if (outcome.status === 'success') delete next[outcome.track];
        else next[outcome.track] = outcome;
      }
      return next;
    });
    if (successes.length === 0) return;
    queryClient.setQueryData<LeadMagnetResponse>(['lead-magnet'], (current) => {
      const tracks: Record<LeadMagnetTrack, LeadMagnetConfig | null> = {
        retail: current?.trackLeadMagnets?.retail ?? current?.data ?? null,
        recruitment: current?.trackLeadMagnets?.recruitment ?? null,
      };
      for (const outcome of successes) tracks[outcome.track] = outcome.data;
      return { data: tracks.retail, trackLeadMagnets: tracks };
    });
    void queryClient.invalidateQueries({ queryKey: ['lead-magnet'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard-projection'] });
  }

  const generateResources = useMutation({
    mutationFn: async (requestedTracks: LeadMagnetTrack[]) => {
      const outcomes = await generateLeadMagnetTracks(
        requestedTracks.map((trackId) => {
          const track = TRACKS.find((candidate) => candidate.id === trackId);
          if (!track) throw new Error('未知的引流资源方向。');
          return {
            track: track.id,
            type: track.recommendedType,
            previousId: currentTrackResource(track.id)?.id ?? null,
          };
        }),
      );

      return { requestedTracks, outcomes };
    },
    onSuccess: ({ outcomes }) => applyGenerationOutcomes(outcomes),
  });

  const recheckGeneration = useMutation({
    mutationFn: (
      issue: Extract<LeadMagnetGenerationOutcome, { status: 'ambiguous' }>,
    ) => reconcileLeadMagnetTrack(issue.track, issue.previousId),
    onSuccess: (outcome) => applyGenerationOutcomes([outcome]),
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

  const trackLeadMagnets = leadMagnetQuery.data?.trackLeadMagnets ?? {
    retail: null,
    recruitment: null,
  };
  const retailResource =
    trackLeadMagnets.retail ?? leadMagnetQuery.data?.data ?? null;
  const recruitmentResource = trackLeadMagnets.recruitment ?? null;
  const staleLeadMagnetTracks = TRACKS.filter((track) => {
    const resource =
      track.id === 'retail' ? retailResource : recruitmentResource;
    return (
      resource &&
      isBrandDnaArtifactStale(
        resource.brandDnaVersion,
        profile?.brandDnaVersion,
      )
    );
  }).map((track) => track.id);
  const hasStaleLeadMagnets = staleLeadMagnetTracks.length > 0;
  const hasGeneratedResources = Boolean(retailResource && recruitmentResource);
  const hasAnyGeneratedResource = Boolean(
    retailResource || recruitmentResource,
  );
  const missingTracks = TRACKS.filter((track) =>
    track.id === 'retail' ? !retailResource : !recruitmentResource,
  ).map((track) => track.id);
  const hasAmbiguousGeneration = Object.values(generationIssues).some(
    (issue) => issue?.status === 'ambiguous',
  );
  const whatsappPhone = typeof profile?.phone === 'string' ? profile.phone.trim() : '';
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
      {brandProfileQuery.isError ? (
        <GenerationQualityNotice>
          <p className="font-semibold text-amber-950">Brand DNA 暂时无法读取。</p>
          <p className="mt-1 text-amber-900">
            现在仍可生成引流资源；读取成功后，系统会使用最新资料让成品更贴合你。
          </p>
          <button
            type="button"
            onClick={() => {
              void brandProfileQuery.refetch();
            }}
            disabled={brandProfileQuery.isFetching}
            className="mt-3 inline-flex items-center gap-2 font-semibold text-amber-900 underline underline-offset-4 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${brandProfileQuery.isFetching ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            重试读取资料
          </button>
        </GenerationQualityNotice>
      ) : !brandReady ? (
        <GenerationQualityNotice>
          <p className="font-semibold text-amber-950">资料越全，成品越像你。</p>
          <p className="mt-1 text-amber-900">
            现在就能生成引流资源；补充 Brand DNA 后会更贴合你的受众和方向。
          </p>
          <Link
            href="/brand-builder/step/profile"
            className="mt-3 inline-flex items-center gap-2 font-semibold text-amber-900 underline underline-offset-4 hover:text-amber-950"
          >
            补充 Brand DNA <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </GenerationQualityNotice>
      ) : null}
      {!contentReady ? (
        <GenerationQualityNotice tone="blue">
          <p className="font-semibold text-blue-950">内容计划还没有生成。</p>
          <p className="mt-1 text-blue-900">
            现在仍可生成引流资源；先补充内容计划，后续方向会更贴合你。
          </p>
          <Link
            href="/content-engine"
            className="mt-3 inline-flex items-center gap-2 font-semibold text-blue-900 underline underline-offset-4 hover:text-blue-950"
          >
            生成内容计划 <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </GenerationQualityNotice>
      ) : null}
      {!whatsappPhone ? (
        <JustInTimeFieldPrompt
          field="phone"
          label="要让领取资源的人直接联系你，留一个 WhatsApp 号码？"
          whyNow="这个号码会用于你正在配置的引流 CTA；暂时跳过也不会影响当前流程。"
          placeholder="例如：60123456789"
          inputMode="tel"
          onSaved={(phone) => {
            queryClient.setQueryData<BrandProfile>(['brand-builder-profile'], (current) => ({
              ...(current ?? {}),
              phone,
            }));
          }}
        />
      ) : null}
      {hasStaleLeadMagnets ? (
        <BrandDnaStaleBanner
          isPending={generateResources.isPending}
          onRegenerate={() => generateResources.mutate(staleLeadMagnetTracks)}
        />
      ) : null}

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
                  根据现有 Brand DNA 与内容计划生成；缺少的资料会先用默认信息补齐。
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
                  onClick={() => generateResources.mutate(missingTracks)}
                  disabled={
                    generateResources.isPending || hasAmbiguousGeneration
                  }
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
                      {missingTracks.length === 2
                        ? '生成引流资源'
                        : '生成缺少的资源'}{' '}
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

            {Object.keys(generationIssues).length > 0 ? (
              <div className="mt-4 rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  部分引流资源尚未生成。
                </p>
                {TRACKS.filter((track) => generationIssues[track.id]).map(
                  (track) => {
                    const issue = generationIssues[track.id];
                    if (!issue) return null;
                    return (
                      <div key={track.id} className="mt-2 text-xs text-red-700">
                        <p>
                          {track.title}：{issue.error}
                        </p>
                        <button
                          type="button"
                          disabled={
                            generateResources.isPending ||
                            recheckGeneration.isPending
                          }
                          onClick={() => {
                            if (issue.status === 'ambiguous') {
                              recheckGeneration.mutate(issue);
                            } else {
                              generateResources.mutate([track.id]);
                            }
                          }}
                          className="mt-2 inline-flex items-center gap-2 font-semibold underline disabled:opacity-50"
                        >
                          <RefreshCw
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          {issue.status === 'ambiguous'
                            ? `重新检查 ${track.id === 'retail' ? 'Retail' : 'Recruitment'} 状态`
                            : `只重试 ${track.id === 'retail' ? 'Retail' : 'Recruitment'}`}
                        </button>
                      </div>
                    );
                  },
                )}
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
                      {resource.degradedLabel ? (
                        <p role="alert" className="mt-2 text-xs font-semibold text-amber-800">
                          {resource.degradedLabel}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        disabled={
                          generateResources.isPending || hasAmbiguousGeneration
                        }
                        onClick={() => setReplaceTrack(track.id)}
                        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md border border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-800 disabled:opacity-50"
                      >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        重新生成{' '}
                        {track.id === 'retail' ? 'Retail' : 'Recruitment'}
                      </button>
                    </div>
                  ) : generationIssues[track.id] ? (
                    <p
                      role="status"
                      className="mt-3 text-xs font-semibold text-red-700"
                    >
                      {track.id === 'retail' ? 'Retail' : 'Recruitment'}{' '}
                      生成失败，可单独重试。
                    </p>
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

      {hasAnyGeneratedResource ? (
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
                <LeadMagnetWorkingLoopCard
                  key={resource!.id}
                  resource={resource!}
                  track={
                    resource!.track ??
                    (resource === retailResource ? 'retail' : 'recruitment')
                  }
                  onChanged={() =>
                    void queryClient.invalidateQueries({
                      queryKey: ['lead-magnet'],
                    })
                  }
                />
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

      <AccessibleDialog
        open={Boolean(replaceTrack)}
        title="确认替换这条引流资源？"
        description="成功后会产生新的 canonical ID，并替换当前 track。另一条 track 不会改变。"
        onRequestClose={() => {
          if (!generateResources.isPending && !hasAmbiguousGeneration) {
            setReplaceTrack(null);
          }
        }}
        className="max-w-md"
      >
        <div className="space-y-4 p-5">
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            如果当前资源已经编辑，请先确认你确实要放弃现有版本。此操作不会自动覆盖，只有点击确认后才会生成替代版本。
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={generateResources.isPending || hasAmbiguousGeneration}
              onClick={() => setReplaceTrack(null)}
              className="min-h-11 rounded-md border px-4"
            >
              保留现有版本
            </button>
            <button
              type="button"
              disabled={
                generateResources.isPending ||
                hasAmbiguousGeneration ||
                !replaceTrack
              }
              onClick={() => {
                if (!replaceTrack) return;
                const confirmedTrack = replaceTrack;
                setReplaceTrack(null);
                generateResources.mutate([confirmedTrack]);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-blue-600 px-4 text-white disabled:opacity-50"
            >
              确认并生成新版本
            </button>
          </div>
        </div>
      </AccessibleDialog>
    </div>
  );
}
