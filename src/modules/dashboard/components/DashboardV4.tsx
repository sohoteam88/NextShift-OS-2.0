'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Brain, CheckCircle2, Clock, Lightbulb, Zap } from 'lucide-react';
import { CANONICAL_ROUTES } from '@/config/canonical-routes';
import { useEvolutionProjection } from '@/modules/evolution/hooks/use-evolution-projection';
import { useDashboardMission } from '../hooks/useDashboardMission';
import { AchievementToast } from '@/modules/user-evolution/components/AchievementToast';
import { RoadmapProgressSummary } from '@/modules/growth-roadmap/components/RoadmapProgressSummary';
import { useGrowthRoadmap } from '@/modules/growth-roadmap/hooks/useGrowthRoadmap';
import { UnlockPreview } from '@/modules/experience/components/UnlockPreview';
import { ActivationDashboard } from '@/modules/activation/components/ActivationDashboard';
import { useActivation } from '@/modules/activation/hooks/useActivation';
import { RevenueProgress } from '@/modules/revenue-activation/components/RevenueProgress';
import type { AICoachPersona } from '@/modules/user-evolution/types/evolution.types';
import type { EvolutionSnapshot } from '@/modules/evolution/types/evolution-snapshot';

type DashboardAchievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

const DEFAULT_SNAPSHOT: EvolutionSnapshot = {
  level: 'explorer',
  progressPercentage: 0,
  currentStage: 'brand_foundation',
  nextLevel: 'builder',
  unlockedModules: ['dashboard', 'journey', 'brand-builder'],
  completedMissions: 0,
  totalMissions: 0,
};

function getCoachPersona(level: EvolutionSnapshot['level']): AICoachPersona {
  switch (level) {
    case 'builder':
      return {
        style: 'content_strategist',
        focus: ['Content', 'Lead Generation'],
        tone: 'Consistency matters more than perfection. Publish three pieces of content before worrying about performance.',
      };
    case 'operator':
      return {
        style: 'sales_coach',
        focus: ['Follow-Up', 'Sales', 'Customers'],
        tone: 'You already have leads. Focus on follow-up consistency. Most sales happen after multiple follow-ups.',
      };
    case 'leader':
      return {
        style: 'business_mentor',
        focus: ['Scaling', 'Automation', 'Leadership'],
        tone: 'Your goal is no longer doing everything. Your goal is building systems that work without you.',
      };
    case 'explorer':
    default:
      return {
        style: 'teacher',
        focus: ['Brand', 'Story', 'Audience'],
        tone: 'Let\'s first understand who you are. Once your Brand DNA is complete, AI can create content that sounds like you.',
      };
  }
}

function getDashboardAchievement(snapshot: EvolutionSnapshot): DashboardAchievement | null {
  if (snapshot.level === 'leader' || snapshot.progressPercentage >= 90) {
    return {
      id: 'business_leader',
      title: 'Business Leader',
      description: 'Reached Leader level.',
      icon: '🚀',
    };
  }

  if (snapshot.level === 'operator' || snapshot.currentStage === 'customer_acquisition') {
    return {
      id: 'customer_closer',
      title: 'Customer Closer',
      description: 'Closed your first customer.',
      icon: '🤝',
    };
  }

  if (snapshot.level === 'builder' || snapshot.currentStage === 'content_creation') {
    return {
      id: 'content_creator',
      title: 'Content Creator',
      description: 'Published your first piece of content.',
      icon: '✍️',
    };
  }

  if (snapshot.completedMissions > 0 || snapshot.progressPercentage > 0) {
    return {
      id: 'brand_explorer',
      title: 'Brand Explorer',
      description: 'Completed your first brand milestone.',
      icon: '🧭',
    };
  }

  return null;
}

