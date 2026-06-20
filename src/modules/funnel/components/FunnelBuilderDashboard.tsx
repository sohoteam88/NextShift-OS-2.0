'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink, Loader2, Pencil, Rocket, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { FunnelBuilderType, FunnelPackage, FunnelPortfolio, FunnelTrack } from '../types/funnel-builder';
import { FUNNEL_TYPES } from '../types/funnel-builder';
import { funnelHealthService } from '@/modules/funnel/services/funnel-health-service';

const TRACKS: { id: FunnelTrack; title: string; description: string; defaultType: FunnelBuilderType; action: string }[] = [
  {
    id: 'retail',
    title: '零售客户漏斗',
    description: '给想了解产品、服务或改善方案的潜在客户。',
    defaultType: 'lead_magnet',
    action: '生成零售漏斗',
  },
  {
    id: 'recruitment',
    title: '招募伙伴漏斗',
    description: '给想了解副业、团队机会和收入路径的人。',
    defaultType: 'consultation',
    action: '生成招募漏斗',
  },
];

function useFunnelPortfolio() {
  return useQuery({
    queryKey: ['funnel-builder'],
    queryFn: async () => {
      const r = await fetch('/api/v1/funnel-builder');
      if (!r.ok) throw new Error('Failed');
      return r.json() as Promise<{ data: FunnelPortfolio }>;
    },
    staleTime: 30_000,
  });
}

function useGenerate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { funnelType: FunnelBuilderType; track: FunnelTrack }) => {
      const r = await fetch('/api/v1/funnel-builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!r.ok) throw new Error('Failed');
      return r.json() as Promise<{ data: FunnelPackage }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funnel-builder'] }),
  });
}

function usePublishLandingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (track: FunnelTrack) => {
      const r = await fetch('/api/v1/funnel-builder/publish-landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track }),
      });
      if (!r.ok) throw new Error('Failed');
      return r.json() as Promise<{ data: FunnelPackage }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funnel-builder'] }),
  });
}

function isRenderablePackage(pkg: FunnelPackage | null | undefined): pkg is FunnelPackage {
  return Boolean(
    pkg?.landingPage &&
    pkg.thankYouPage &&
    pkg.whatsappFlow &&
    Array.isArray(pkg.emailSequence) &&
    Array.isArray(pkg.adAngles) &&
    Array.isArray(pkg.launchPlan),
  );
}

function statusLabel(score: number) {
  if (score >= 80) return '可以发布';
  if (score >= 60) return '接近就绪';
  return '需要补齐';
}

function healthState(value: number) {
  if (value >= 70) return { label: '已准备', tone: 'text-emerald-700 bg-emerald-50' };
  if (value >= 40) return { label: '可优化', tone: 'text-amber-700 bg-amber-50' };
  return { label: '需补齐', tone: 'text-red-700 bg-red-50' };
}

export function FunnelBuilderDashboard() {
  const router = useRouter();
  const q = useFunnelPortfolio();
  const gen = useGenerate();
  const publishLandingPage = usePublishLandingPage();
  const [collapsed, setCollapsed] = React.useState<Record<FunnelTrack, boolean>>({ retail: true, recruitment: true });
  const portfolio = q.data?.data ?? { retail: null, recruitment: null, activeTrack: 'retail' as FunnelTrack };

  if (q.isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button>
        <div>
          <h1 className="text-xl font-bold">漏斗页面中心</h1>
          <p className="text-xs text-gray-500">根据 AI 访谈和 Brand DNA 同时生成零售客户漏斗与招募伙伴漏斗。</p>
        </div>
      </div>

      <section className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <h2 className="text-sm font-bold text-blue-900">双漏斗逻辑</h2>
        <p className="mt-1 text-sm text-blue-800">
          零售漏斗负责把陌生人变成客户；招募漏斗负责把有兴趣的人变成团队伙伴。两条漏斗可以同时存在、同时发布、同时接不同内容和流量。
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {TRACKS.map((track) => (
          <FunnelTrackCard
            key={track.id}
            track={track}
            pkg={isRenderablePackage(portfolio[track.id]) ? portfolio[track.id] : null}
            generating={gen.isPending}
            publishing={publishLandingPage.isPending}
            generateError={gen.isError}
            publishError={publishLandingPage.isError}
            collapsed={collapsed[track.id]}
            onToggle={() => setCollapsed((state) => ({ ...state, [track.id]: !state[track.id] }))}
            onGenerate={() => gen.mutate({ funnelType: track.defaultType, track: track.id })}
            onPublish={() => publishLandingPage.mutate(track.id)}
            onEdit={(id) => router.push(`/funnel/${id}/edit`)}
          />
        ))}
      </div>
    </div>
  );
}

