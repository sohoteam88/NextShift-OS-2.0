'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/stores/toast-store';

type ModuleItem = {
  id: string;
  name: string;
  description: string;
  content_url?: string | null;
  order: number;
};

export function TrainingModulesConfig() {
  const t = useTranslations('admin');
  const common = useTranslations('common');
  const qc = useQueryClient();
  const { toast } = useToast();
  const [items, setItems] = React.useState<ModuleItem[]>([]);

  const query = useQuery({
    queryKey: ['admin-training-modules'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/training/defaults');
      if (!res.ok) throw new Error('Failed to load training modules');
      return res.json() as Promise<{ data: ModuleItem[] }>;
    },
  });

  React.useEffect(() => {
    setItems((query.data?.data ?? []).slice().sort((a, b) => a.order - b.order));
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/admin/training/defaults', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modules: items.map((item, index) => ({
            ...item,
            order: index + 1,
          })),
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to save training modules');
      }
      return res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-training-modules'] });
      toast('success', common('save'));
    },
  });

  function updateItem(index: number, patch: Partial<ModuleItem>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: `mod-${Date.now()}`,
        name: t('newModuleName'),
        description: t('newModuleDescription'),
        content_url: '',
        order: current.length + 1,
      },
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
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('trainingTitle')}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('trainingHelp')}</p>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="flex flex-wrap items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <div className="flex items-center gap-1 pt-2">
                <Button variant="ghost" size="sm" icon={<ArrowUp className="h-4 w-4" />} onClick={() => moveItem(index, -1)} />
                <Button variant="ghost" size="sm" icon={<ArrowDown className="h-4 w-4" />} onClick={() => moveItem(index, 1)} />
              </div>
              <Input
                value={item.name}
                onChange={(e) => updateItem(index, { name: e.target.value })}
                className="min-w-[220px] flex-[1.5]"
                placeholder={t('moduleName')}
              />
              <Input
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                className="min-w-[280px] flex-[2]"
                placeholder={t('moduleDescription')}
              />
              <Input
                value={item.content_url ?? ''}
                onChange={(e) => updateItem(index, { content_url: e.target.value })}
                className="min-w-[220px] flex-[1.5]"
                placeholder={t('moduleContentUrl')}
              />
              <div className="pt-2 text-xs text-[var(--color-text-muted)]">{item.id}</div>
              <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => removeItem(index)} />
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={addItem}>
            {t('addModule')}
          </Button>
          <Button loading={mutation.isPending} icon={<Save className="h-4 w-4" />} onClick={() => mutation.mutate()}>
            {common('save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
