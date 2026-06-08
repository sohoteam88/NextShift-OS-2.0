'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MessageCircle, ClipboardList, Sparkles, Copy, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ScoreBadge } from '@/modules/crm/components/ScoreBadge';
import { ScoreBreakdown } from '@/modules/crm/components/ScoreBreakdown';
import { LeadInfoCard } from '@/modules/crm/components/LeadInfoCard';
import { ActivityTimeline } from '@/modules/crm/components/ActivityTimeline';
import { AddNoteForm } from '@/modules/crm/components/AddNoteForm';
import { FollowupDatePicker } from '@/modules/crm/components/FollowupDatePicker';
import { LogActivityDialog } from '@/modules/crm/components/LogActivityDialog';
import { WhatsAppButton } from '@/modules/crm/components/WhatsAppButton';
import { useLead, type ScoringReason } from '@/modules/crm/hooks/use-leads';
import { ToastContainer } from '@/components/ui/Toast';
import { useWhatsAppReply } from '@/modules/ai/hooks/use-whatsapp-reply';
import { useLeadAnalysis } from '@/modules/ai/hooks/use-lead-analysis';
import { useToast } from '@/stores/toast-store';
import { useApiError } from '@/hooks/useApiError';
import { useQueryClient } from '@tanstack/react-query';

