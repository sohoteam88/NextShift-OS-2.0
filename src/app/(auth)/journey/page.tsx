'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Award, CheckCircle2, Circle, Compass, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { ModeToggle } from '@/modules/mission/components/ModeToggle';
import { useAchievements, useMissionState } from '@/modules/mission/hooks/use-mission';
import { cn } from '@/lib/cn';
import type { BusinessFunnelType } from '@/modules/funnel/types/funnel-context';
import { FunnelSelector, getFunnelLabel } from '@/components/funnel-operating-system/FunnelSelector';
import { FunnelHealthCard } from '@/components/funnel-operating-system/FunnelHealthCard';
import { FunnelMilestoneCard } from '@/components/funnel-operating-system/FunnelMilestoneCard';
import { FunnelProgressCard } from '@/components/funnel-operating-system/FunnelProgressCard';
import { useFunnelOperatingData } from '@/components/funnel-operating-system/useFunnelOperatingData';
import { useFunnelPreference } from '@/components/funnel-operating-system/useFunnelPreference';

type Tab = 'journey' | 'achievements';

type AchievementDef = {
  key: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
};

type UnlockedAchievement = {
  key: string;
  title: string;
  description: string;
  icon: string;
  xpAwarded: number;
  unlockedAt: string;
};

const JOURNEYS: Record<BusinessFunnelType, Array<{ title: string; description: string; criteria: string; steps: Array<{ label: string; href: string }> }>> = {
  retail: [
    { title: 'Retail Funnel · Brand Trust', description: '让顾客知道你是谁、你解决什么问题。', criteria: 'Brand setup ready', steps: [{ label: 'Brand DNA', href: '/brand-dna' }, { label: 'Social Setup', href: '/social-setup' }] },
    { title: 'Retail Funnel · Demand Content', description: '持续发布能带来询问的内容和短视频。', criteria: '3 posts · 1 video', steps: [{ label: 'Content Engine', href: '/content-engine' }, { label: 'Video Production', href: '/video-production' }] },
    { title: 'Retail Funnel · Lead Capture', description: '把注意力转成名单和 WhatsApp 对话。', criteria: '1 funnel published · first lead', steps: [{ label: 'Lead Magnet', href: '/lead-magnet' }, { label: 'Funnel Builder', href: '/funnel-builder' }, { label: 'Traffic Engine', href: '/traffic-engine' }] },
    { title: 'Retail Funnel · First Customer', description: '跟进潜在客户，推动预约和第一笔成交。', criteria: '1 appointment · 1 customer', steps: [{ label: 'WhatsApp AI', href: '/whatsapp-ai' }, { label: 'CRM', href: '/crm' }] },
  ],
  recruitment: [
    { title: 'Recruitment Funnel · Opportunity Positioning', description: '清楚表达副业机会和适合人群。', criteria: 'Brand setup ready', steps: [{ label: 'Brand DNA', href: '/brand-dna' }, { label: 'Brand Discovery', href: '/brand-discovery' }] },
    { title: 'Recruitment Funnel · Story Content', description: '发布能吸引想增加收入人群的内容。', criteria: '3 posts · 1 video', steps: [{ label: 'Content Engine', href: '/content-engine' }, { label: 'Video Production', href: '/video-production' }] },
    { title: 'Recruitment Funnel · Webinar Invite', description: '把名单引导到讲座、说明会或策略电话。', criteria: '1 webinar · first lead', steps: [{ label: 'Webinar Center', href: '/webinar-center' }, { label: 'Traffic Engine', href: '/traffic-engine' }] },
    { title: 'Recruitment Funnel · First Member', description: '跟进、筛选并转化第一位伙伴。', criteria: '1 call · 1 member', steps: [{ label: 'WhatsApp AI', href: '/whatsapp-ai' }, { label: 'CRM', href: '/crm' }] },
  ],
  upgrade: [
    { title: 'Upgrade Funnel · Customer Base', description: '整理现有顾客和可邀请名单。', criteria: 'customer list ready', steps: [{ label: 'CRM', href: '/crm' }, { label: 'Content Insights', href: '/brand-builder/insights' }] },
    { title: 'Upgrade Funnel · Community Trust', description: '用内容和社群让顾客看到更大结果。', criteria: 'community content active', steps: [{ label: 'Content Engine', href: '/content-engine' }, { label: 'Video Production', href: '/video-production' }] },
    { title: 'Upgrade Funnel · Opportunity Invite', description: '邀请顾客进入升级讲座或机会说明。', criteria: 'first webinar invite', steps: [{ label: 'Webinar Center', href: '/webinar-center' }, { label: 'WhatsApp AI', href: '/whatsapp-ai' }] },
    { title: 'Upgrade Funnel · First Builder', description: '帮助升级成员开始复制第一个动作。', criteria: '1 upgrade · 1 builder', steps: [{ label: 'AI Workforce', href: '/ai-workforce' }, { label: 'Analytics', href: '/analytics-center' }] },
  ],
};

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function AchievementsTab({ totalXP }: { totalXP: number }) {
  const achievements = useAchievements();
  const unlocked = (achievements.data as { data?: { unlocked?: UnlockedAchievement[]; all?: AchievementDef[] } } | undefined)?.data?.unlocked ?? [];
  const all = (achievements.data as { data?: { unlocked?: UnlockedAchievement[]; all?: AchievementDef[] } } | undefined)?.data?.all ?? [];
  const unlockedByKey = new globalThis.Map(unlocked.map((item) => [item.key, item]));

  if (achievements.isLoading) {
    return <Skeleton className="h-80 w-full rounded-[var(--radius-lg)]" />;
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">我的成就</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">已解锁 {unlocked.length}/{all.length}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
          <Trophy className="h-4 w-4" aria-hidden="true" />
          {totalXP} XP
        </div>
      </div>

      <div className="space-y-3">
        {all.map((def) => {
          const unlockedItem = unlockedByKey.get(def.key);
          return (
            <div
              key={def.key}
              className={cn(
                'rounded-[var(--radius-md)] border p-4',
                unlockedItem ? 'border-amber-200 bg-amber-50' : 'border-[var(--color-border)] bg-[var(--color-surface)] opacity-75',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {unlockedItem ? 'Unlocked' : 'Locked'} · {def.title}
                </p>
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                  {unlockedItem ? `已解锁 · ${formatDate(unlockedItem.unlockedAt)}` : '未解锁'}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {def.description} · +{def.xp} XP
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function JourneyPhaseList({ progressPercent, funnelType }: { progressPercent: number; funnelType: BusinessFunnelType }) {
  const phases = JOURNEYS[funnelType];
  const completedPhaseCount = Math.min(phases.length, Math.floor(progressPercent / Math.max(1, 100 / phases.length)));
  const currentPhaseIndex = Math.min(phases.length - 1, completedPhaseCount);

  return (
    <div className="space-y-4">
      {phases.map((phase, index) => {
        const complete = index < completedPhaseCount;
        const current = index === currentPhaseIndex;
        const Icon = complete ? CheckCircle2 : Circle;

        return (
          <section
            key={phase.title}
            className={cn(
              'rounded-[var(--radius-lg)] border bg-white p-5 shadow-sm',
              current ? 'border-blue-200 ring-2 ring-blue-50' : 'border-[var(--color-border)]',
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <Icon
                  className={cn('mt-0.5 h-5 w-5 shrink-0', complete ? 'text-emerald-600' : current ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]')}
                  aria-hidden="true"
                />
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text)]">{phase.title}</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{phase.description}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                    完成标准：{phase.criteria}
                  </p>
                </div>
              </div>
              {current ? (
                <Link
                  href={phase.steps[0].href}
                  className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
                >
                  开始下一步
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {phase.steps.map((step) => (
                <Link
                  key={step.href}
                  href={step.href}
                  className="flex h-11 items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text)] hover:border-blue-200 hover:bg-blue-50"
                >
                  {step.label}
                  <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function JourneyPage() {
  const [tab, setTab] = React.useState<Tab>('journey');
  const { funnelType } = useFunnelPreference();
  const funnel = useFunnelOperatingData(funnelType);
  const mission = useMissionState();
  const state = mission.data?.data;
  const funnelData = funnel.data?.data;
  const progressPercent = funnelData?.progress.progress ?? state?.progressPercent ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Business Journey</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{getFunnelLabel(funnelType, 'zh')} Journey</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            不是完成阶段，而是推进当前漏斗：目标、瓶颈、下一步和成功路径。
          </p>
        </div>
        {state ? <ModeToggle mode={state.mode} compact /> : null}
      </div>

      <FunnelSelector compact />

      {funnelData ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <FunnelProgressCard progress={funnelData.progress} />
          <FunnelHealthCard health={funnelData.health} progress={funnelData.progress} />
          <section className="rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Next Action</p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--color-text)]">{funnelData.nextAction.action}</h2>
            <p className="mt-1 text-sm text-blue-700">Expected Impact: {funnelData.nextAction.expectedImpact}</p>
          </section>
        </div>
      ) : (
        <Skeleton className="h-32 w-full rounded-[var(--radius-lg)]" />
      )}

      <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-1 shadow-sm">
        {[
          { id: 'journey' as const, label: '旅程', icon: Compass },
          { id: 'achievements' as const, label: '成就', icon: Award },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition-colors',
                tab === item.id ? 'bg-blue-600 text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>

      {mission.isLoading ? (
        <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />
      ) : tab === 'journey' ? (
        <>
          <JourneyPhaseList progressPercent={progressPercent} funnelType={funnelType} />
          {funnelData ? <FunnelMilestoneCard milestones={funnelData.milestones} /> : null}
        </>
      ) : (
        <AchievementsTab totalXP={state?.totalXP ?? 0} />
      )}
    </div>
  );
}
