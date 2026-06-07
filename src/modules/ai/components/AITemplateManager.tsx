'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';
import { useToast } from '@/stores/toast-store';
import { Plus, Trash2, Save, Settings2 } from 'lucide-react';

type Template = {
  id: string;
  name: string;
  category: string;
  prompt: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  language: 'zh' | 'en' | 'ms';
  modelPreference: string;
  isDefault: boolean;
};

type FormState = {
  id?: string;
  name: string;
  category: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string;
  language: 'zh' | 'en' | 'ms';
  modelPreference: string;
  isDefault: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  category: 'content',
  systemPrompt: '',
  userPromptTemplate: '',
  variables: '',
  language: 'zh',
  modelPreference: 'anthropic',
  isDefault: false,
};

function useTemplates() {
  return useQuery({
    queryKey: ['admin-ai-templates'],
    queryFn: async () => {
      const res = await fetch('/api/v1/ai/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json() as Promise<{ data: Template[] }>;
    },
  });
}

export function AITemplateManager() {
  const t = useTranslations('admin');
  const common = useTranslations('common');
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useTemplates();
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  const templates = data?.data ?? [];
  const grouped = templates.reduce<Record<string, Template[]>>((acc, template) => {
    acc[template.category] = acc[template.category] ?? [];
    acc[template.category].push(template);
    return acc;
  }, {});

  React.useEffect(() => {
    if (!activeId && templates.length > 0) {
      const first = templates[0];
      setActiveId(first.id);
      setForm({
        id: first.id,
        name: first.name,
        category: first.category,
        systemPrompt: first.systemPrompt,
        userPromptTemplate: first.userPromptTemplate,
        variables: first.variables.join(', '),
        language: first.language,
        modelPreference: first.modelPreference,
        isDefault: first.isDefault,
      });
    }
  }, [templates, activeId]);

  const saveMutation = useMutation({
    mutationFn: async (payload: FormState) => {
      const body = {
        name: payload.name,
        category: payload.category,
        system_prompt: payload.systemPrompt,
        user_prompt_template: payload.userPromptTemplate,
        variables: payload.variables.split(',').map((item) => item.trim()).filter(Boolean),
        language: payload.language,
        model_preference: payload.modelPreference,
        is_default: payload.isDefault,
      };
      const res = await fetch(payload.id ? `/api/v1/ai/templates/${payload.id}` : '/api/v1/ai/templates', {
        method: payload.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save template');
      return res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-ai-templates'] });
      toast('success', common('save'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/ai/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete template');
      return res.json();
    },
    onSuccess: async () => {
      setConfirmDeleteId(null);
      await qc.invalidateQueries({ queryKey: ['admin-ai-templates'] });
      toast('success', common('delete'));
    },
  });

  function selectTemplate(template: Template) {
    setActiveId(template.id);
    setForm({
      id: template.id,
      name: template.name,
      category: template.category,
      systemPrompt: template.systemPrompt,
      userPromptTemplate: template.userPromptTemplate,
      variables: template.variables.join(', '),
      language: template.language,
      modelPreference: template.modelPreference,
      isDefault: template.isDefault,
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">{t('templates')}</h2>
            <p className="text-sm text-[var(--color-text-muted)]">{t('templateManagerSubtitle')}</p>
          </div>
          <Button
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setActiveId(null);
              setForm(EMPTY_FORM);
            }}
          >
            {t('addTemplate')}
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">{common('loading')}</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, list]) => (
              <div key={category} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{category}</p>
                <div className="space-y-2">
                  {list.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => selectTemplate(template)}
                      className={cn(
                        'w-full rounded-[var(--radius-md)] border px-3 py-2 text-left transition-colors',
                        activeId === template.id
                          ? 'border-[var(--color-primary)] bg-blue-50'
                          : 'border-[var(--color-border)] hover:bg-[var(--color-surface)]',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-[var(--color-text)]">{template.name}</p>
                        {template.isDefault && <Badge variant="success">{t('default')}</Badge>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="info">{template.language}</Badge>
                        {template.variables.slice(0, 3).map((item) => (
                          <Badge key={item} variant="default">{item}</Badge>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">{form.id ? t('editTemplate') : t('newTemplate')}</h2>
            <p className="text-sm text-[var(--color-text-muted)]">{t('templateEditorSubtitle')}</p>
          </div>
          {form.id && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => setConfirmDeleteId(form.id!)}
            >
              {common('delete')}
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input label={t('templateName')} value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} />
          <Input label={t('templateCategory')} value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))} />
          <Input label={t('templateLanguage')} value={form.language} onChange={(e) => setForm((current) => ({ ...current, language: e.target.value as FormState['language'] }))} />
          <Input label={t('modelPreference')} value={form.modelPreference} onChange={(e) => setForm((current) => ({ ...current, modelPreference: e.target.value }))} />
        </div>

        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">{t('variables')}</label>
          <Input value={form.variables} onChange={(e) => setForm((current) => ({ ...current, variables: e.target.value }))} placeholder={t('variablesPlaceholder')} />
        </div>

        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">{t('systemPrompt')}</label>
          <textarea
            value={form.systemPrompt}
            onChange={(e) => setForm((current) => ({ ...current, systemPrompt: e.target.value }))}
            rows={8}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">{t('userPrompt')}</label>
          <textarea
            value={form.userPromptTemplate}
            onChange={(e) => setForm((current) => ({ ...current, userPromptTemplate: e.target.value }))}
            rows={10}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((current) => ({ ...current, isDefault: e.target.checked }))}
            />
            {t('setDefault')}
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => saveMutation.mutate(form)} loading={saveMutation.isPending} icon={<Save className="h-4 w-4" />}>
            {common('save')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setForm(EMPTY_FORM)}
            icon={<Settings2 className="h-4 w-4" />}
          >
            {common('cancel')}
          </Button>
        </div>
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-white p-5 shadow-lg">
            <h3 className="text-base font-semibold text-[var(--color-text)]">{t('confirmDelete')}</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t('confirmDeleteDesc')}</p>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmDeleteId(null)}>{common('cancel')}</Button>
              <Button variant="danger" onClick={() => deleteMutation.mutate(confirmDeleteId)} loading={deleteMutation.isPending}>
                {common('delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
