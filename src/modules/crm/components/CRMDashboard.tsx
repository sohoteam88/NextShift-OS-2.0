'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BarChart3, Bell, Calendar, DollarSign, Loader2, TrendingUp, UserCheck, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { CRMCommandCenter } from '../types';
import { STAGE_LABELS } from '../types';

function useCRM() { return useQuery({ queryKey: ['crm-center'], queryFn: async () => { const r = await fetch('/api/v1/crm-center'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: CRMCommandCenter }>; }, staleTime: 30_000 }); }

function sourceLabel(source: string) {
  if (source === 'assessment') return '评估';
  if (source === 'quiz') return '测验';
  if (source === 'checklist') return '清单';
  if (source === 'webinar') return '线上讲座';
  if (source === 'funnel') return '漏斗页面';
  if (source === 'whatsapp') return '客户对话';
  if (source === 'organic') return '自然流量';
  if (source === 'referral') return '转介绍';
  if (source === 'manual') return '手动添加';
  return source;
}

export function CRMDashboard() {
  const router = useRouter(); const q = useCRM();
  const cc = q.data?.data;

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">客户转化中心</h1><p className="text-xs text-gray-500">不是联系人列表，而是下一步跟进和成交判断。</p></div></div>
        {cc && <div className="flex items-center gap-2"><span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700"><Users className="inline h-3 w-3 mr-1" />{cc.leads.total} 位潜在客户</span></div>}
      </div>

      {cc && (
        <>
          {/* Row 1: Revenue Snapshot + priority follow-ups */}
          <div className="grid gap-4 lg:grid-cols-2">
            <S title="💰 收入快照">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-emerald-50 rounded-lg p-3"><p className="text-xs text-gray-500">预期收入</p><p className="text-xl font-bold text-emerald-700">RM {cc.revenueForecast.expectedRevenue.toLocaleString()}</p></div>
                <div className="bg-amber-50 rounded-lg p-3"><p className="text-xs text-gray-500">保守估计</p><p className="text-xl font-bold text-amber-700">RM {cc.revenueForecast.conservativeRevenue.toLocaleString()}</p></div>
                <div className="bg-blue-50 rounded-lg p-3"><p className="text-xs text-gray-500">乐观估计</p><p className="text-xl font-bold text-blue-700">RM {cc.revenueForecast.optimisticRevenue.toLocaleString()}</p></div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500"><span>管道价值: RM {cc.revenueForecast.pipelineValue.toLocaleString()}</span><span>加权: RM {cc.revenueForecast.weightedValue.toLocaleString()}</span><span>{cc.leads.total > 0 ? '基于当前管道' : '等待客户数据'}</span></div>
            </S>

            <S title="🔥 优先跟进">
              {cc.hotLeads.length === 0 ? <p className="text-sm text-gray-500">暂无需要优先跟进的潜在客户</p> :
                cc.hotLeads.slice(0, 5).map((hl, i) => (
                  <div key={i} className={cn('p-2 rounded-lg mb-1', hl.urgency === 'high' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200')}>
                    <div className="flex items-center justify-between"><span className="text-sm font-bold">{hl.name}</span><span className="text-xs font-bold text-red-600">{hl.score}分</span></div>
                    <p className="text-xs text-gray-500">{hl.reason} → {hl.suggestedAction}</p>
                  </div>
                ))
              }
            </S>
          </div>

          {/* Row 2: Follow-ups + Appointments */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <StatCard icon={Bell} label="今日跟进" value={cc.followups.today} color="text-red-600" />
            <StatCard icon={Bell} label="逾期跟进" value={cc.followups.overdue} color="text-red-600" />
            <StatCard icon={Calendar} label="今日预约" value={cc.appointments.today} color="text-blue-600" />
            <StatCard icon={Calendar} label="本月预约" value={cc.appointments.thisMonth} color="text-blue-600" />
          </div>

          {/* Row 3: Pipeline + Advisor */}
          <div className="grid gap-4 lg:grid-cols-2">
            <S title="📊 管道总览">
              <div className="space-y-1.5">
                {Object.entries(cc.leads.byStage).map(([stage, count]) => (
                  <div key={stage} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{STAGE_LABELS[stage as keyof typeof STAGE_LABELS] ?? stage}</span>
                    <div className="flex items-center gap-2"><div className="h-2 bg-blue-100 rounded-full overflow-hidden w-24"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (count / Math.max(cc.leads.total, 1)) * 100)}%` }} /></div><span className="text-xs font-bold w-6 text-right">{count}</span></div>
                  </div>
                ))}
              </div>
            </S>

            <S title="🤖 CRM 建议">
              {cc.advisorTips.map(tip => (
                <div key={tip.id} className="mb-2 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-bold text-purple-800">{tip.tip}</p>
                  <p className="text-xs text-purple-600 mt-1">👉 {tip.action}</p>
                </div>
              ))}
            </S>
          </div>

          {/* Opportunities */}
          {cc.opportunities.length > 0 && (
            <S title="💼 机会管理">
              {cc.opportunities.map(o => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <div><span className="font-bold">{o.title}</span><span className="text-xs text-gray-500 ml-2">{o.leadName}</span></div>
                  <div className="flex items-center gap-3"><span className="text-xs text-gray-500">{o.stage}</span><span className="font-bold">RM {o.value.toLocaleString()}</span><span className="text-xs text-gray-400">{o.probability}%</span></div>
                </div>
              ))}
            </S>
          )}

          {/* Lead Sources */}
          <S title="📥 潜在客户来源">
            <div className="flex flex-wrap gap-2">
              {Object.entries(cc.leads.bySource).map(([src, count]) => (
                <span key={src} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">{sourceLabel(src)}: {count}</span>
              ))}
            </div>
          </S>
        </>
      )}
    </div>
  );
}

function S({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border border-[var(--color-border)] bg-white p-5"><h3 className="text-sm font-bold mb-3">{title}</h3>{children}</section>; }
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) { return <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 text-center"><Icon className={cn('h-5 w-5 mx-auto mb-1', color)} /><p className="text-2xl font-bold">{value}</p><p className="text-xs text-gray-500">{label}</p></div>; }
