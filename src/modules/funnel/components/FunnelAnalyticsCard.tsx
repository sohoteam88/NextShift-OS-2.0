'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, BarChart2, Share2, Globe, GlobeLock, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShareFunnelDialog } from './ShareFunnelDialog';
import { useDeleteFunnel, usePublishFunnel, type FunnelRow } from '../hooks/use-funnels';
import { useToast } from '@/stores/toast-store';

const TYPE_LABELS: Record<string, string> = { landing: '落地页', quiz: '测试问卷', lead_magnet: '免费下载' };
const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'default'> = {
  published: 'success', draft: 'warning', archived: 'default',
};
const STATUS_LABELS: Record<string, string> = { published: '已发布', draft: '草稿', archived: '已归档' };

type Props = { funnel: FunnelRow };

export function FunnelAnalyticsCard({ funnel }: Props) {
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const deleteFunnel = useDeleteFunnel();
  const publishFunnel = usePublishFunnel();
  const { toast } = useToast();

  const conversionRate = funnel.views > 0
    ? ((funnel.conversions / funnel.views) * 100).toFixed(1)
    : '0.0';

  async function handleDelete() {
    if (!confirm(`确定删除 "${funnel.title}"？`)) return;
    try { await deleteFunnel.mutateAsync(funnel.id); toast('success', '已删除'); }
    catch { toast('error', '删除失败'); }
  }

  async function handleTogglePublish() {
    try {
      await publishFunnel.mutateAsync({ id: funnel.id, unpublish: funnel.status === 'published' });
      toast('success', funnel.status === 'published' ? '已取消发布' : '已发布！');
    } catch (e) { toast('error', e instanceof Error ? e.message : '操作失败'); }
  }

  return (
    <>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        {/* Title + badges */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-[var(--color-text)]">{funnel.title}</h3>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Badge variant="info" className="text-xs">{TYPE_LABELS[funnel.template?.type ?? ''] ?? '自定义'}</Badge>
          <Badge variant={STATUS_VARIANT[funnel.status]} className="text-xs">{STATUS_LABELS[funnel.status]}</Badge>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-[var(--radius-md)] bg-gray-50 py-2">
            <p className="text-lg font-bold text-[var(--color-text)]">{funnel.views}</p>
            <p className="text-xs text-[var(--color-text-muted)]">👁 浏览</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-gray-50 py-2">
            <p className="text-lg font-bold text-[var(--color-text)]">{funnel.conversions}</p>
            <p className="text-xs text-[var(--color-text-muted)]">📝 提交</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-gray-50 py-2">
            <p className="text-lg font-bold text-[var(--color-text)]">{conversionRate}%</p>
            <p className="text-xs text-[var(--color-text-muted)]">📊 转化</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" icon={<Pencil className="h-3.5 w-3.5" />}
            onClick={() => router.push(`/funnel/${funnel.id}/edit`)}>编辑</Button>
          <Button size="sm" variant="secondary" icon={<BarChart2 className="h-3.5 w-3.5" />}
            onClick={() => router.push(`/funnel/${funnel.id}/analytics`)}>数据</Button>
          {funnel.status === 'published' && (
            <Button size="sm" variant="secondary" icon={<Share2 className="h-3.5 w-3.5" />}
              onClick={() => setShareOpen(true)}>分享</Button>
          )}
          <Button size="sm" variant="secondary"
            icon={funnel.status === 'published' ? <GlobeLock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
            loading={publishFunnel.isPending} onClick={handleTogglePublish}>
            {funnel.status === 'published' ? '取消' : '发布'}
          </Button>
          <Button size="sm" variant="ghost" icon={<Trash2 className="h-3.5 w-3.5 text-red-400" />}
            onClick={handleDelete} />
        </div>
      </div>

      {funnel.status === 'published' && (
        <ShareFunnelDialog open={shareOpen} onClose={() => setShareOpen(false)} slug={funnel.slug} title={funnel.title} />
      )}
    </>
  );
}