function FunnelTrackCard({
  track,
  pkg,
  generating,
  publishing,
  generateError,
  publishError,
  collapsed,
  onToggle,
  onGenerate,
  onPublish,
  onEdit,
}: {
  track: typeof TRACKS[number];
  pkg: FunnelPackage | null;
  generating: boolean;
  publishing: boolean;
  generateError: boolean;
  publishError: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onGenerate: () => void;
  onPublish: () => void;
  onEdit: (id: string) => void;
}) {
  const health = pkg ? funnelHealthService.evaluatePackage(pkg) : null;
  const healthItems = health ? [
    { k: '受众匹配', v: health.audienceFit },
    { k: '服务清晰', v: health.offerClarity },
    { k: '页面清晰', v: health.pageClarity },
    { k: 'CTA', v: health.ctaStrength },
    { k: '信任元素', v: health.trustElements },
    { k: '跟进', v: health.followUpReadiness },
  ] : [];

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-950">{track.title}</h2>
          <p className="mt-1 text-sm text-gray-600">{track.description}</p>
        </div>
        {pkg && <div className="shrink-0 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700"><Trophy className="mr-1 inline h-3 w-3" />{statusLabel(pkg.healthScore)}</div>}
      </div>

      {!pkg ? (
        <div className="mt-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-5 text-center">
          <Rocket className="mx-auto mb-3 h-7 w-7 text-blue-500" />
          <p className="text-sm font-bold text-gray-950">还没有生成</p>
          <p className="mt-1 text-xs text-gray-600">系统会读取 Brand DNA，自动写出对应的落地页、感谢页、WhatsApp 跟进和邮件序列。</p>
          {generateError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">无法生成漏斗，请先完成 AI 访谈和品牌资料。</p>}
          <button onClick={onGenerate} disabled={generating} className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {track.action}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <S title="落地页发布">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-bold text-gray-950">{pkg.landingPage.headline}</p>
                <p className="mt-1 text-xs text-gray-600">{pkg.landingPage.subheadline}</p>
              </div>
              {pkg.landingPage.publicPath ? (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                  <div className="text-xs font-bold text-emerald-700">落地页已生成</div>
                  <div className="mt-1 break-all text-sm font-semibold text-gray-950">{pkg.landingPage.publicPath}</div>
                </div>
              ) : (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-gray-700">生成真正可访问的 landing page，不只是文案报告。</div>
              )}
              {publishError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">无法发布落地页，请稍后重试。</p>}
              <div className="flex flex-wrap gap-2">
                <button onClick={onPublish} disabled={publishing} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                  {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {pkg.landingPage.publicPath ? '重新生成落地页' : '生成落地页'}
                </button>
                {pkg.landingPage.publicPath && (
                  <button onClick={() => window.open(pkg.landingPage.publicPath, '_blank', 'noopener,noreferrer')} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 hover:bg-gray-50">
                    <ExternalLink className="h-4 w-4" /> 查看
                  </button>
                )}
                {pkg.landingPage.funnelId && (
                  <button onClick={() => onEdit(pkg.landingPage.funnelId!)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 hover:bg-gray-50">
                    <Pencil className="h-4 w-4" /> 编辑
                  </button>
                )}
              </div>
            </div>
          </S>

          {health && (
            <S title="启动前检查">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {healthItems.map((item) => {
                  const state = healthState(item.v);
                  return <div key={item.k} className={cn('rounded p-2 text-center', state.tone)}><div className="font-bold">{item.k}</div><div>{state.label}</div></div>;
                })}
              </div>
              <p className="mt-3 text-sm"><strong>下一步行动:</strong> {pkg.nextBestAction}</p>
            </S>
          )}

          <button onClick={onToggle} className="flex w-full items-center justify-between rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-sm font-bold">
            漏斗内容 {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>

          {!collapsed && (
            <div className="space-y-3">
              <S title="领取页"><p className="text-sm font-bold">{pkg.landingPage.headline}</p><p className="text-xs text-blue-600">{pkg.landingPage.subheadline}</p><p className="mt-2 text-xs"><strong>问题:</strong> {pkg.landingPage.problem}</p><p className="text-xs"><strong>方案:</strong> {pkg.landingPage.solution}</p></S>
              <S title="感谢页"><p className="text-sm font-bold">{pkg.thankYouPage.confirmation}</p><p className="text-xs">{pkg.thankYouPage.nextStep}</p></S>
              <S title="WhatsApp 流程">{pkg.whatsappFlow.qualificationQuestions.map((q, i) => <p key={i} className="text-xs text-gray-600">Q{i + 1}: {q}</p>)}</S>
              <S title="邮件序列">{pkg.emailSequence.map((e) => <p key={e.order} className="border-b py-1.5 text-xs last:border-0"><strong>{e.order}. {e.type}:</strong> {e.subject}</p>)}</S>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-[var(--color-border)] bg-white p-4"><h3 className="mb-3 text-sm font-bold">{title}</h3>{children}</section>;
}
