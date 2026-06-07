'use client';
import { useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSetFollowup } from '../hooks/use-followup';
import { useToast } from '@/stores/toast-store';

type Props = {
  leadId: string;
  current?: string | null;
};

function addDays(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(9, 0, 0, 0);
  return d;
}

const QUICK_OPTIONS = [
  { label: '明天', days: 1 },
  { label: '后天', days: 2 },
  { label: '下周', days: 7 },
];

export function FollowupDatePicker({ leadId, current }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const setFollowup = useSetFollowup();
  const { toast } = useToast();

  async function handleSet(date: Date | null) {
    try {
      await setFollowup.mutateAsync({ leadId, date });
      toast('success', date ? `跟进设为 ${date.toLocaleDateString('zh-CN')}` : '跟进已清除');
      setShowCustom(false);
      setCustomDate('');
    } catch {
      toast('error', '设置失败');
    }
  }

  async function handleCustomSave() {
    if (!customDate) return;
    await handleSet(new Date(customDate + 'T09:00:00'));
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
          <CalendarDays className="h-4 w-4" />
          下次跟进
        </h3>
        {current && (
          <button
            onClick={() => handleSet(null)}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
          >
            清除
          </button>
        )}
      </div>

      {current && (
        <p className="mb-3 rounded-[var(--radius-md)] bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
          {new Date(current).toLocaleDateString('zh-CN', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {QUICK_OPTIONS.map(({ label, days }) => (
          <Button
            key={label}
            size="sm"
            variant="secondary"
            loading={setFollowup.isPending}
            onClick={() => handleSet(addDays(days))}
          >
            {label}
          </Button>
        ))}
        <Button
          size="sm"
          variant="secondary"
          icon={<CalendarDays className="h-4 w-4" />}
          onClick={() => setShowCustom((v) => !v)}
        >
          自定义
        </Button>
      </div>

      {showCustom && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <Button size="sm" onClick={handleCustomSave} loading={setFollowup.isPending} disabled={!customDate}>
            确定
          </Button>
          <button onClick={() => setShowCustom(false)}>
            <X className="h-4 w-4 text-[var(--color-text-muted)]" />
          </button>
        </div>
      )}
    </div>
  );
}
