'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Circle,
  FileText,
  Gauge,
  Loader2,
  Megaphone,
  MessageCircle,
  MousePointerClick,
  RadioTower,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  WalletCards,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type {
  BudgetTier,
  TrafficDashboardPayload,
  TrafficGoal,
  TrafficPackage,
  TrafficPlatform,
  TrafficPrerequisites,
} from '../types';
import { TRAFFIC_GOALS } from '../types';
import { getTrafficAdvisorTips } from '../trafficAdvisor';

const PLATFORM_LABELS: Record<TrafficPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  xhs: '小红书',
};

const BUDGET_LABELS: Record<BudgetTier, string> = {
  starter: '测试预算',
  growth: '增长预算',
  scale: '放大预算',
};

function emptyPrerequisites(): TrafficPrerequisites {
  return {
    brandDnaReady: false,
    contentPlanReady: false,
    leadMagnetReady: false,
    retailLandingPageReady: false,
    recruitmentLandingPageReady: false,
    trackingPlanned: false,
  };
}

function useTraffic() {
  return useQuery({
    queryKey: ['traffic-engine'],
    queryFn: async () => {
      const response = await fetch('/api/v1/traffic-engine');
      if (!response.ok) throw new Error('Failed to load traffic engine');
      return response.json() as Promise<TrafficDashboardPayload>;
    },
    staleTime: 30_000,
  });
}

function useGenerate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (opts: { goal: TrafficGoal; platform: TrafficPlatform; budget: BudgetTier }) => {
      const response = await fetch('/api/v1/traffic-engine/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      });
      if (!response.ok) throw new Error('Failed to generate traffic plan');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['traffic-engine'] }),
  });
}

function kpiLabel(kpi: string) {
  return kpi
    .replace('Cost Per Lead (CPL)', '每位潜在客户成本')
    .replace('Cost Per Registration', '每位报名成本')
    .replace('Cost Per Conversation', '每段对话成本')
    .replace('Cost Per Booking', '每次预约成本')
    .replace('Cost Per Follower', '每位关注成本');
}

function budgetRiskLabel(risk: TrafficPackage['budget']['riskLevel']) {
  if (risk === 'high') return '高';
  if (risk === 'medium') return '中';
  return '低';
}

function isSavedTrafficPlan(pkg: TrafficPackage | null) {
  return Boolean(pkg && pkg.campaign.name !== 'Business State Traffic Readiness');
}

function prerequisitesComplete(prerequisites: TrafficPrerequisites) {
  return (
    prerequisites.brandDnaReady &&
    prerequisites.contentPlanReady &&
    prerequisites.leadMagnetReady &&
    prerequisites.retailLandingPageReady &&
    prerequisites.recruitmentLandingPageReady
  );
}

function nextPrerequisiteLink(prerequisites: TrafficPrerequisites) {
  if (!prerequisites.brandDnaReady) return { href: '/brand-builder/step/profile', label: '完成 Brand DNA' };
  if (!prerequisites.contentPlanReady) return { href: '/content-engine', label: '生成内容计划' };
  if (!prerequisites.leadMagnetReady) return { href: '/lead-magnet', label: '生成引流资源' };
  if (!prerequisites.retailLandingPageReady || !prerequisites.recruitmentLandingPageReady) {
    return { href: '/funnel', label: '生成双漏斗落地页' };
  }
  return { href: '/traffic-engine', label: '启动流量测试' };
}

