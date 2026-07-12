'use client';

import { useEffect } from 'react';
import { analytics } from '@/lib/telemetry/tracker';

let analyticsInitRequested = false;

export function AnalyticsInit() {
  useEffect(() => {
    if (analyticsInitRequested) return;
    analyticsInitRequested = true;
    void analytics.init();
  }, []);

  return null;
}
