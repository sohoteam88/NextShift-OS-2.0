'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  GitBranch,
  LayoutTemplate,
  Loader2,
  MessageCircle,
  RefreshCw,
  Rocket,
  Sparkles,
  Target,
} from 'lucide-react';
import { RevenueDriverIntentResolver } from '@/modules/revenue-drivers/components/RevenueDriverIntentResolver';
import type {
  FunnelBuilderType,
  FunnelPackage,
  FunnelPortfolio,
  FunnelTrack,
} from '../types/funnel-builder';

const TRACKS: Array<{
  id: FunnelTrack;
  title: string;
  shortTitle: string;
  description: string;
  defaultType: FunnelBuilderType;
  audience: string;
  outcome: string;
}> = [
  {
    id: 'retail',
    title: '零售客户落地页',
    shortTitle: 'Retail',
    description: '给想了解产品、服务或解决方案的潜在客户。',
    defaultType: 'lead_magnet',
    audience: '客户 / 买家 / 咨询者',
    outcome: '领取资源并进入 WhatsApp 跟进',
  },
  {
    id: 'recruitment',
    title: '招募伙伴落地页',
    shortTitle: 'Recruitment',
    description: '给想了解副业、团队机会和复制系统的人。',
    defaultType: 'consultation',
    audience: '伙伴 / 团队候选人',
    outcome: '了解机会并进入合作对话',
  },
];

function useFunnelPortfolio() {
  return useQuery({
    queryKey: ['funnel-builder'],
    queryFn: async () => {
      const r = await fetch('/api/v1/funnel-builder');
      if (!r.ok) throw new Error('Failed to load funnel portfolio');
      return r.json() as Promise<{ data: FunnelPortfolio }>;
    },
    staleTime: 30_000,
  });
}

async function generateTrack(track: FunnelTrack, funnelType: FunnelBuilderType) {
  const r = await fetch('/api/v1/funnel-builder/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ funnelType, track }),
  });
  if (!r.ok) throw new Error('Failed to generate funnel package');
  return r.json() as Promise<{ data: FunnelPackage }>;
}

async function publishTrack(track: FunnelTrack) {
  const r = await fetch('/api/v1/funnel-builder/publish-landing-page', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ track }),
  });
  if (!r.ok) throw new Error('Failed to publish landing page');
  return r.json() as Promise<{ data: FunnelPackage }>;
}

function useGenerateDualLandingPages(portfolio: FunnelPortfolio) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const output: FunnelPackage[] = [];

      for (const track of TRACKS) {
        const current = portfolio[track.id];
        if (!current) {
          await generateTrack(track.id, track.defaultType);
        }
        const published = await publishTrack(track.id);
        output.push(published.data);
      }

      return output;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funnel-builder'] }),
  });
}

function usePublishSingleTrack() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (track: FunnelTrack) => publishTrack(track),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funnel-builder'] }),
  });
}

function readyLabel(ready: boolean) {
  return ready ? '已准备' : '需补齐';
}

function defaultPortfolio(): FunnelPortfolio {
  return {
    retail: null,
    recruitment: null,
    activeTrack: 'retail',
    readiness: {
      brandDnaReady: false,
      contentPlanReady: false,
      leadMagnetReady: false,
      retailLandingPageReady: false,
      recruitmentLandingPageReady: false,
    },
  };
}

function hasRequiredInputs(portfolio: FunnelPortfolio) {
  const readiness = portfolio.readiness;
  return Boolean(
    readiness?.brandDnaReady &&
      readiness.contentPlanReady &&
      readiness.leadMagnetReady,
  );
}

function hasBothLandingPages(portfolio: FunnelPortfolio) {
  return Boolean(
    portfolio.readiness?.retailLandingPageReady &&
      portfolio.readiness.recruitmentLandingPageReady,
  );
}

