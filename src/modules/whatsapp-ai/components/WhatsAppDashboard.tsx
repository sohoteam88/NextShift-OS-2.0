'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Loader2, MessageCircle, Phone, Sparkles, Star, UserCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { WhatsAppPackage, ObjectionType } from '../types';
import { getWhatsappAdvisor } from '../whatsappAdvisor';

function useWA() { return useQuery({ queryKey: ['whatsapp-ai'], queryFn: async () => { const r = await fetch('/api/v1/whatsapp-ai'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: WhatsAppPackage | null; crm: any }>; }, staleTime: 30_000 }); }
function useGen() { const qc = useQueryClient(); return useMutation({ mutationFn: async () => { const r = await fetch('/api/v1/whatsapp-ai/generate', { method: 'POST' }); if (!r.ok) throw new Error('Failed'); return r.json(); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp-ai'] }) }); }

export function WhatsAppDashboard() {
  const router = useRouter(); const q = useWA(); const gen = useGen();
  const pkg = q.data?.data ?? null;
  const crm = q.data?.crm;
  const tips = crm ? getWhatsappAdvisor(crm.leads?.map((l: any) => ({ score: l.score })) ?? []) : [];

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">WhatsApp AI 助理</h1><p className="text-xs text-gray-500">AI销售助理，帮你回复、跟进、成交。</p></div></div>
        {crm && <div className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700"><UserCheck className="inline h-3 w-3 mr-1" />{crm.totalLeads} Leads</div>}
      </div>

      {!pkg && (
        <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-8 text-center">
          <MessageCircle className="h-8 w-8 text-emerald-500 mx-auto mb-3" /><h2 className="text-lg font-bold mb-2">激活 WhatsApp AI 助理</h2><p className="text-sm text-gray-500 mb-4">自动生成智能回复、跟进计划、预约流程。</p>
          <button onClick={() => gen.mutate()} disabled={gen.isPending} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{gen.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}生成 AI 助理</button>
        </div>
      )}

      {pkg && (
        <>
          <S title="📊 概览">
            {tips.map((t,i) => <p key={i} className="text-sm text-amber-700">💡 {t}</p>)}
          </S>

          <S title="💬 智能回复">
            {Object.entries(pkg.smartReplies).map(([trigger, replies]) => (
              <div key={trigger} className="mb-3"><p className="text-xs font-bold text-gray-500 uppercase mb-1">触发: &quot;{trigger}&quot;</p>
                {(replies as any[]).map((r, i) => <div key={i} className="bg-gray-50 rounded-lg p-3 mb-1 text-sm"><strong>{r.style}:</strong> {r.text}<br /><span className="text-xs text-gray-400">{r.reason}</span></div>)}
              </div>
            ))}
          </S>

          <S title="🛡️ 异议处理">
            {Object.entries(pkg.objections).map(([type, resp]) => (
              <div key={type} className="mb-3 p-3 bg-gray-50 rounded-lg"><p className="text-xs font-bold mb-1">{type}</p>
                <p className="text-sm"><strong>💚 共情:</strong> {resp.empathyResponse}</p>
                <p className="text-sm"><strong>❓ 澄清:</strong> {resp.clarificationQuestion}</p>
                <p className="text-sm"><strong>💎 价值:</strong> {resp.valueResponse}</p>
                <p className="text-sm"><strong>👉 CTA:</strong> {resp.cta}</p>
              </div>
            ))}
          </S>

          <S title="📅 跟进计划">
            {pkg.followupTemplates.map(f => <div key={f.id} className="text-sm py-2 border-b last:border-0"><strong>Day {f.day}: {f.label}</strong><p className="text-xs text-gray-500">{f.message}</p></div>)}
          </S>

          <S title="📞 预约流程">
            <p className="text-sm mb-2"><strong>邀请:</strong> {pkg.appointment.bookingInvitation}</p>
            <p className="text-sm"><strong>24h提醒:</strong> {pkg.appointment.reminder24h}</p>
            <p className="text-sm"><strong>1h提醒:</strong> {pkg.appointment.reminder1h}</p>
            <p className="text-sm"><strong>改期:</strong> {pkg.appointment.reschedule}</p>
          </S>

          <S title="⭐ 今日最佳跟进 (Top 5)">
            {pkg.bestFollowups.length > 0 ? pkg.bestFollowups.map((bf, i) => (
              <div key={i} className="mb-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between"><span className="text-sm font-bold">{bf.leadName}</span><span className={cn('text-xs font-bold', bf.score==='A'?'text-red-600':bf.score==='B'?'text-amber-600':'text-gray-500')}>{bf.score}级</span></div>
                <p className="text-xs text-gray-500 mt-1">{bf.reason}</p>
                <p className="text-xs text-emerald-600 mt-1">💬 {bf.suggestedMessage}</p>
              </div>
            )) : <p className="text-sm text-gray-500">暂无活跃Lead</p>}
          </S>

          <S title="🎤 语音">
            <p className="text-sm">语音转录: {pkg.voiceConfig.provider} | 状态: {pkg.voiceConfig.enabled ? '✅ 启用' : '❌ 未启用'}</p>
          </S>
        </>
      )}
    </div>
  );
}
function S({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border border-[var(--color-border)] bg-white p-5"><h3 className="text-sm font-bold mb-3">{title}</h3>{children}</section>; }
