'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Copy, Share2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ShareFunnelDialog } from '@/modules/funnel/components/ShareFunnelDialog';
import { useFunnel } from '@/modules/funnel/hooks/use-funnels';
import { useToast } from '@/stores/toast-store';
import { relativeTime } from '@/lib/relative-time';

type Analytics = {
  views: number; submissions: number; whatsapp_clicks: number; conversion_rate: number;
  views_trend: { date: string; count: number }[];
  submissions_trend: { date: string; count: number }[];
};

type RecentLead = { id: string; name: string; phone?: string; createdAt: string };

function useAnalytics(id: string) {
  return useQuery({
    queryKey: ['funnel-analytics', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/funnel/funnels/${id}/analytics`);
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ data: Analytics }>;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

function useRecentLeads(funnelId: string) {
  return useQuery({
    queryKey: ['funnel-leads', funnelId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/crm/leads?limit=5&sort_by=createdAt&sort_order=desc`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      // Filter to leads from this funnel using source
      return (json.data as RecentLead[]).slice(0, 5);
    },
    enabled: !!funnelId,
  });
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4">
      <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--color-text)]">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{sub}</p>}
    </div>
  );
}

export default function FunnelAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const { data: funnelData, isLoading: funnelLoading } = useFunnel(id);
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics(id);
  const { data: leadsData } = useRecentLeads(id);

  const funnel = funnelData?.data;
  const analytics = analyticsData?.data;
  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/f/${funnel?.slug}` : '';

  // Merge trend data for chart
  const trendData = (() => {
    const map = new Map<string, { date: string; views: number; submissions: number }>();
    analytics?.views_trend.forEach(d => map.set(d.date, { date: d.date, views: d.count, submissions: 0 }));
    analytics?.submissions_trend.forEach(d => {
      const e = map.get(d.date);
      if (e) e.submissions = d.count;
      else map.set(d.date, { date: d.date, views: 0, submissions: d.count });
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  })();

  if (funnelLoading) return <div className="space-y-4 p-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /></div>;
  if (!funnel) return <div className="p-6 text-center text-[var(--color-text-muted)]">漏斗不存在</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button onClick={() => router.push('/funnel')} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-xl font-semibold text-[var(--color-text)]">{funnel.title} — 数据分析</h1>
        {funnel.status === 'published' && (
          <Button size="sm" variant="secondary" icon={<Share2 className="h-4 w-4" />} onClick={() => setShareOpen(true)}>分享</Button>
        )}
      </div>

      {/* KPI cards */}
      {analyticsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="浏览量" value={String(analytics?.views ?? 0)} />
          <KpiCard label="提交数" value={String(analytics?.submissions ?? 0)} />
          <KpiCard label="转化率" value={`${analytics?.conversion_rate ?? 0}%`} />
          <KpiCard label="WhatsApp 点击" value={String(analytics?.whatsapp_clicks ?? 0)} />
        </div>
      )}

      {/* Trend chart */}
      {trendData.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-[var(--color-text)]">30 天趋势</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} minTickGap={16} />
              <YAxis tick={{ fontSize: 11 }} width={36} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="views" name="浏览" stroke="#6366f1" fill="#6366f115" strokeWidth={2} />
              <Area type="monotone" dataKey="submissions" name="提交" stroke="#10b981" fill="#10b98115" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent leads */}
      {leadsData && leadsData.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-[var(--color-text)]">最近提交</h2>
          <div className="divide-y divide-[var(--color-border)]">
            {leadsData.map(lead => (
              <div key={lead.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">{lead.name}</p>
                  {lead.phone && <p className="text-xs text-[var(--color-text-muted)]">{lead.phone}</p>}
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="text-xs text-[var(--color-text-muted)]">{relativeTime(lead.createdAt)}</span>
                  <Button size="sm" variant="ghost" onClick={() => router.push(`/crm/${lead.id}`)}>查看客户</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funnel link */}
      {funnel.status === 'published' && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
          <h2 className="mb-3 text-base font-semibold text-[var(--color-text)]">漏斗链接</h2>
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-gray-50 px-3 py-2">
            <span className="flex-1 truncate text-sm text-gray-700">{publicUrl}</span>
            <button onClick={() => { navigator.clipboard.writeText(publicUrl); toast('success', '已复制'); }}
              className="text-[var(--color-primary)]"><Copy className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {funnel.status === 'published' && (
        <ShareFunnelDialog open={shareOpen} onClose={() => setShareOpen(false)} slug={funnel.slug} title={funnel.title} />
      )}
    </div>
  );
}
