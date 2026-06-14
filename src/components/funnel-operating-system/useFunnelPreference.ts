'use client';

import * as React from 'react';
import type { BusinessFunnelType } from '@/modules/funnel/types/funnel-context';

const STORAGE_KEY = 'nextshift.currentFunnel';
const FUNNEL_TYPES: BusinessFunnelType[] = ['retail', 'recruitment', 'upgrade'];

function readPreference(): BusinessFunnelType {
  if (typeof window === 'undefined') return 'retail';
  const value = window.localStorage.getItem(STORAGE_KEY);
  return FUNNEL_TYPES.includes(value as BusinessFunnelType) ? (value as BusinessFunnelType) : 'retail';
}

export function useFunnelPreference() {
  const [funnelType, setFunnelTypeState] = React.useState<BusinessFunnelType>('retail');

  React.useEffect(() => {
    setFunnelTypeState(readPreference());
  }, []);

  const setFunnelType = React.useCallback((next: BusinessFunnelType) => {
    setFunnelTypeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent('nextshift:funnel-change', { detail: next }));
  }, []);

  React.useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<BusinessFunnelType>).detail;
      if (FUNNEL_TYPES.includes(detail)) setFunnelTypeState(detail);
    };
    window.addEventListener('nextshift:funnel-change', handler);
    return () => window.removeEventListener('nextshift:funnel-change', handler);
  }, []);

  return { funnelType, setFunnelType };
}

