'use client';

import * as React from 'react';
import { useUserEvolution } from '@/modules/user-evolution/hooks/useUserEvolution';
import { getStats, getAllItems, createPublishingItem, updateStatus, getOptimalPublishTime } from '../services/publishing-service';
import type { PublishingStats, PublishingItem, PublishingPlatform } from '../types/publishing.types';

export function usePublishingCenter() {
  const evolution = useUserEvolution();
  const [stats, setStats] = React.useState<PublishingStats>(getStats());
  const [queue, setQueue] = React.useState<PublishingItem[]>(getAllItems());

  const refresh = React.useCallback(() => {
    setStats(getStats());
    setQueue(getAllItems());
  }, []);

  const addToQueue = React.useCallback((contentId: string, title: string, platform: PublishingPlatform) => {
    createPublishingItem(contentId, title, platform);
    refresh();
  }, [refresh]);

  const approve = React.useCallback((id: string) => {
    updateStatus(id, 'approved');
    refresh();
  }, [refresh]);

  const schedule = React.useCallback((id: string, scheduledAt: string) => {
    const s = getOptimalPublishTime('facebook');
    updateStatus(id, 'scheduled');
    refresh();
  }, [refresh]);

  return {
    stats,
    queue,
    addToQueue,
    approve,
    schedule,
    refresh,
    getOptimalTime: getOptimalPublishTime,
    isLocked: !evolution.isModuleUnlocked('content-engine'),
    showSmartSchedule: evolution.level === 'operator' || evolution.level === 'leader',
  };
}
