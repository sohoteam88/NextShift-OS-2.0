'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Bell, Building2, DollarSign, Loader2, Shield, TrendingUp, UserCheck, UserPlus, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';

interface AdminOverview {
  pendingApprovals: number; activeUsers: number; newUsersThisWeek: number;
  totalTenants: number; aiUsageThisMonth: number; aiCostEstimate: string;
  stuckUsers: number; systemAlerts: string[];
  tenantHealth: { id: string; name: string; score: number; activeUsers: number; stuckUsers: number; status: string }[];
  recentActions: { action: string; target: string; time: string }[];
}

function useAdmin() { return useQuery({ queryKey: ['admin-command'], queryFn: async () => { const r = await fetch('/api/v1/admin-command'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: AdminOverview }>; }, staleTime: 30_000 }); }

export function AdminCommandDashboard() {
  const router = useRouter(); const q = useAdmin();
  const d = q.data?.data;

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">Admin Command Center</h1><p className="text-xs text-gray-500">不是后台管理，是运营指挥中心。</p></div></div>
      </div>

      {d && (
        <>
          {/* Alerts */}
          {d.systemAlerts.length > 0 && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-5 w-5 text-red-600" /><span className="text-sm font-bold text-red-700">系统警报</span></div>
              {d.systemAlerts.map((a,i) => <p key={i} className="text-sm text-red-700">⚠️ {a}</p>)}
            </div>
          )}

          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat icon={UserCheck} label="待审批" value={d.pendingApprovals} color="text-red-600" bg="bg-red-50" onClick={() => router.push('/admin/approvals')} />
            <Stat icon={Users} label="活跃用户" value={d.activeUsers} color="text-blue-600" bg="bg-blue-50" onClick={() => router.push('/admin/users')} />
            <Stat icon={UserPlus} label="本周新增" value={d.newUsersThisWeek} color="text-emerald-600" bg="bg-emerald-50" />
            <Stat icon={Building2} label="租户" value={d.totalTenants} color="text-purple-600" bg="bg-purple-50" />
          </div>

          {/* AI Usage + Stuck */}
          <div className="grid gap-4 sm:grid-cols-2">
            <S title="🤖 AI 用量 (本月)">
              <p className="text-lg font-bold">{(d.aiUsageThisMonth / 1000).toFixed(1)}K tokens</p>
              <p className="text-sm text-gray-500">预估成本: {d.aiCostEstimate}</p>
            </S>
            <S title="⏳ 卡住用户 (7天+未活动)">
              <p className={cn('text-lg font-bold', d.stuckUsers > 5 ? 'text-red-600' : 'text-emerald-600')}>{d.stuckUsers}</p>
              {d.stuckUsers > 0 && <p className="text-xs text-red-500">建议发送鼓励消息或直接跟进。</p>}
            </S>
          </div>

          {/* Tenant Health */}
          <S title="🏥 租户健康度">
            {d.tenantHealth.length === 0 ? <p className="text-sm text-gray-500">暂无租户</p> :
              <div className="space-y-2">
                {d.tenantHealth.slice(0, 10).map(t => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                    <div><span className="font-bold">{t.name}</span><span className="text-xs text-gray-500 ml-2">{t.status}</span></div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{t.activeUsers}活跃 | {t.stuckUsers}卡住</span>
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', t.score >= 70 ? 'bg-emerald-100 text-emerald-700' : t.score >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>{t.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            }
          </S>

          {/* Quick Actions */}
          <S title="⚡ 快速操作">
            <div className="flex flex-wrap gap-2">
              {[{label:'用户审批',href:'/admin/approvals'},{label:'用户管理',href:'/admin/users'},{label:'设置',href:'/admin/settings'},{label:'培训',href:'/admin/training'},{label:'每日任务',href:'/admin/daily-actions'},{label:'模板',href:'/admin/templates'}].map(a => (
                <button key={a.href} onClick={() => router.push(a.href)} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold hover:bg-blue-100 hover:text-blue-700 transition-colors">{a.label}</button>
              ))}
            </div>
          </S>

          {/* Recent Actions */}
          <S title="📋 最近操作">
            {d.recentActions.length === 0 ? <p className="text-sm text-gray-500">暂无记录</p> :
              d.recentActions.slice(0, 8).map((a,i) => <div key={i} className="text-sm py-1.5 border-b last:border-0 flex justify-between"><span>{a.action} → {a.target}</span><span className="text-xs text-gray-400">{new Date(a.time).toLocaleString()}</span></div>)
            }
          </S>
        </>
      )}
    </div>
  );
}

function S({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border border-[var(--color-border)] bg-white p-5"><h3 className="text-sm font-bold mb-3">{title}</h3>{children}</section>; }
function Stat({ icon: Icon, label, value, color, bg, onClick }: { icon: any; label: string; value: number; color: string; bg: string; onClick?: () => void }) {
  const className = cn('rounded-xl border border-[var(--color-border)] p-4 text-center transition-shadow', bg, onClick && 'hover:shadow-sm');
  const content = (
    <>
      <Icon className={cn('h-5 w-5 mx-auto mb-1', color)} /><p className="text-2xl font-bold">{value}</p><p className="text-xs text-gray-500">{label}</p>
    </>
  );

  if (!onClick) {
    return <div className={className}>{content}</div>;
  }

  return <button type="button" onClick={onClick} className={cn(className, 'cursor-pointer')}>{content}</button>;
}
