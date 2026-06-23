'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle, Lock, Route, Target, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import type { ActivationProjection } from '@/modules/activation/contracts/ActivationProjection';
import type { MissionAuthoritySnapshot } from '@/modules/mission-engine/contracts/MissionAuthority';
import type {
  BusinessOutcome,
  MissionNode,
  OutcomeMissionStatus,
  OutcomeStatus,
} from '@/modules/mission-engine/services/OutcomeOrchestrator';

type Props = {
  activation: ActivationProjection;
  authority: MissionAuthoritySnapshot;
  outcome: BusinessOutcome;
};

const missionStatusClass: Record<OutcomeMissionStatus, string> = {
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  ACTIVE: 'border-blue-200 bg-blue-50 text-blue-900',
  BLOCKED: 'border-amber-200 bg-amber-50 text-amber-900',
  LOCKED: 'border-slate-200 bg-slate-50 text-slate-600',
  FAILED: 'border-red-200 bg-red-50 text-red-900',
};

const outcomeStatusClass: Record<OutcomeStatus, string> = {
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  ACTIVE: 'border-blue-200 bg-blue-50 text-blue-800',
  BLOCKED: 'border-amber-200 bg-amber-50 text-amber-800',
  PLANNED: 'border-slate-200 bg-slate-50 text-slate-700',
  FAILED: 'border-red-200 bg-red-50 text-red-800',
};

function missionIcon(status: OutcomeMissionStatus) {
  if (status === 'COMPLETED') return CheckCircle2;
  if (status === 'LOCKED') return Lock;
  if (status === 'ACTIVE' || status === 'BLOCKED') return Zap;
  return Circle;
}

function progressWidth(value: number) {
  return `${Math.max(0, Math.min(value, 100))}%`;
}

function missionRoute(mission: MissionNode, authority: MissionAuthoritySnapshot) {
  if (mission.missionId === authority.missionPlan.id) return authority.missionPlan.route;
  return mission.route;
}

export function BeginnerJourneyView({ activation, authority, outcome }: Props) {
  const t = useTranslations('journey');
  const currentMission = outcome.missions.find((mission) => (
    mission.missionId === outcome.currentMissionId
  )) ?? outcome.missions.find((mission) => mission.status === 'ACTIVE') ?? outcome.missions[0];
  const nextMission = outcome.missions.find((mission) => (
    mission.missionId === outcome.nextMissionId
  ));
  const currentMissionRoute = currentMission
    ? missionRoute(currentMission, authority)
    : authority.missionPlan.route;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
          NextShift OS
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text)]">
              {t('title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              {t('subtitle')}
            </p>
          </div>
          <div className={cn(
            'inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold',
            outcomeStatusClass[outcome.status],
          )}>
            {t(`outcomeStatus.${outcome.status}`)}
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[var(--radius-lg)] border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Target className="mt-1 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-blue-700">
                {t('currentOutcome')}
              </p>
              <h2 className="mt-2 text-xl font-bold text-[var(--color-text)]">
                {t(`outcome.${outcome.templateId}.name`)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {t(`outcome.${outcome.templateId}.description`)}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-[var(--color-text-muted)]">{t('progress')}</span>
              <span className="text-blue-700">{outcome.completionPercentage}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: progressWidth(outcome.completionPercentage) }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Route className="mt-1 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-blue-700">
                {t('currentMission')}
              </p>
              <h2 className="mt-2 text-xl font-bold text-[var(--color-text)]">
                {authority.missionPlan.objective}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {authority.missionPlan.description}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[var(--color-text-muted)]">
              <span className="font-semibold text-[var(--color-text)]">
                {t('estimatedTime')}:
              </span>{' '}
              {authority.estimatedCompletion.label}
            </div>
            <Link
              href={currentMissionRoute}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              {authority.priorityAction.ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              {t('missionChain')}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {t('missionChainHelp')}
            </p>
          </div>
          <div className="text-sm font-semibold text-blue-700">
            {authority.progress.completedMissions}/{authority.progress.totalMissions} {t('completed')}
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {outcome.missions.map((mission) => {
            const Icon = missionIcon(mission.status);
            return (
              <div
                key={mission.missionId}
                className={cn('rounded-[var(--radius-md)] border p-4', missionStatusClass[mission.status])}
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase">
                      {t(`missionStatus.${mission.status}`)}
                    </p>
                    <h3 className="mt-2 text-sm font-bold leading-snug">
                      {mission.name}
                    </h3>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/70">
                      <div
                        className="h-full rounded-full bg-current"
                        style={{ width: progressWidth(mission.completionPercentage) }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-semibold">
                      {mission.completionPercentage}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-blue-700">
            {t('nextMilestone')}
          </p>
          <h2 className="mt-2 text-lg font-bold text-[var(--color-text)]">
            {nextMission?.name ?? authority.progress.nextMilestone}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {authority.explainability.nextMilestone}
          </p>
          <div className="mt-4 rounded-[var(--radius-md)] bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              {t('requiredSignal')}
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
              {t('signalLine', {
                label: outcome.requiredSignal.label,
                value: String(outcome.requiredSignal.currentValue ?? 0),
                target: String(outcome.requiredSignal.targetValue),
              })}
            </p>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-emerald-700">
            {t('activationProgress')}
          </p>
          <h2 className="mt-2 text-lg font-bold text-[var(--color-text)]">
            {activation.currentStep.label}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {activation.currentMission.description}
          </p>
          <div className="mt-4 flex items-center justify-between text-sm font-semibold">
            <span className="text-[var(--color-text-muted)]">{t('progress')}</span>
            <span className="text-emerald-700">{activation.activationState.completionPercentage}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-emerald-600"
              style={{ width: progressWidth(activation.activationState.completionPercentage) }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