export function TrafficDashboard() {
  const query = useTraffic();
  const generate = useGenerate();
  const [goal, setGoal] = React.useState<TrafficGoal>('lead_generation');
  const [platform, setPlatform] = React.useState<TrafficPlatform>('facebook');
  const [budget, setBudget] = React.useState<BudgetTier>('starter');

  const pkg = query.data?.data ?? null;
  const prerequisites = pkg?.prerequisites ?? query.data?.prerequisites ?? emptyPrerequisites();
  const readyToGenerate = prerequisitesComplete(prerequisites);
  const savedPlan = isSavedTrafficPlan(pkg);
  const nextLink = nextPrerequisiteLink(prerequisites);
  const tips = savedPlan && pkg ? getTrafficAdvisorTips(pkg.readiness) : [];

  if (query.isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-14">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white text-gray-500 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase text-blue-600">AI COO Mission</p>
            <h1 className="mt-1 text-2xl font-bold tracking-normal text-gray-950">启动流量测试</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              当 Brand DNA、内容计划、引流资源和双漏斗落地页都准备好，系统才建议用小预算验证受众、文案、CTA 和跟进路径。
            </p>
          </div>
        </div>
        <div className={cn(
          'inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold',
          readyToGenerate ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700',
        )}>
          <Gauge className="h-3.5 w-3.5" />
          {readyToGenerate ? '可以启动测试' : '先补齐承接'}
        </div>
      </header>

      <section className="rounded-xl border border-blue-100 bg-blue-50 p-5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-blue-700">
              <Rocket className="h-4 w-4" />
              COO 判断
            </div>
            <h2 className="mt-3 text-xl font-bold tracking-normal text-gray-950">
              {savedPlan
                ? '第一轮流量测试计划已经准备好。'
                : readyToGenerate
                  ? '你还没有启动流量测试。'
                  : '流量测试还不能启动。'}
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-gray-700">
              <p>
                为什么是这个？因为漏斗完成后，下一件最高杠杆的事情不是继续加页面，而是让真实流量进入系统，测试是否有人点击、留下资料和开启对话。
              </p>
              <p>
                为什么是现在？因为没有流量测试，AI COO 无法判断你的受众、Offer、CTA 和跟进流程哪一个环节需要优化。
              </p>
              <p>
                为什么不是直接看 Leads？如果还没有启动测试，Leads 为零只说明没有流量进入，不代表漏斗失败。
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-blue-100 bg-white p-4">
            <div className="text-xs font-bold uppercase text-gray-500">Recommended Next Action</div>
            <div className="mt-2 text-lg font-bold text-gray-950">
              {readyToGenerate ? '生成第一轮流量测试计划' : nextLink.label}
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {readyToGenerate
                ? '先用 RM20-50/天的小预算跑 7 天，目标是验证点击、提交和 WhatsApp 对话质量。'
                : '系统会先引导你回到缺失的上一步，避免广告流量进入无法承接的页面。'}
            </p>
            {!readyToGenerate && (
              <Link
                href={nextLink.href}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
              >
                {nextLink.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5 md:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-950">启动条件</h2>
            <p className="mt-1 text-sm text-gray-500">这些条件决定 COO 是否应该推荐“启动流量测试”。</p>
          </div>
          <div className="text-sm font-bold text-gray-700">
            {readinessCount(prerequisites)} / 5 已完成
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <PrerequisiteRow
            icon={ShieldCheck}
            title="Brand DNA 已确认"
            description="系统知道你是谁、卖给谁、用什么承诺进入市场。"
            ready={prerequisites.brandDnaReady}
            href="/brand-builder/step/profile"
          />
          <PrerequisiteRow
            icon={FileText}
            title="内容计划已生成"
            description="零售和招募两种内容方向已经有可发布素材。"
            ready={prerequisites.contentPlanReady}
            href="/content-engine"
          />
          <PrerequisiteRow
            icon={Target}
            title="引流资源已准备"
            description="用户点击广告后，有值得领取的资源或下一步理由。"
            ready={prerequisites.leadMagnetReady}
            href="/lead-magnet"
          />
          <PrerequisiteRow
            icon={MousePointerClick}
            title="零售客户落地页已发布"
            description="承接想买产品、咨询方案或领取零售 Offer 的流量。"
            ready={prerequisites.retailLandingPageReady}
            href="/funnel"
          />
          <PrerequisiteRow
            icon={MessageCircle}
            title="招募伙伴落地页已发布"
            description="承接想了解机会、加入团队或复制系统的流量。"
            ready={prerequisites.recruitmentLandingPageReady}
            href="/funnel"
          />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <h2 className="text-lg font-bold text-gray-950">测试配置</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              选择第一轮测试的目标、平台和预算。COO 会用这些条件生成 7 天测试计划。
            </p>
          </div>
          <div className="space-y-5">
            <ControlGroup label="测试目标">
              {Object.entries(TRAFFIC_GOALS).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setGoal(key as TrafficGoal)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left text-sm transition',
                    goal === key
                      ? 'border-blue-600 bg-blue-50 text-blue-800'
                      : 'border-[var(--color-border)] bg-white text-gray-700 hover:bg-gray-50',
                  )}
                >
                  <span className="block font-bold">{value.objective}</span>
                  <span className="mt-1 block text-xs opacity-75">{kpiLabel(value.expectedKpi)}</span>
                </button>
              ))}
            </ControlGroup>
            <ControlGroup label="优先平台">
              {(['facebook', 'instagram', 'tiktok', 'xhs'] as TrafficPlatform[]).map((item) => (
                <SegmentButton key={item} selected={platform === item} onClick={() => setPlatform(item)}>
                  {PLATFORM_LABELS[item]}
                </SegmentButton>
              ))}
            </ControlGroup>
            <ControlGroup label="预算层级">
              {(['starter', 'growth', 'scale'] as BudgetTier[]).map((item) => (
                <SegmentButton key={item} selected={budget === item} onClick={() => setBudget(item)}>
                  {BUDGET_LABELS[item]}
                </SegmentButton>
              ))}
            </ControlGroup>
            <button
              type="button"
              onClick={() => generate.mutate({ goal, platform, budget })}
              disabled={!readyToGenerate || generate.isPending}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              生成流量测试计划
            </button>
            {!readyToGenerate && (
              <p className="text-xs leading-5 text-amber-700">
                生成按钮会在 Brand DNA、内容计划、引流资源和双漏斗落地页完成后开放。
              </p>
            )}
          </div>
        </div>
      </section>

      {savedPlan && pkg ? (
        <GeneratedPlan pkg={pkg} tips={tips} />
      ) : (
        <ExpectedOutput />
      )}
    </div>
  );
}

