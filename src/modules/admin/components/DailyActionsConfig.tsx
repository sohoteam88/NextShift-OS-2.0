'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/stores/toast-store';

type ActionItem = {
  type: string;
  description: string;
  category: 'learn' | 'content' | 'crm';
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');
}

function toCategory(type: string): ActionItem['category'] {
  const prefix = type.split('.')[0];
  if (prefix === 'content' || prefix === 'crm') return prefix;
  return 'learn';
}

function buildType(category: ActionItem['category'], description: string, index: number) {
  const slug = slugify(description) || `task-${index + 1}`;
  return `${category}.${slug}`;
}

export function DailyActionsConfig() {
  const t = useTranslations('admin');
  const common = useTranslations('common');
  const qc = useQueryClient();
  const { toast } = useToast();
  const [items, setItems] = React.useState<ActionItem[]>([]);

  const query = useQuery({
    queryKey: ['admin-daily-actions'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/daily-actions/defaults');
      if (!res.ok) throw new Error('Failed to load daily actions');
      return res.json() as Promise<{ data: Array<{ type: string; description: string }> }>;
    },
  });

  React.useEffect(() => {
    const data = query.data?.data ?? [];
    setItems(data.map((action) => ({ ...action, category: toCategory(action.type) })));
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/admin/daily-actions/defaults', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actions: items.map((item, index) => ({
            type: buildType(item.category, item.description, index),
            description: item.description,
          })),
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to save daily actions');
      }
      return res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-daily-actions'] });
      toast('success', common('save'));
    },
  });

  function updateItem(index: number, patch: Partial<ActionItem>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((current) => [
      ...current,
      { type: 'learn.new_task', description: t('newActionPlaceholder'), category: 'learn' },
    ]);
  }

  function moveItem(index: number, direction: -1 | 1) {
    setItems((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return next;
      const [removed] = next.splice(index, 1);
      next.splice(target, 0, removed);
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('dailyActionsTitle')}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('dailyActionsHelp')}</p>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`${item.type}-${index}`} className="flex flex-wrap items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <div className="flex items-center gap-1 pt-2">
                <Button variant="ghost" size="sm" icon={<ArrowUp className="h-4 w-4" />} onClick={() => moveItem(index, -1)} />
                <Button variant="ghost" size="sm" icon={<ArrowDown className="h-4 w-4" />} onClick={() => moveItem(index, 1)} />
              </div>
              <div className="min-w-[120px] flex-1">
                <select
                  value={item.category}
                  onChange={(e) => updateItem(index, { category: e.target.value as ActionItem['category'] })}
                  className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm"
                >
                  <option value="learn">{t('categoryLearn')}</option>
                  <option value="content">{t('categoryContent')}</option>
                  <option value="crm">{t('categoryCRM')}</option>
                </select>
              </div>
              <Input
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                className="min-w-[280px] flex-[2]"
                placeholder={t('dailyActionDescription')}
              />
              <div className="pt-2 text-xs text-[var(--color-text-muted)]">
                {buildType(item.category, item.description, index)}
              </div>
              <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => removeItem(index)} />
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={addItem}>
            {t('addAction')}
          </Button>
          <Button loading={mutation.isPending} icon={<Save className="h-4 w-4" />} onClick={() => mutation.mutate()}>
            {common('save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
