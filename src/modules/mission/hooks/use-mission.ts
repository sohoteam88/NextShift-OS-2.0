'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { JourneyStage } from '../constants/journey-map';
import { triggerMissionCelebrationFromResponse } from '@/stores/mission-celebration-store';

export type MissionMode = 'guided' | 'advanced';

export interface MissionStateResponse {
  currentStage: JourneyStage | null;
  nextStage: JourneyStage | null;
  progressPercent: number;
  totalXP: number;
  completedChecks: string[];
  mode: MissionMode;
  isJourneyComplete: boolean;
  estimatedTimeToNext: string;
  estimatedTimeToFirstLead: string | null;
  estimatedTimeToFirstSale: string | null;
}

async function readJson<T>(res: Response, message: string): Promise<T> {
  if (!res.ok) throw new Error(message);
  return res.json() as Promise<T>;
}

export function useMissionState(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['mission', 'state'],
    queryFn: async () => {
      const res = await fetch('/api/v1/mission/state');
      return readJson<{ data: MissionStateResponse }>(res, 'Failed to fetch mission state');
    },
    staleTime: 10_000,
    enabled: options.enabled ?? true,
  });
}

export function useJourneyMap() {
  return useQuery({
    queryKey: ['mission', 'journey'],
    queryFn: async () => {
      const res = await fetch('/api/v1/mission/journey');
      return readJson<{ data: Array<JourneyStage & { status: 'completed' | 'active' | 'locked' }> }>(
        res,
        'Failed to fetch journey map',
      );
    },
  });
}

export function useCompleteCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (checkKey: string) => {
      const res = await fetch('/api/v1/mission/complete-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ check_key: checkKey }),
      });
      return readJson(res, 'Failed to complete check');
    },
    onSuccess: (data) => {
      triggerMissionCelebrationFromResponse(data);
      queryClient.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}

export function useSetMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mode: MissionMode) => {
      const res = await fetch('/api/v1/mission/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      return readJson(res, 'Failed to set mode');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mission'] }),
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ['mission', 'achievements'],
    queryFn: async () => {
      const res = await fetch('/api/v1/mission/achievements');
      return readJson(res, 'Failed to fetch achievements');
    },
  });
}
