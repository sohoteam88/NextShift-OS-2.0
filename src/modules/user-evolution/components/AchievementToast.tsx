'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = {
  title: string;
  description: string;
  icon: string;
  visible: boolean;
  onDismiss: () => void;
};

export function AchievementToast({ title, description, icon, visible, onDismiss }: Props) {
  React.useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 shadow-lg',
      'animate-in slide-in-from-bottom-4',
    )}>
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">🎉 Achievement Unlocked</p>
        <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{title}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
      <button onClick={onDismiss} className="text-amber-400 hover:text-amber-600"><X className="h-4 w-4" /></button>
    </div>
  );
}
