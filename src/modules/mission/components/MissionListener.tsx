'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMissionCelebrationStore } from '@/stores/mission-celebration-store';
import { MilestoneCelebration } from './MilestoneCelebration';

export function MissionListener() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pending = useMissionCelebrationStore((state) => state.pending);
  const clear = useMissionCelebrationStore((state) => state.clear);

  if (!pending) return null;

  return (
    <MilestoneCelebration
      stage={pending.stage}
      xp={pending.xp}
      achievements={pending.achievements}
      onContinue={() => {
        clear();
        queryClient.invalidateQueries({ queryKey: ['mission'] });
        router.push('/dashboard');
      }}
    />
  );
}
