'use client';

import { useQuery } from '@tanstack/react-query';
import type { DashboardProjection } from '../adapters/DashboardProjectionAdapter';
import type { Mission, MissionStage } from '@/modules/mission-engine/types/mission.types';

const DASHBOARD_PROJECTION_TIMEOUT_MS = 12_000;

function toMissionStage(stage: string): MissionStage {
  const stages: MissionStage[] = [
    'brand_foundation',
    'content_creation',
    'lead_generation',
    'customer_acquisition',
    'system_building',
    'team_scaling',
  ];

  return stages.includes(stage as MissionStage) ? stage as MissionStage : 'brand_foundation';
}

function projectionToMission(projection?: DashboardProjection): Mission {
  const route = projection?.nextAction.route ?? '/journey';

  return {
    id: projection?.currentMission.id ?? 'dashboard-projection-loading',
    stage: toMissionStage(projection?.progress.stage ?? 'brand_foundation'),
    title: projection?.currentMission.title ?? 'Loading mission',
    description: projection?.currentMission.description ?? 'Loading Dashboard projection.',
    objective: projection?.nextAction.description ?? 'Advance the current journey step.',
    tasks: [
      {
        key: 'dashboard-projection-next-action',
        label: projection?.nextAction.title ?? 'Open journey',
        route,
        completed: projection?.progress.value === 100,
      },
    ],
    rewards: projection?.recommendations.map((recommendation) => recommendation.title) ?? [],
    estimatedTime: '15 分钟',
    completed: projection?.currentMission.status === 'completed',
  };
}

export function useDashboardMission() {
  const projection = useQuery({
    queryKey: ['dashboard-projection'],
    queryFn: async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), DASHBOARD_PROJECTION_TIMEOUT_MS);

      try {
        const res = await fetch('/api/v1/dashboard/projection', {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load dashboard projection');
        const json = await res.json() as { data: DashboardProjection };
        return json.data;
      } finally {
        window.clearTimeout(timeout);
      }
    },
    staleTime: 60_000,
    retry: 1,
  });

  const data = projection.data;

  return {
    ...projection,
    projection: data,
    mission: projectionToMission(data),
    nextAction: data?.nextAction ?? {
      title: 'Open journey',
      description: 'Continue from the current Journey State next action.',
      route: '/journey',
    },
    progress: {
      currentStep: Math.max(1, Math.ceil((data?.progress.value ?? 0) / 15)),
      totalSteps: 7,
      pct: data?.progress.value ?? 0,
      stageName: data?.progress.stage ?? 'brand_foundation',
    },
    isLoading: projection.isLoading,
  };
}
