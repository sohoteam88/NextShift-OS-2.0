'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, Loader2, Share2, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { FranchiseHealth, TeamMemberSummary, MasterBlueprint, BlueprintAssignment } from '../types';

function useFranchise() { return useQuery({ queryKey: ['franchise'], queryFn: async () => { const r = await fetch('/api/v1/franchise'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: { health: FranchiseHealth; members: TeamMemberSummary[]; blueprints: MasterBlueprint[]; myAssignment: BlueprintAssignment | null } }>; }, staleTime: 60_000 }); }

export function FranchiseDashboard() {
  const router = useRouter(); const q = useFranchise(); const d = q.data?.data;

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">Franchise / Team Replication</h1><p className="text-xs text-gray-500">不是团队管理，是系统复制。Build Once. Replicate Forever.</p></div></div>

      {d && (
        <>
          {/* Franchise Health */}
          <section className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6">
            <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-bold flex items-center gap-2"><Building2 className="h-5 w-5 text-purple-600" />组织健康度</h2><span className={cn('text-3xl font-bold', d.health.score >= 70 ? 'text-emerald-600' : d.health.score >= 40 ? 'text-amber-600' : 'text-red-500')}>{d.health.score}%</span></div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              {[{k:'成员',v:d.health.totalMembers},{k:'活跃',v:d.health.activeMembers},{k:'激活率',v:d.health.activationRate+'%'},{k:'执行率',v:d.health.executionRate+'%'},{k:'Leads',v:d.health.leadGeneration},{k:'内容',v:d.health.contentConsistency+'%'}].map(m => <div key={m.k} className="bg-white rounded-lg p-2 border"><div className="text-gray-400">{m.k}</div><div className="font-bold">{m.v}</div></div>)}
            </div>
            {d.health.recommendations.map((r, i) => <p key={i} className="text-xs text-amber-700 mt-2">💡 {r}</p>)}
          </section>

          {/* My Assignment */}
          {d.myAssignment && (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 mb-2"><Share2 className="h-4 w-4 text-emerald-600" /><span className="text-sm font-bold text-emerald-700">你的蓝图已安装</span></div>
              <p className="text-xs text-emerald-600">Version synced. Status: {d.myAssignment.status}</p>
            </section>
          )}

          {/* Team Members */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold mb-3">👥 团队成员 ({d.members.length})</h3>
            {d.members.length === 0 ? <p className="text-sm text-gray-500">暂无团队成员</p> :
              d.members.map(m => (
                <div key={m.userId} className="flex items-center justify-between py-2.5 border-b last:border-0 text-sm">
                  <div><span className="font-bold">{m.name}</span><span className="text-xs text-gray-500 ml-2">{m.level}</span></div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>进度 {m.missionProgress}%</span><span>{m.leadsGenerated} Leads</span><span>{m.contentPublished} 内容</span>
                  </div>
                </div>
              ))
            }
          </section>

          {/* Blueprints */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold mb-3">📋 主蓝图 ({d.blueprints.length})</h3>
            {d.blueprints.map(bp => (
              <div key={bp.id} className="mb-2 p-3 bg-gray-50 rounded-lg flex items-center justify-between text-sm">
                <div><span className="font-bold">{bp.name}</span><span className="text-xs text-gray-500 ml-2">v{bp.version}</span></div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full', bp.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600')}>{bp.status}</span>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