function funnelMissionCopy(portfolio: FunnelPortfolio) {
  const retailReady = Boolean(portfolio.readiness?.retailLandingPageReady);
  const recruitmentReady = Boolean(
    portfolio.readiness?.recruitmentLandingPageReady,
  );

  if (retailReady && recruitmentReady) {
    return {
      badge: 'Funnel Ready',
      title: '双漏斗落地页已经完成。',
      whyThis:
        '零售客户页和招募伙伴页都已经可以承接访问、收集资料，并把线索带到 WhatsApp 跟进。',
      whyNow:
        '现在最重要的不是继续生成页面，而是进入流量测试，用真实访问验证标题、CTA 和跟进路径。',
      whyNot:
        '现在先不做更多页面版本，因为没有流量数据之前，优化会变成猜测。',
      actionLabel: '进入流量测试',
    };
  }

  if (retailReady && !recruitmentReady) {
    return {
      badge: 'Funnel Incomplete',
      title: '你的招募伙伴落地页还没完成。',
      whyThis:
        '零售客户页已经发布，但系统还缺少招募伙伴页。少了这条路径，想了解副业、团队和合作机会的人没有专属入口。',
      whyNow:
        '在启动流量测试之前，先补齐招募伙伴页，内容引擎里的招募文案才有正确承接点。',
      whyNot:
        '现在不应该只用零售页承接所有流量，因为客户购买动机和伙伴加入动机不同，混在一起会降低转化清晰度。',
      actionLabel: '生成招募伙伴落地页',
    };
  }

  if (!retailReady && recruitmentReady) {
    return {
      badge: 'Funnel Incomplete',
      title: '你的零售客户落地页还没完成。',
      whyThis:
        '招募伙伴页已经发布，但系统还缺少零售客户页。少了这条路径，想了解产品或服务的人没有清楚的领取入口。',
      whyNow:
        '在启动流量测试之前，先补齐零售客户页，零售内容和引流资源才有地方收集潜在客户资料。',
      whyNot:
        '现在不应该让客户流量进入招募页，因为购买需求和合作需求不同，页面承诺、CTA 和跟进问题都应该分开。',
      actionLabel: '生成零售客户落地页',
    };
  }

  return {
    badge: 'Funnel Required',
    title: '你还没有可以承接流量的落地页。',
    whyThis:
      '内容和引流资源已经负责吸引注意力，落地页负责把注意力变成资料提交、WhatsApp 对话和后续跟进。',
    whyNow:
      '在启动流量测试之前，系统必须先有两个明确入口：一个卖给客户，一个招募伙伴。',
    whyNot:
      '现在先不做流量或 CRM，因为没有落地页时，访问者没有清楚的领取路径，后续数据也无法判断。',
    actionLabel: '生成双漏斗落地页',
  };
}

