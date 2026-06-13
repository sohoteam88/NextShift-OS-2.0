'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Download, Layers, Loader2, Package, Rocket } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { BlueprintDefinition, BlueprintInstallState } from '../types';

function useBP() { return useQuery({ queryKey: ['blueprints'], queryFn: async () => { const r = await fetch('/api/v1/blueprints'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: { available: BlueprintDefinition[]; installed: BlueprintInstallState | null } }>; }, staleTime: 60_000 }); }
function useInstall() { const qc = useQueryClient(); return useMutation({ mutationFn: async (id: string) => { const r = await fetch('/api/v1/blueprints/install', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blueprintId: id }) }); if (!r.ok) throw new Error('Failed'); return r.json(); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['blueprints'] }) }); }

export function BlueprintDashboard() {
  const router = useRouter(); const q = useBP(); const install = useInstall();
  const d = q.data?.data; const available = d?.available ?? []; const installed = d?.installed;

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">Business Blueprints</h1><p className="text-xs text-gray-500">不是模板，是完整商业系统。一键安装。</p></div></div>

      {installed && (
        <section className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><span className="text-sm font-bold text-emerald-700">已安装: {available.find(b => b.id === installed.blueprintId)?.name ?? installed.blueprintId}</span></div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white rounded-lg p-2"><div className="font-bold text-emerald-600">{installed.activatedFunnels.length}</div><div className="text-gray-500">激活漏斗</div></div>
            <div className="bg-white rounded-lg p-2"><div className="font-bold text-emerald-600">{installed.brandDNAGenerated ? '✅' : '⏳'}</div><div className="text-gray-500">Brand DNA</div></div>
            <div className="bg-white rounded-lg p-2"><div className="font-bold text-emerald-600">{installed.status}</div><div className="text-gray-500">状态</div></div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {installed.activatedFunnels.map(f => <button key={f} onClick={() => router.push('/funnel-context')} className="text-xs rounded-lg bg-white px-3 py-1.5 font-semibold border border-emerald-200 hover:bg-emerald-100">{f}</button>)}
          </div>
        </section>
      )}

      {available.map(bp => (
        <section key={bp.id} className="rounded-xl border border-[var(--color-border)] bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Package className="h-5 w-5 text-blue-600" /><div><h3 className="text-sm font-bold">{bp.name}</h3><p className="text-xs text-gray-500">{bp.description}</p></div></div>
            {!installed || installed.blueprintId !== bp.id ? (
              <button onClick={() => install.mutate(bp.id)} disabled={install.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                {install.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}安装
              </button>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-3 text-xs">
            <div><span className="font-semibold">版本:</span> {bp.version}</div>
            <div><span className="font-semibold">分类:</span> {bp.category}</div>
            <div><span className="font-semibold">语言:</span> {bp.supportedLanguages.join(', ')}</div>
          </div>

          <div className="mt-3"><p className="text-xs font-semibold mb-1">包含漏斗:</p>
            <div className="flex flex-wrap gap-1">{bp.supportedFunnels.map(f => <span key={f} className="text-xs bg-blue-50 rounded-full px-2 py-0.5 text-blue-700">{f}</span>)}</div>
          </div>

          <div className="mt-2"><p className="text-xs font-semibold mb-1">Brand DNA 预设:</p>
            <p className="text-xs text-gray-500">{bp.brandDNA.brandPositioning} | {bp.brandDNA.targetAudience} | {bp.brandDNA.contentTone}</p>
          </div>

          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {bp.supportedFunnels.map(f => {
              const fc = bp.funnels[f]; if (!fc) return null;
              return (
                <div key={f} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-bold mb-1">{f}</p>
                  <p className="text-xs">{fc.leadMagnetTitle}</p>
                  <p className="text-xs text-gray-500">CTA: {fc.cta}</p>
                  <div className="mt-1 flex flex-wrap gap-0.5">{fc.contentPillars.slice(0,3).map(p => <span key={p.name} className="text-xs">{p.emoji}</span>)}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span>🤖 自动化: {bp.automationTemplates.length}个模板</span>
            <span>📊 CRM: {Object.keys(bp.crmPipelines).length}条管道</span>
            <span>💬 WhatsApp: {Object.values(bp.whatsappScripts).flat().length}条脚本</span>
          </div>
        </section>
      ))}
    </div>
  );
}
