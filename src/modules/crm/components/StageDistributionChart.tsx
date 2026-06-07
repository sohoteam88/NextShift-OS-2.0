'use client';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';

const STAGE_COLORS: Record<string, string> = {
  '新线索': '#6366f1',
  '已联系': '#8b5cf6',
  '已确认需求': '#f59e0b',
  '已预约': '#06b6d4',
  '已转化': '#10b981',
  '已流失': '#9ca3af',
};

type StageData = { stage: string; count: number };

type Props = {
  data: StageData[];
  loading?: boolean;
};

export function StageDistributionChart({ data, loading }: Props) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
        <Skeleton className="mb-4 h-5 w-24" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!data.length) return null;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
      <h2 className="mb-4 text-base font-semibold text-[var(--color-text)]">客户分布</h2>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 30, top: 0, bottom: 0 }}
          onClick={(e: unknown) => {
            const ev = e as { activePayload?: { payload?: { stage?: string } }[] } | null;
            const stage = ev?.activePayload?.[0]?.payload?.stage;
            if (stage) router.push(`/crm?stage=${encodeURIComponent(stage)}`);
          }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="stage"
            width={80}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <Tooltip
            formatter={(value: unknown) => [`${value} 个客户`, '']}
            cursor={{ fill: 'rgba(99,102,241,0.06)' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} cursor="pointer" label={{ position: 'right', fontSize: 12, fill: '#6b7280' }}>
            {data.map((entry) => (
              <Cell
                key={entry.stage}
                fill={STAGE_COLORS[entry.stage] ?? '#6366f1'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
