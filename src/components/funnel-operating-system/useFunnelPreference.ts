'use client';

import * as React from 'react';
import type { FunnelType } from '@/modules/funnel-context/types';

const STORAGE_KEY = 'nextshift.currentFunnel';
const FUNNEL_TYPES: FunnelType[] = ['retail', 'recruitment', 'upgrade'];

function readPreference(): FunnelType {
  if (typeof window === 'undefined') return 'retail';
  const value = window.localStorage.getItem(STORAGE_KEY);
  return FUNNEL_TYPES.includes(value as FunnelType) ? (value as FunnelType) : 'retail';
}

export function useFunnelPreference() {
  const [funnelType, setFunnelTypeState] = React.useState<FunnelType>('retail');

  React.useEffect(() => {
    setFunnelTypeState(readPreference());
  }, []);

  const setFunnelType = React.useCallback((next: FunnelType) => {
    setFunnelTypeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent('nextshift:funnel-change', { detail: next }));
  }, []);

  React.useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<FunnelType>).detail;
      if (FUNNEL_TYPES.includes(detail)) setFunnelTypeState(detail);
    };
    window.addEventListener('nextshift:funnel-change', handler);
    return () => window.removeEventListener('nextshift:funnel-change', handler);
  }, []);

  return { funnelType, setFunnelType };
}

