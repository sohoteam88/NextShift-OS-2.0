'use client';
import { useState } from 'react';
import { FileText, Phone, Mail, RefreshCw, Star, CheckCircle, MessageCircle, Users, Calendar, Tag } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { type ActivityEntry } from '../hooks/use-leads';
import { relativeTime } from '@/lib/relative-time';

const typeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  note_added:          { icon: <FileText className="h-4 w-4" />, label: '备注' },
  whatsapp:            { icon: <MessageCircle className="h-4 w-4" />, label: 'WhatsApp' },
  call:                { icon: <Phone className="h-4 w-4" />, label: '电话' },
  email:               { icon: <Mail className="h-4 w-4" />, label: '邮件' },
  meeting:             { icon: <Users className="h-4 w-4" />, label: '会面' },
  other:               { icon: <FileText className="h-4 w-4" />, label: '其他' },
  stage_change:        { icon: <RefreshCw className="h-4 w-4" />, label: '阶段变更' },
  score_change:        { icon: <Star className="h-4 w-4" />, label: '评分更新' },
  lead_created:        { icon: <CheckCircle className="h-4 w-4" />, label: '创建' },
  followup_set:        { icon: <Calendar className="h-4 w-4" />, label: '设定跟进' },
  followup_cleared:    { icon: <Calendar className="h-4 w-4" />, label: '清除跟进' },
  tag_changed:         { icon: <Tag className="h-4 w-4" />, label: '标签更新' },
};

const FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'call', label: '电话' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: '邮件' },
  { value: 'meeting', label: '会面' },
  { value: 'note_added', label: '备注' },
  { value: 'stage_change', label: '阶段' },
];

function dateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return '本周';
  return '更早';
}

type Props = {
  activities: ActivityEntry[];
  hasMore?: boolean;
  onLoadMore?: () => void;
};

export function ActivityTimeline({ activities, hasMore, onLoadMore }: Props) {
  const [filter, setFilter] = useState('');

  const filtered = filter ? activities.filter((a) => a.type === filter) : activities;

  // Group by date label, preserving order
  const groups: { label: string; items: ActivityEntry[] }[] = [];
  for (const a of filtered) {
    const label = dateGroup(a.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(a);
    } else {
      groups.push({ label, items: [a] });
    }
  }

  return (
    <div>
      {/* Type filter pills */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`rounded-[var(--radius-full)] border px-2.5 py-1 text-xs transition-colors ${
              filter === opt.value
                ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-gray-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">暂无活动记录</p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {group.label}
              </p>
              <div className="space-y-0">
                {group.items.map((activity, i) => {
                  const config = typeConfig[activity.type] ?? { icon: <FileText className="h-4 w-4" />, label: activity.type };
                  const isLast = i === group.items.length - 1;
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                          {config.icon}
                        </div>
                        {!isLast && <div className="mt-1 w-px flex-1 bg-[var(--color-border)]" />}
                      </div>
                      <div className="pb-4 pt-1">
                        <div className="flex items-center gap-2">
                          <Avatar name={activity.user.name} size="sm" />
                          <span className="text-sm font-medium text-[var(--color-text)]">{activity.user.name}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{relativeTime(activity.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{activity.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          className="mt-2 w-full text-center text-sm text-[var(--color-primary)] hover:underline"
        >
          加载更多
        </button>
      )}
    </div>
  );
}
