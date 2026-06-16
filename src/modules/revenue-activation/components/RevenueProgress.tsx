'use client';

import { ArrowRight, CircleDollarSign, Trophy } from 'lucide-react';
import { useRevenueJourney } from '../hooks/useRevenueJourney';
import { REVENUE_MILESTONES } from '../services/revenue-journey-service';
import { cn } from '@/lib/cn';

export function RevenueProgress() {
  const { score, level, nextMilestone, isComplete, completedCount, totalMilestones, progressPercent } = useRevenueJourney();

  if (isComplete) return null;

  const levelLabel = level === 'learning' ? '学习阶段' : level === 'selling' ? '销售阶段' : level === 'revenue_active' ? '收入活跃' : '收入构建者';
  const levelColor = level === 'learning' ? 'text-blue-600 bg-blue-50' : level === 'selling' ? 'text-purple-600 bg-purple-50' : level === 'revenue_active' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50';

  return (
    <div className="rounded-[var(--radius-lg)] border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CircleDollarSign className="h-5 w-5 text-emerald-600" />
          <h3 className="text-sm font-semibold text-emerald-800">收入挑战 · {completedCount}/{totalMilestones}</h3>
        </div>
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', levelColor)}>{levelLabel}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-emerald-200 overflow-hidden mb-2">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
      </div>
      {nextMilestone && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-emerald-700">下一步：{nextMilestone.title}</span>
          <span className="text-xs text-emerald-600 font-medium">{nextMilestone.reward}</span>
        </div>
      )}
    </div>
  );
}
