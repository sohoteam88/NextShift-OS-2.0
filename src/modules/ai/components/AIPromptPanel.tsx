'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';
import { useContentStream, useSaveContent } from '@/modules/ai/hooks/use-content-generator';
import { useLeadAnalysis } from '@/modules/ai/hooks/use-lead-analysis';
import { useWhatsAppReply } from '@/modules/ai/hooks/use-whatsapp-reply';
import { StreamingText } from './StreamingText';
import { useLeads, type LeadRow } from '@/modules/crm/hooks/use-leads';
import { useLead } from '@/modules/crm/hooks/use-leads';
import { Copy, Pencil, Save, Send, Sparkles } from 'lucide-react';
import type { ContentGenerateInput } from '@/modules/ai/hooks/use-content-generator';

type Feature = 'content' | 'whatsapp_reply' | 'lead_analysis';

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

type AIPromptPanelProps = {
  feature: Feature;
  onGenerated?: (result: unknown) => void;
  leadId?: string;
  defaultValues?: Record<string, string | undefined>;
};

type LeadOption = LeadRow;

function useAuthMe() {
  return useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await fetch('/api/v1/auth/me');
      if (!res.ok) throw new Error('Failed to fetch auth profile');
      return res.json() as Promise<{
        data: {
          user: {
            id: string;
            email: string;
            tenantId: string;
            role: string;
            name: string;
            preferredLanguage: 'zh' | 'en' | 'ms';
          };
          tenant: { id: string; name: string; settings: unknown; maxAiCalls: number; plan: string } | null;
        };
      }>;
    },
  });
}

function useAITemplates(category: Feature) {
  return useQuery({
    queryKey: ['ai-templates', category],
    queryFn: async () => {
      const res = await fetch(`/api/v1/ai/templates?category=${category}`);
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json() as Promise<{ data: Template[] }>;
    },
  });
}

function useLeadSearch(search: string) {
  return useLeads({ search, limit: 8 });
}

function resolveDefaultFields(feature: Feature, defaults: Record<string, string | undefined>) {
  if (feature === 'content') {
    return {
      topic: defaults.topic ?? '',
      platform: defaults.platform ?? 'facebook',
      tone: defaults.tone ?? 'educational',
      language: defaults.language ?? 'zh',
      additional_context: defaults.additional_context ?? '',
    };
  }

  if (feature === 'whatsapp_reply') {
    return {
      leadId: defaults.leadId ?? '',
      message_context: defaults.message_context ?? '',
      language: defaults.language ?? 'zh',
    };
  }

  return {
    leadId: defaults.leadId ?? '',
    language: defaults.language ?? 'zh',
  };
}

function fieldLabel(t: any, name: string) {
  const map: Record<string, string> = {
    user_name: t('variables.userName'),
    specialty: t('variables.specialty'),
    target_audience: t('variables.targetAudience'),
    topic: t('variables.topic'),
    platform: t('variables.platform'),
    tone: t('variables.tone'),
    language: t('variables.language'),
    additional_context: t('variables.additionalContext'),
    lead_name: t('variables.leadName'),
    lead_source: t('variables.leadSource'),
    lead_stage: t('variables.leadStage'),
    lead_score: t('variables.leadScore'),
    lead_notes: t('variables.leadNotes'),
    message_context: t('variables.messageContext'),
  };
  return map[name] ?? name;
}

