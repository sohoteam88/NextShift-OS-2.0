'use client';

import { ArrowRight, Trophy } from 'lucide-react';
import type { JourneyStage } from '../constants/journey-map';

interface MilestoneCelebrationProps {
  stage: JourneyStage;
  xp: number;
  achievements: string[];
  onContinue: () => void;
}

export function MilestoneCelebration({ stage, xp, achievements, onContinue }: MilestoneCelebrationProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={index}
            className="absolute top-[-2rem] h-3 w-2 animate-[mission-confetti_2.8s_ease-in-out_infinite] rounded-sm"
            style={{
              left: `${(index * 13) % 100}%`,
              backgroundColor: ['#2563eb', '#14b8a6', '#a855f7', '#fb7185', '#f59e0b'][index % 5],
              animationDelay: `${index * 0.12}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md rounded-[var(--radius-lg)] bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-5xl">
          🎉
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-[var(--color-text)]">{stage.name_zh} 完成！</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">{stage.description_zh}</p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
          <Trophy className="h-4 w-4" aria-hidden="true" />+{xp} XP
        </div>

        {achievements.length > 0 ? (
          <div className="mt-5 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-3 text-left">
            <p className="text-sm font-semibold text-amber-800">解锁成就</p>
            <p className="mt-1 text-sm text-amber-700">🏆 {achievements.join(', ')}</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onContinue}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          继续 <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <style jsx>{`
        @keyframes mission-confetti {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          100% {
            transform: translate3d(24px, 110vh, 0) rotate(540deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