export function DashboardV4() {
  const router = useRouter();
  const { nextAction, mission, aiCoachMessage, isLoading } = useDashboardMission();
  const { snapshot } = useEvolutionProjection();
  const { roadmap } = useGrowthRoadmap();
  const activation = useActivation();
  const resolvedSnapshot = snapshot ?? DEFAULT_SNAPSHOT;
  const coachPersona = getCoachPersona(resolvedSnapshot.level);
  const achievement = getDashboardAchievement(resolvedSnapshot);
  const achievementId = achievement?.id ?? null;
  const [dismissedAchievementId, setDismissedAchievementId] = React.useState<string | null>(null);
  const completedTasks = mission.tasks.filter(t => t.completed).length;
  const totalTasks = mission.tasks.length;

  React.useEffect(() => {
    if (!achievementId) {
      setDismissedAchievementId(null);
      return;
    }

    const storageKey = `dashboard-achievement:${achievementId}`;
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(storageKey)) {
      setDismissedAchievementId(achievementId);
      return;
    }

    setDismissedAchievementId(null);
  }, [achievementId]);

  const dismissAchievement = React.useCallback(() => {
    if (!achievementId || typeof window === 'undefined') return;
    window.sessionStorage.setItem(`dashboard-achievement:${achievementId}`, '1');
    setDismissedAchievementId(achievementId);
  }, [achievementId]);

  const visibleAchievement = achievement && dismissedAchievementId !== achievement.id ? achievement : null;

  // Show Activation Dashboard for new users (first 7 days, not yet completed)
  if (!activation.isComplete && activation.currentDay <= 7) {
    return <ActivationDashboard />;
  }

  const ctaLabel = mission.stage === 'brand_foundation' ? '开始品牌访谈' :
    mission.stage === 'content_creation' ? '进入内容中心' :
    mission.stage === 'lead_generation' ? '进入客户开发' :
    mission.stage === 'customer_acquisition' ? '进入客户管理' :
    mission.stage === 'system_building' ? '进入销售中心' :
    mission.stage === 'team_scaling' ? '进入团队成长' : '继续成长旅程';

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8">
      {/* ── Section 1: Today's Mission (highest priority, full width) ── */}
      <section className="rounded-[var(--radius-lg)] border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-blue-800">今日任务</h2>
        </div>
        <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">{nextAction.title}</h3>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="text-sm text-[var(--color-text-muted)]">预计时间：{nextAction.estimatedMinutes} 分钟</span>
        </div>
        <div className="mb-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">完成后你将获得：</p>
          {nextAction.outcomes.map((o) => (
            <div key={o} className="flex items-center gap-2 text-sm text-[var(--color-text)]">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />{o}
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push(nextAction.route)}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:w-auto"
        >
          {ctaLabel} <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {/* ── Section 2+3: Progress + AI Coach (side by side) ── */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-5">
          <RoadmapProgressSummary roadmap={roadmap} />
          {!activation.isComplete && <RevenueProgress />}
          <UnlockPreview />
        </div>

        {/* AI Coach */}
        <section className="rounded-[var(--radius-lg)] border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              <h2 className="text-base font-semibold text-[var(--color-text)]">AI 教练</h2>
            </div>
            <button
              type="button"
              onClick={() => router.push(CANONICAL_ROUTES.ceoMode)}
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-amber-200 bg-white px-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
            >
              <Brain className="h-3.5 w-3.5" aria-hidden="true" />
              AI COO
            </button>
          </div>
          <div className="space-y-3 text-sm text-[var(--color-text)]">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">当前任务：{mission.title}</p>
            <p className="text-xs text-amber-600">{completedTasks}/{totalTasks} 个任务  ·  {mission.objective}</p>
            <div>
              <p className="font-semibold text-xs uppercase tracking-widest text-amber-700 mb-1">为什么</p>
              <p className="text-[var(--color-text-muted)] leading-relaxed">{aiCoachMessage.why}</p>
            </div>
            <div>
              <p className="font-semibold text-xs uppercase tracking-widest text-amber-700 mb-1">预期结果</p>
              <p className="text-[var(--color-text-muted)] leading-relaxed">{aiCoachMessage.outcome}</p>
            </div>
            <div>
              <p className="font-semibold text-xs uppercase tracking-widest text-amber-700 mb-1">常见错误</p>
              <p className="text-[var(--color-text-muted)] leading-relaxed">{aiCoachMessage.mistake}</p>
            </div>
            <p className="text-xs text-emerald-600 font-medium italic">✨ {aiCoachMessage.encouragement}</p>
            <p className="text-xs text-amber-600 font-medium">⏱ {aiCoachMessage.time}  ·  {coachPersona.style.replace('_', ' ')} 模式</p>
          </div>
        </section>
      </div>

      {/* Achievement Toast */}
      <AchievementToast
        title={visibleAchievement?.title ?? ''}
        description={visibleAchievement?.description ?? ''}
        icon={visibleAchievement?.icon ?? ''}
        visible={!!visibleAchievement}
        onDismiss={dismissAchievement}
      />
    </div>
  );
}