function ReadinessItem({
  label,
  detail,
  ready,
}: {
  label: string;
  detail: string;
  ready: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-[var(--radius-md)] border p-4 ${
        ready
          ? 'border-emerald-100 bg-emerald-50'
          : 'border-amber-100 bg-amber-50'
      }`}
    >
      {ready ? (
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
          aria-hidden="true"
        />
      ) : (
        <Circle
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
          aria-hidden="true"
        />
      )}
      <div>
        <p
          className={`text-sm font-bold ${
            ready ? 'text-emerald-950' : 'text-amber-950'
          }`}
        >
          {label}
        </p>
        <p
          className={`mt-1 text-xs font-semibold ${
            ready ? 'text-emerald-700' : 'text-amber-700'
          }`}
        >
          {readyLabel(ready)}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {detail}
        </p>
      </div>
    </div>
  );
}

function TrackSummary({
  track,
  pkg,
  publishing,
  onPublish,
}: {
  track: (typeof TRACKS)[number];
  pkg: FunnelPackage | null;
  publishing: boolean;
  onPublish: (track: FunnelTrack) => void;
}) {
  const publicPath = pkg?.landingPage.publicPath;

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
            {track.shortTitle}
          </div>
          <h2 className="mt-3 text-lg font-bold text-[var(--color-text)]">
            {track.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {track.description}
          </p>
        </div>
        <div
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
            publicPath
              ? 'bg-emerald-100 text-emerald-700'
              : pkg
                ? 'bg-blue-100 text-blue-700'
                : 'bg-amber-100 text-amber-700'
          }`}
        >
          {publicPath ? '已发布' : pkg ? '待发布' : '未生成'}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
            <Target className="h-4 w-4" aria-hidden="true" />
            目标受众
          </div>
          <p className="mt-2 text-sm font-semibold text-blue-950">
            {track.audience}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            转化动作
          </div>
          <p className="mt-2 text-sm font-semibold text-emerald-950">
            {track.outcome}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex items-start gap-3">
          <LayoutTemplate
            className="mt-0.5 h-5 w-5 shrink-0 text-blue-700"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--color-text)]">
              {pkg?.landingPage.headline ?? '等待 AI 生成落地页标题'}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {pkg?.landingPage.subheadline ??
                '系统会根据 Brand DNA、内容方向和引流资源生成 Hero、痛点、机制、表单、感谢页和 WhatsApp 跟进。'}
            </p>
            {publicPath && (
              <p className="mt-3 break-all text-xs font-semibold text-emerald-700">
                {publicPath}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        {pkg && !publicPath && (
          <button
            type="button"
            onClick={() => onPublish(track.id)}
            disabled={publishing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            发布这条落地页
          </button>
        )}
        {publicPath && (
          <button
            type="button"
            onClick={() => window.open(publicPath, '_blank', 'noopener,noreferrer')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-5 text-sm font-bold text-[var(--color-text)] hover:bg-[var(--color-surface)]"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            查看落地页
          </button>
        )}
        {pkg?.landingPage.funnelId && (
          <Link
            href={`/funnel/${pkg.landingPage.funnelId}/edit`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-5 text-sm font-bold text-[var(--color-text)] hover:bg-[var(--color-surface)]"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            编辑页面
          </Link>
        )}
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto flex min-h-[380px] max-w-5xl items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden="true" />
    </div>
  );
}

export function FunnelBuilderDashboard() {
  const router = useRouter();
  const q = useFunnelPortfolio();
  const portfolio = q.data?.data ?? defaultPortfolio();
  const generateDual = useGenerateDualLandingPages(portfolio);
  const publishSingle = usePublishSingleTrack();
  const requiredInputsReady = hasRequiredInputs(portfolio);
  const bothPagesReady = hasBothLandingPages(portfolio);
  const readiness = portfolio.readiness ?? defaultPortfolio().readiness!;
  const missionCopy = funnelMissionCopy(portfolio);

  if (q.isLoading) {
    return <LoadingState />;
  }

  if (q.isError) {
    return (
      <div className="mx-auto max-w-5xl pb-12">
        <section className="rounded-[var(--radius-lg)] border border-red-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold text-red-700">Funnel Engine Failure</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)]">
            漏斗落地页暂时无法载入。
          </h1>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            系统无法读取当前漏斗状态。请稍后重试，或回到 AI COO 首页继续。
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void q.refetch()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              重试
            </button>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-5 text-sm font-bold text-[var(--color-text)] hover:bg-[var(--color-surface)]"
            >
              回到 AI COO
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <RevenueDriverIntentResolver route="/funnel" />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div>
          <p className="text-xs font-bold uppercase text-blue-700">
            AI COO Mission
          </p>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            生成双漏斗落地页
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            把 Brand DNA、内容计划和引流资源，转换成零售客户页与招募伙伴页。
          </p>
        </div>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-blue-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="p-5 md:p-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              <Rocket className="h-4 w-4" aria-hidden="true" />
              {missionCopy.badge}
            </div>
            <h2 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-[var(--color-text)]">
              {missionCopy.title}
            </h2>
            <div className="mt-5 space-y-4 border-l-2 border-blue-100 pl-4">
              <div>
                <p className="text-xs font-bold uppercase text-blue-700">
                  为什么是这个
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {missionCopy.whyThis}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-blue-700">
                  为什么现在
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {missionCopy.whyNow}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-blue-700">
                  为什么不是其他任务
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {missionCopy.whyNot}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              {!bothPagesReady ? (
                <button
                  type="button"
                  onClick={() => generateDual.mutate()}
                  disabled={!requiredInputsReady || generateDual.isPending}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generateDual.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  )}
                  {missionCopy.actionLabel}
                </button>
              ) : (
                <Link
                  href="/traffic-engine"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  进入流量测试
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
              {generateDual.isError && (
                <p className="text-sm font-semibold text-red-700">
                  无法生成双漏斗，请先确认前置资料是否完成。
                </p>
              )}
              {!requiredInputsReady && (
                <p className="text-sm font-semibold text-amber-700">
                  先补齐 Brand DNA、内容计划和引流资源。
                </p>
              )}
            </div>
          </div>

          <aside className="border-t border-blue-100 bg-blue-50/40 p-5 lg:border-l lg:border-t-0 md:p-6">
            <p className="text-xs font-bold text-blue-700">生成内容</p>
            <div className="mt-4 space-y-3">
              {[
                '零售客户落地页',
                '招募伙伴落地页',
                '感谢页与确认文案',
                'WhatsApp 预设开场',
                '7 封邮件跟进',
                '流量测试角度',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm font-semibold text-blue-950"
                >
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-blue-700"
                    aria-hidden="true"
                  />
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <ReadinessItem
          label="Brand DNA"
          detail="确认受众、痛点、Offer、故事和信任元素。"
          ready={readiness.brandDnaReady}
        />
        <ReadinessItem
          label="内容计划"
          detail="确认零售与招募两种内容方向。"
          ready={readiness.contentPlanReady}
        />
        <ReadinessItem
          label="引流资源"
          detail="确认受众愿意领取的免费资源。"
          ready={readiness.leadMagnetReady}
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {TRACKS.map((track) => (
          <TrackSummary
            key={track.id}
            track={track}
            pkg={portfolio[track.id]}
            publishing={publishSingle.isPending}
            onPublish={(item) => publishSingle.mutate(item)}
          />
        ))}
      </div>
    </div>
  );
}
