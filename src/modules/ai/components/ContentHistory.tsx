'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { Copy, ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/stores/toast-store';

type ContentItem = {
  id: string;
  title?: string | null;
  displayTitle: string;
  platform?: string | null;
  preview: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type ContentDetail = ContentItem & { body: string };

function useHistory() {
  return useQuery({
    queryKey: ['ai-content-history'],
    queryFn: async () => {
      const res = await fetch('/api/v1/ai/content?limit=50');
      if (!res.ok) throw new Error('Failed to fetch content history');
      return res.json() as Promise<{
        data: ContentItem[];
        meta: { page: number; limit: number; total: number; totalPages: number };
      }>;
    },
  });
}

export function ContentHistory() {
  const t = useTranslations('ai');
  const common = useTranslations('common');
  const { data, isLoading } = useHistory();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [platform, setPlatform] = React.useState('all');
  const [status, setStatus] = React.useState('all');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');
  const [details, setDetails] = React.useState<Record<string, ContentDetail>>({});

  const items = (data?.data ?? []).filter((item) => {
    if (platform !== 'all' && item.platform !== platform) return false;
    if (status !== 'all' && item.status !== status) return false;
    return true;
  });

  async function handleDelete(id: string) {
    await fetch(`/api/v1/ai/content/${id}`, { method: 'DELETE' });
    await qc.invalidateQueries({ queryKey: ['ai-content-history'] });
    toast('success', t('deleted'));
  }

  async function handleSave(item: ContentItem) {
    await fetch(`/api/v1/ai/content/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: draft, status: item.status }),
    });
    setEditingId(null);
    setDetails((current) => ({
      ...current,
      [item.id]: { ...(current[item.id] ?? item), body: draft },
    }));
    await qc.invalidateQueries({ queryKey: ['ai-content-history'] });
    toast('success', common('save'));
  }

  async function toggleExpanded(item: ContentItem) {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.id);
    if (details[item.id]) return;
    const response = await fetch(`/api/v1/ai/content/${item.id}`);
    if (!response.ok) {
      toast('error', 'Failed to fetch content');
      return;
    }
    const payload = await response.json() as { data: ContentDetail };
    setDetails((current) => ({ ...current, [item.id]: payload.data }));
  }

  async function handlePublish(item: ContentItem) {
    await fetch(`/api/v1/ai/content/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    });
    await qc.invalidateQueries({ queryKey: ['ai-content-history'] });
    toast('success', t('published'));
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-text)]">{t('contentHistory')}</h3>
          <p className="text-sm text-[var(--color-text-muted)]">{t('contentHistoryHelp')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm">
            <option value="all">{t('allPlatforms')}</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="xiaohongshu">小红书</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm">
            <option value="all">{t('allStatus')}</option>
            <option value="draft">{t('draft')}</option>
            <option value="published">{t('published')}</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">{common('loading')}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">{t('noHistory')}</p>
        ) : (
          items.map((item) => {
            const expanded = expandedId === item.id;
            const editing = editingId === item.id;
            const detail = details[item.id];
            return (
              <div key={item.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
                <button
                  type="button"
                  onClick={() => void toggleExpanded(item)}
                  className="flex w-full items-start justify-between gap-4 text-left"
                >
                  <div>
                    <p className="font-medium text-[var(--color-text)]">{item.displayTitle}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.platform && <Badge variant="info">{item.platform}</Badge>}
                    <Badge variant={item.status === 'published' ? 'success' : 'warning'}>
                      {item.status}
                    </Badge>
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {expanded && (
                  <div className="mt-3 space-y-3 border-t border-[var(--color-border)] pt-3">
                    {editing ? (
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={8}
                        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm"
                      />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">{detail?.body ?? item.preview}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" icon={<Copy className="h-4 w-4" />} disabled={!detail} onClick={() => detail && navigator.clipboard.writeText(detail.body)}>
                        {t('copy')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Edit className="h-4 w-4" />}
                        disabled={!detail}
                        onClick={() => {
                          setEditingId(item.id);
                          setDraft(detail?.body ?? '');
                        }}
                      >
                        {common('edit')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => handleDelete(item.id)}
                      >
                        {common('delete')}
                      </Button>
                      {item.status !== 'published' && (
                        <Button variant="secondary" size="sm" onClick={() => handlePublish(item)}>
                          {t('markPublished')}
                        </Button>
                      )}
                      {editing && (
                        <Button size="sm" onClick={() => handleSave(item)}>
                          {common('save')}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
