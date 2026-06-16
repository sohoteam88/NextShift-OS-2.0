'use client';

import { ArrowRight, Lock } from 'lucide-react';
import { useUserEvolution } from '@/modules/user-evolution/hooks/useUserEvolution';

export function UnlockPreview() {
  const evolution = useUserEvolution();
  if (evolution.level === 'leader') return null; // nothing locked for leaders

  const nextLevel = evolution.level === 'explorer' ? 'builder' : evolution.level === 'builder' ? 'operator' : 'leader';

  const previews: Record<string, { title: string; items: string[] }> = {
    builder: { title: '解锁内容引擎', items: ['内容策略自动生成', 'AI 内容创作助手', '内容表现分析'] },
    operator: { title: '解锁获客与转化系统', items: ['Lead Magnet Builder', 'CRM 引擎', '销售引擎'] },
    leader: { title: '解锁团队扩展系统', items: ['团队成员管理', '自动化工作流程', '组织数据分析'] },
  };

  const preview = previews[nextLevel];
  if (!preview) return null;

  return (
    <div className="rounded-[var(--radius-lg)] border border-purple-100 bg-purple-50 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="h-4 w-4 text-purple-500" />
        <h3 className="text-sm font-semibold text-purple-800">完成当前阶段后解锁</h3>
      </div>
      <p className="text-sm font-medium text-purple-700 mb-2">{preview.title}</p>
      <div className="space-y-1">
        {preview.items.map((item) => (
          <div key={item} className="flex items-center gap-1.5 text-xs text-purple-600">
            <ArrowRight className="h-3 w-3" />{item}
          </div>
        ))}
      </div>
    </div>
  );
}