function readinessCount(prerequisites: TrafficPrerequisites) {
  return [
    prerequisites.brandDnaReady,
    prerequisites.contentPlanReady,
    prerequisites.leadMagnetReady,
    prerequisites.retailLandingPageReady,
    prerequisites.recruitmentLandingPageReady,
  ].filter(Boolean).length;
}

function PrerequisiteRow({
  icon: Icon,
  title,
  description,
  ready,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  ready: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 transition hover:bg-gray-50',
        ready ? 'border-emerald-100 bg-emerald-50/40' : 'border-[var(--color-border)] bg-white',
      )}
    >
      <div className={cn('mt-0.5 rounded-lg p-2', ready ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-950">{title}</h3>
          {ready ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="h-4 w-4 shrink-0 text-gray-300" />}
        </div>
        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>
    </Link>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-bold uppercase text-gray-500">{label}</div>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function SegmentButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-2 text-sm font-bold transition',
        selected
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-[var(--color-border)] bg-white text-gray-700 hover:bg-gray-50',
      )}
    >
      {children}
    </button>
  );
}

function GeneratedPlan({ pkg, tips }: { pkg: TrafficPackage; tips: string[] }) {
  const platformName = PLATFORM_LABELS[pkg.campaign.platform];
  return (
    <section className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Metric icon={RadioTower} label="测试平台" value={platformName} />
        <Metric icon={WalletCards} label="每日预算" value={pkg.budget.dailyBudget} />
        <Metric icon={BarChart3} label="Readiness" value={`${pkg.readiness.score}%`} />
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-950">{pkg.campaign.name}</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              目标：{TRAFFIC_GOALS[pkg.goal].objective}。预算：{pkg.budget.dailyBudget}，预计 {pkg.budget.expectedLeads.replaceAll('leads', '位潜在客户')}。
            </p>
          </div>
          <Link
            href="/leads"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 hover:bg-blue-100"
          >
            查看 Leads
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <PlanBlock title="广告角度" value={campaignAngle(pkg)} />
          <PlanBlock title="受众" value={pkg.campaign.audience} />
          <PlanBlock title="Offer" value={pkg.campaign.offer} />
          <PlanBlock title="CTA" value={pkg.campaign.cta} />
          <PlanBlock title="落地页" value="同时测试零售客户漏斗和招募伙伴漏斗。" />
          <PlanBlock title="追踪" value={pkg.campaign.trackingNotes || 'UTM、像素和转化事件需要在发布前确认。'} />
        </div>

        {tips.length > 0 && (
          <div className="mt-5 rounded-lg border border-amber-100 bg-amber-50 p-4">
            <div className="text-sm font-bold text-amber-800">COO 提醒</div>
            <div className="mt-2 space-y-1">
              {tips.map((tip) => (
                <p key={tip} className="text-sm leading-6 text-amber-800">{tip}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 md:p-6">
          <h2 className="text-lg font-bold text-gray-950">7 天测试节奏</h2>
          <div className="mt-4 space-y-3">
            {[
              'Day 1：确认像素、UTM、表单和 WhatsApp 链接都能正常记录。',
              'Day 2：发布第一组小预算广告，零售和招募各一条主文案。',
              'Day 3：检查点击率、CPC 和落地页停留，不急着改 Offer。',
              'Day 4：关闭明显低点击素材，复制表现较好的角度。',
              'Day 5：观察提交率和 WhatsApp 对话质量。',
              'Day 6：调整 CTA、标题或首屏承诺。',
              'Day 7：决定继续优化、暂停，或进入 Leads/CRM 跟进。',
            ].map((item) => (
              <div key={item} className="flex gap-3 text-sm leading-6 text-gray-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 md:p-6">
          <h2 className="text-lg font-bold text-gray-950">启动检查清单</h2>
          <div className="mt-4 space-y-3">
            {pkg.checklist.slice(0, 7).map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-sm text-gray-700">
                {item.checked ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-gray-300" />}
                <span>{checklistLabel(item.label)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-600">
            风险等级：{budgetRiskLabel(pkg.budget.riskLevel)}。第一轮目标是学习，不是立刻放大预算。
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-3 text-xl font-bold text-gray-950">{value}</div>
    </div>
  );
}

function PlanBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <div className="text-xs font-bold uppercase text-gray-500">{title}</div>
      <div className="mt-2 text-sm leading-6 text-gray-800">{value}</div>
    </div>
  );
}

function campaignAngle(pkg: TrafficPackage) {
  if (pkg.facebook) return pkg.facebook.adAngles.join(' / ');
  if (pkg.instagram) return pkg.instagram.reelConcept;
  if (pkg.tiktok) return pkg.tiktok.hook;
  if (pkg.xhs) return pkg.xhs.contentAngle;
  return pkg.campaign.creative;
}

function checklistLabel(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes('funnel')) return '双漏斗落地页确认可打开';
  if (lower.includes('landing')) return '首屏标题、CTA 和表单已确认';
  if (lower.includes('thank')) return '感谢页和下一步指令已确认';
  if (lower.includes('whatsapp')) return 'WhatsApp 预填信息和自动回复已确认';
  if (lower.includes('lead')) return '引流资源领取路径已确认';
  if (lower.includes('tracking')) return 'UTM、像素和转化事件已确认';
  if (lower.includes('budget')) return '7 天测试预算已确认';
  if (lower.includes('creative')) return '广告素材已准备';
  if (lower.includes('cta')) return 'CTA 点击路径已测试';
  return label;
}

function ExpectedOutput() {
  return (
    <section className="rounded-xl border border-dashed border-blue-200 bg-blue-50/60 p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-white p-2 text-blue-600">
          <Megaphone className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-950">生成后会得到什么？</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ['测试目标', '第一轮要验证点击、提交、WhatsApp 对话或内容关注。'],
              ['双漏斗投放方向', '零售客户和招募伙伴会有不同广告角度。'],
              ['7 天测试计划', '每天检查什么、何时优化、何时停止。'],
              ['预算和指标', '每日预算、预计 leads、CPC、CPL 和风险等级。'],
              ['追踪设置', 'UTM、像素、转化事件和 CRM 归因提醒。'],
              ['下一步', '测试后进入 Leads 和 CRM，不再停留在猜测。'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg bg-white p-4">
                <div className="text-sm font-bold text-gray-950">{title}</div>
                <p className="mt-1 text-sm leading-6 text-gray-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
