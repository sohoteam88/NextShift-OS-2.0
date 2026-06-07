'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function GoDashboardButton({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function goDashboard() {
    setLoading(true);
    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <Button type="button" loading={loading} onClick={goDashboard}>
      {children}
    </Button>
  );
}