export function AIPromptPanel({ feature, onGenerated, leadId, defaultValues = {} }: AIPromptPanelProps) {
  const t = useTranslations('ai');
  const common = useTranslations('common');
  const { data: authMe } = useAuthMe();
  const { data: templateData, isLoading: templatesLoading } = useAITemplates(feature);
  const saveContent = useSaveContent();
  const contentStream = useContentStream();
  const whatsappReply = useWhatsAppReply();
  const leadAnalysis = useLeadAnalysis();

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [editingOutput, setEditingOutput] = useState(false);
  const [outputDraft, setOutputDraft] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState(leadId ?? defaultValues.leadId ?? '');
  const [fields, setFields] = useState<Record<string, string>>(
    resolveDefaultFields(feature, defaultValues) as unknown as Record<string, string>,
  );

  const templates = templateData?.data ?? [];
  const template = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) ?? templates.find((item) => item.isDefault) ?? templates[0],
    [templates, selectedTemplateId],
  );

  const leadQuery = useLead(selectedLeadId);
  const lead = leadQuery.data?.data;
  const leadSearchQuery = useLeadSearch(leadSearch);
  const leadOptions = leadSearchQuery.data?.data ?? [];

  React.useEffect(() => {
    if (!template && templates.length === 0) return;
    if (!selectedTemplateId && template) {
      setSelectedTemplateId(template.id);
    }
  }, [template, templates.length, selectedTemplateId]);

  React.useEffect(() => {
    if (leadId) setSelectedLeadId(leadId);
  }, [leadId]);

  React.useEffect(() => {
    if (!template) return;
    const next: Record<string, string> = {};
    for (const variable of template.variables ?? []) {
      next[variable] = fields[variable] ?? defaultValues[variable] ?? '';
    }
    setFields((current) => ({ ...next, ...current }));
  }, [template?.id]);

  React.useEffect(() => {
    if (!authMe?.data || feature !== 'content') return;
    const user = authMe.data.user;
    const tenantSettings = (authMe.data.tenant?.settings ?? {}) as Record<string, unknown>;
    setFields((current) => ({
      ...current,
      user_name: current.user_name || user.name,
      specialty:
        current.specialty ||
        String((tenantSettings.ai as Record<string, unknown> | undefined)?.specialty ?? user.name),
      target_audience:
        current.target_audience ||
        String((tenantSettings.ai as Record<string, unknown> | undefined)?.target_audience ?? ''),
      language: current.language || user.preferredLanguage,
    }));
  }, [authMe?.data, feature]);

  React.useEffect(() => {
    if (!lead) return;
    setFields((current) => ({
      ...current,
      lead_name: current.lead_name || lead.name,
      lead_source: current.lead_source || lead.source || '',
      lead_stage: current.lead_stage || lead.pipelineStage,
      lead_score: current.lead_score || String(lead.score),
      lead_notes:
        current.lead_notes ||
        [...(lead.notes?.map((note) => note.content) ?? [])].filter(Boolean).join('\n'),
    }));
  }, [lead?.id]);

  React.useEffect(() => {
    if (contentStream.streamText) setOutputDraft(contentStream.streamText);
  }, [contentStream.streamText]);

  React.useEffect(() => {
    if (whatsappReply.replies.length > 0) setOutputDraft(JSON.stringify(whatsappReply.replies, null, 2));
  }, [whatsappReply.replies]);

  React.useEffect(() => {
    if (leadAnalysis.analysis) setOutputDraft(JSON.stringify(leadAnalysis.analysis, null, 2));
  }, [leadAnalysis.analysis]);

  const variables = template?.variables ?? [];
  const userInputVars = variables.filter(
    (name) => !['user_name', 'specialty', 'target_audience', 'lead_name', 'lead_source', 'lead_stage', 'lead_score', 'lead_notes'].includes(name),
  );

  const canGenerate =
    feature === 'content'
      ? Boolean(fields.topic?.trim())
      : feature === 'whatsapp_reply'
        ? Boolean(selectedLeadId && fields.message_context?.trim())
        : Boolean(selectedLeadId);

  const outputText = outputDraft || contentStream.streamText;
  const isLoading =
    feature === 'content'
      ? contentStream.isStreaming
      : feature === 'whatsapp_reply'
        ? whatsappReply.isLoading
        : leadAnalysis.isLoading;

  const resolvedLead = lead ?? null;

  async function handleGenerate() {
    if (!template) return;

    if (feature === 'content') {
      await contentStream.startStream({
        templateId: template.id,
        topic: fields.topic ?? '',
        platform: fields.platform as ContentGenerateInput['platform'],
        tone: fields.tone as ContentGenerateInput['tone'],
        language: fields.language as ContentGenerateInput['language'],
        additionalContext: fields.additional_context,
      });
      setEditingOutput(false);
      onGenerated?.(undefined);
      return;
    }

    if (feature === 'whatsapp_reply') {
      const result = await whatsappReply.suggest({
        leadId: selectedLeadId,
        messageContext: fields.message_context ?? '',
        language: fields.language as 'zh' | 'en' | 'ms' | undefined,
      });
      setOutputDraft(JSON.stringify(result.data.replies, null, 2));
      onGenerated?.(result.data);
      return;
    }

    const result = await leadAnalysis.analyze({
      leadId: selectedLeadId,
      language: fields.language as 'zh' | 'en' | 'ms' | undefined,
    });
    setOutputDraft(JSON.stringify(result.data, null, 2));
    onGenerated?.(result.data);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(outputText || '');
  }

  async function handleSaveDraft() {
    if (!outputText) return;
    await saveContent.mutateAsync({
      content: outputText,
      platform: feature === 'content' ? (fields.platform || 'facebook') : 'whatsapp',
      title: template?.name ?? t('untitled'),
      status: 'draft',
      language: (fields.language as 'zh' | 'en' | 'ms') ?? authMe?.data?.user.preferredLanguage ?? 'zh',
      promptUsed: template?.prompt ?? '',
    });
  }

  async function handleSendWhatsApp(replyText: string) {
    if (!resolvedLead?.phone) return;
    const cleanPhone = resolvedLead.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(replyText)}`, '_blank', 'noopener,noreferrer');
    await fetch(`/api/v1/crm/leads/${resolvedLead.id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'whatsapp',
        description: `AI 回复建议发送`,
        metadata: { source: 'ai_tools_page' },
      }),
    });
  }

  async function handleSetFollowup(days: number) {
    if (!resolvedLead?.id) return;
    const followup = new Date();
    followup.setDate(followup.getDate() + days);
    await fetch(`/api/v1/crm/leads/${resolvedLead.id}/followup`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ next_followup: followup.toISOString() }),
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              {feature === 'content'
                ? t('contentGenerator')
                : feature === 'whatsapp_reply'
                  ? t('whatsappReply')
                  : t('leadAnalysis')}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              {feature === 'content'
                ? t('contentHelp')
                : feature === 'whatsapp_reply'
                  ? t('whatsappHelp')
                  : t('analysisHelp')}
            </p>
          </div>

          <div className="min-w-[220px]">
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">{t('template')}</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {templatesLoading && <option>{common('loading')}</option>}
              {templates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.isDefault ? `(${t('defaultTemplate')})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {feature === 'whatsapp_reply' && !leadId && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--color-text)]">{t('lead')}</label>
                <Input
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  type="search"
                  placeholder={t('leadSearchPlaceholder')}
                />
                {leadSearch && (
                  <div className="max-h-48 overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
                    {leadOptions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedLeadId(item.id)}
                        className="flex w-full items-center justify-between gap-3 border-b border-[var(--color-border)] px-3 py-2 text-left last:border-b-0 hover:bg-[var(--color-surface)]"
                      >
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text)]">{item.name}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{item.pipelineStage}</p>
                        </div>
                        <Badge variant="info">{item.score}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {feature === 'lead_analysis' && !leadId && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--color-text)]">{t('lead')}</label>
                <Input
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  type="search"
                  placeholder={t('leadSearchPlaceholder')}
                />
                {leadSearch && (
                  <div className="max-h-48 overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
                    {leadOptions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedLeadId(item.id)}
                        className="flex w-full items-center justify-between gap-3 border-b border-[var(--color-border)] px-3 py-2 text-left last:border-b-0 hover:bg-[var(--color-surface)]"
                      >
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text)]">{item.name}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{item.pipelineStage}</p>
                        </div>
                        <Badge variant="info">{item.score}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {variables.map((name) => {
              const value = fields[name] ?? '';
              const resolved =
                ['user_name', 'specialty', 'target_audience', 'lead_name', 'lead_source', 'lead_stage', 'lead_score', 'lead_notes'].includes(name) &&
                Boolean(value);

              if (resolved) {
                return (
                  <div key={name} className="space-y-1.5">
                    <p className="text-sm font-medium text-[var(--color-text)]">{fieldLabel(t, name)}</p>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
                      {value}
                    </div>
                  </div>
                );
              }

              if (name === 'topic' || name === 'additional_context' || name === 'message_context') {
                return (
                  <div key={name} className="space-y-1.5">
                    <label className="block text-sm font-medium text-[var(--color-text)]">{fieldLabel(t, name)}</label>
                    <textarea
                      value={value}
                      onChange={(e) => setFields((current) => ({ ...current, [name]: e.target.value }))}
                      rows={name === 'topic' ? 4 : 3}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                );
              }

              if (name === 'platform') {
                return (
                  <div key={name} className="space-y-1.5">
                    <label className="block text-sm font-medium text-[var(--color-text)]">{fieldLabel(t, name)}</label>
                    <select
                      value={value}
                      onChange={(e) => setFields((current) => ({ ...current, [name]: e.target.value }))}
                      className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="xiaohongshu">{t('xhs')}</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                );
              }

              if (name === 'tone') {
                return (
                  <div key={name} className="space-y-1.5">
                    <label className="block text-sm font-medium text-[var(--color-text)]">{fieldLabel(t, name)}</label>
                    <select
                      value={value}
                      onChange={(e) => setFields((current) => ({ ...current, [name]: e.target.value }))}
                      className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      <option value="educational">{t('toneEducational')}</option>
                      <option value="inspirational">{t('toneInspirational')}</option>
                      <option value="personal">{t('tonePersonal')}</option>
                      <option value="professional">{t('toneProfessional')}</option>
                    </select>
                  </div>
                );
              }

              if (name === 'language') {
                return (
                  <div key={name} className="space-y-1.5">
                    <label className="block text-sm font-medium text-[var(--color-text)]">{fieldLabel(t, name)}</label>
                    <select
                      value={value}
                      onChange={(e) => setFields((current) => ({ ...current, [name]: e.target.value }))}
                      className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      <option value="zh">中文</option>
                      <option value="en">English</option>
                      <option value="ms">Bahasa Malaysia</option>
                    </select>
                  </div>
                );
              }

              if (name === 'leadId') {
                return (
                  <div key={name} className="space-y-1.5">
                    <label className="block text-sm font-medium text-[var(--color-text)]">{t('lead')}</label>
                    <Input
                      value={selectedLeadId}
                      onChange={(e) => setSelectedLeadId(e.target.value)}
                      placeholder={t('leadIdPlaceholder')}
                    />
                  </div>
                );
              }

              return (
                <div key={name} className="space-y-1.5">
                  <label className="block text-sm font-medium text-[var(--color-text)]">{fieldLabel(t, name)}</label>
                  <Input
                    value={value}
                    onChange={(e) => setFields((current) => ({ ...current, [name]: e.target.value }))}
                  />
                </div>
              );
            })}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleGenerate}
                loading={isLoading}
                disabled={!canGenerate}
                icon={<Sparkles className="h-4 w-4" />}
              >
                {t('generate')}
              </Button>
              {outputText && (
                <>
                  <Button variant="secondary" onClick={handleCopy} icon={<Copy className="h-4 w-4" />}>
                    {t('copy')}
                  </Button>
                  <Button variant="secondary" onClick={handleSaveDraft} icon={<Save className="h-4 w-4" />}>
                    {t('saveDraft')}
                  </Button>
                  <Button variant="secondary" onClick={() => setEditingOutput((value) => !value)} icon={<Pencil className="h-4 w-4" />}>
                    {t('edit')}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[var(--color-text)]">{t('output')}</p>
              <Badge variant="default">{feature}</Badge>
            </div>

            {editingOutput ? (
              <textarea
                value={outputText}
                onChange={(e) => setOutputDraft(e.target.value)}
                rows={14}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            ) : feature === 'whatsapp_reply' && whatsappReply.replies.length > 0 ? (
              <div className="space-y-3">
                {whatsappReply.replies.map((reply) => (
                  <div key={reply.label} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--color-text)]">{reply.label}</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => navigator.clipboard.writeText(reply.text)} className="text-xs text-[var(--color-primary)] hover:underline">
                          {t('copy')}
                        </button>
                        <button type="button" onClick={() => handleSendWhatsApp(reply.text)} className="text-xs text-[var(--color-primary)] hover:underline" disabled={!resolvedLead?.phone}>
                          {t('sendWhatsApp')}
                        </button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">{reply.text}</p>
                  </div>
                ))}
              </div>
            ) : feature === 'lead_analysis' && leadAnalysis.analysis ? (
              <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4">
                <p className="text-sm text-[var(--color-text)]">{leadAnalysis.analysis.summary}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">{leadAnalysis.analysis.engagement_level}</Badge>
                  <Badge variant="info">{leadAnalysis.analysis.estimated_conversion_likelihood}</Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">{t('nextAction')}</p>
                  <p className="mt-1 text-sm text-[var(--color-text)]">{leadAnalysis.analysis.next_best_action}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">{t('talkingPoints')}</p>
                  <ul className="mt-1 space-y-1 text-sm text-[var(--color-text)]">
                    {leadAnalysis.analysis.talking_points.map((point) => (
                      <li key={point}>• {point}</li>
                    ))}
                  </ul>
                </div>
                {leadAnalysis.analysis.risk_factors.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-muted)]">{t('riskFactors')}</p>
                    <ul className="mt-1 space-y-1 text-sm text-[var(--color-text)]">
                      {leadAnalysis.analysis.risk_factors.map((risk) => (
                        <li key={risk}>• {risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button variant="secondary" onClick={() => handleSetFollowup(leadAnalysis.analysis?.recommended_followup_days ?? 2)}>
                  {t('setFollowup')}
                </Button>
              </div>
            ) : outputText ? (
              <StreamingText text={outputText} streaming={contentStream.isStreaming} />
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">{t('outputEmpty')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
