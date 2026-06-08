'use client';
import { useEffect } from 'react';

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/v1/public/funnel/${slug}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'view' }),
    }).catch(() => {});
  }, [slug]);

  return null;
}