const TABS = ['活动', '备注', '信息'] as const;
type Tab = (typeof TABS)[number];

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { handleError } = useApiError();
  const { data, isLoading } = useLead(id);
  const [tab, setTab] = useState<Tab>('活动');
  const [logOpen, setLogOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [messageContext, setMessageContext] = useState('');
  const lead = data?.data;
  const whatsappReply = useWhatsAppReply();
  const leadAnalysis = useLeadAnalysis();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="py-20 text-center">
        <p className="text-[var(--color-text-muted)]">客户不存在</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/crm')}>返回列表</Button>
      </div>
    );
  }

  const leadData = lead;

  async function handleGenerateReplies() {
    try {
      await whatsappReply.suggest({
        leadId: id,
        messageContext,
      });
      setReplyOpen(true);
    } catch (error) {
      handleError(error);
    }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    toast('success', '已复制');
  }

  async function handleSendReply(label: string, text: string) {
    if (!leadData.phone) return;
    const cleanPhone = leadData.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');

    await fetch(`/api/v1/crm/leads/${id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'whatsapp',
        description: `通过 AI WhatsApp 建议发送：${label}`,
        metadata: {
          source: 'ai_reply_suggestion',
          reply_label: label,
        },
      }),
    });

    qc.invalidateQueries({ queryKey: ['lead', id] });
    qc.invalidateQueries({ queryKey: ['followup-counts'] });
    toast('success', '已打开 WhatsApp 并记录活动');
  }

  async function handleAnalyzeLead() {
    try {
      await leadAnalysis.analyze({ leadId: id });
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <>
      <ToastContainer />
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            onClick={() => router.push('/crm')}
            className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{leadData.name}</h1>
          <ScoreBadge score={leadData.score} />
          <span className="rounded-[var(--radius-full)] bg-[var(--color-surface)] px-2.5 py-0.5 text-xs text-[var(--color-text-muted)]">
            {leadData.pipelineStage}
          </span>
        </div>

        {/* Body */}
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Left: tabs + content */}
          <div className="space-y-4 lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)]">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors ${
                    tab === t
                      ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
              {tab === '活动' && (
                <ActivityTimeline activities={leadData.activities} />
              )}
              {tab === '备注' && (
                <div className="space-y-5">
                  <AddNoteForm leadId={id} />
                  {leadData.notes.length > 0 && (
                    <div className="divide-y divide-[var(--color-border)]">
                      {leadData.notes.map((note) => (
                        <div key={note.id} className="py-3">
                          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                            <span className="font-medium text-[var(--color-text)]">{note.user.name}</span>
                            <span>·</span>
                            <span>{new Date(note.createdAt).toLocaleDateString('zh-CN')}</span>
                          </div>
                          <p className="mt-1 text-sm text-[var(--color-text)]">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {tab === '信息' && <LeadInfoCard lead={leadData} />}
            </div>
          </div>

          {/* Right: quick actions + followup + score */}
          <div className="space-y-4">
            <FollowupDatePicker
              leadId={id}
              current={leadData.nextFollowup as string | undefined}
            />
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">快捷操作</h3>
              <div className="space-y-2">
                <WhatsAppButton
                  leadId={id}
                  phone={leadData.phone}
                  leadName={leadData.name}
                  size="sm"
                  className="w-full justify-start"
                />
                {leadData.phone && (
                  <a href={`tel:${leadData.phone}`}>
                    <Button variant="secondary" size="sm" className="w-full justify-start" icon={<Phone className="h-4 w-4" />}>
                      拨打电话
                    </Button>
                  </a>
                )}
                <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => setTab('备注')}>
                  添加备注
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  icon={<ClipboardList className="h-4 w-4" />}
                  onClick={() => setLogOpen(true)}
                >
                  记录活动
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  icon={<Sparkles className="h-4 w-4" />}
                  onClick={() => setReplyOpen((current) => !current)}
                >
                  AI 回复建议
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  icon={<Sparkles className="h-4 w-4" />}
                  onClick={() => router.push(`/ai?tool=whatsapp_reply&leadId=${id}`)}
                >
                  AI 回复
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  icon={<Sparkles className="h-4 w-4" />}
                  onClick={() => router.push(`/ai?tool=lead_analysis&leadId=${id}`)}
                >
                  AI 分析
                </Button>
                </div>

              {replyOpen && (
                <div className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
                      输入客户消息或对话内容
                    </label>
                    <textarea
                      value={messageContext}
                      onChange={(e) => setMessageContext(e.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      placeholder="粘贴客户发来的消息，或者简单描述对话上下文..."
                    />
                  </div>
                  <Button
                    onClick={handleGenerateReplies}
                    loading={whatsappReply.isLoading}
                    disabled={!messageContext.trim()}
                    className="w-full"
                    icon={<Sparkles className="h-4 w-4" />}
                  >
                    生成建议
                  </Button>
                  {whatsappReply.replies.length > 0 && (
                    <div className="space-y-3">
                      {whatsappReply.replies.map((reply, index) => (
                        <div key={`${reply.label}-${index}`} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-[var(--color-text-muted)]">{reply.label}</p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopy(reply.text)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                复制
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSendReply(reply.label, reply.text)}
                                disabled={!leadData.phone}
                                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Send className="h-3.5 w-3.5" />
                                发送 WhatsApp
                              </button>
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {whatsappReply.error && (
                    <p className="text-xs text-red-600">{whatsappReply.error.message}</p>
                  )}
                </div>
              )}
            </div>

            <ScoreBreakdown
              score={leadData.score}
              reasons={(leadData.scoreReasons ?? []) as ScoringReason[]}
            />

            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">AI 分析</h3>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleAnalyzeLead}
                  loading={leadAnalysis.isLoading}
                  icon={leadAnalysis.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                >
                  生成分析
                </Button>
              </div>

              {leadAnalysis.analysis ? (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">简介</p>
                    <p className="leading-6 text-[var(--color-text)]">{leadAnalysis.analysis.summary}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2">
                      <span className="text-[var(--color-text-muted)]">参与度</span>
                      <div className="mt-1 font-semibold capitalize">{leadAnalysis.analysis.engagement_level}</div>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2">
                      <span className="text-[var(--color-text-muted)]">转化可能性</span>
                      <div className="mt-1 font-semibold capitalize">{leadAnalysis.analysis.estimated_conversion_likelihood}</div>
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">建议下一步</p>
                    <p className="leading-6 text-[var(--color-text)]">{leadAnalysis.analysis.next_best_action}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">沟通要点</p>
                    <ul className="space-y-1 text-sm text-[var(--color-text)]">
                      {leadAnalysis.analysis.talking_points.map((point) => (
                        <li key={point} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {leadAnalysis.analysis.risk_factors.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">风险</p>
                      <ul className="space-y-1 text-sm text-[var(--color-text)]">
                        {leadAnalysis.analysis.risk_factors.map((risk) => (
                          <li key={risk} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 text-xs text-[var(--color-text-muted)]">
                    建议跟进: {leadAnalysis.analysis.recommended_followup_days} 天内
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">点击生成分析以查看客户洞察。</p>
              )}
            </div>
          </div>
        </div>

        {/* Mobile sticky quick actions */}
        <div className="fixed inset-x-0 bottom-16 z-30 flex gap-2 border-t border-[var(--color-border)] bg-white px-4 py-3 lg:hidden">
          {leadData.phone && (
            <a href={`https://wa.me/${leadData.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="secondary" size="sm" className="w-full" icon={<MessageCircle className="h-4 w-4" />}>
                WhatsApp
              </Button>
            </a>
          )}
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => setTab('备注')}>
            添加备注
          </Button>
        </div>
      </div>

      <LogActivityDialog open={logOpen} onClose={() => setLogOpen(false)} leadId={id} />
    </>
  );
}
