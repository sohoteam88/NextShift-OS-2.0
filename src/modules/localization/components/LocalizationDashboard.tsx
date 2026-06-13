'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Globe, Languages, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { LocalizationHealth, SupportedLanguage } from '../types';
import { LANGUAGE_PROFILES } from '../languages/profiles';

function useLoc() { return useQuery({ queryKey: ['localization'], queryFn: async () => { const r = await fetch('/api/v1/localization'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: { health: LocalizationHealth; profiles: any } }>; }, staleTime: 60_000 }); }

export function LocalizationDashboard() {
  const router = useRouter(); const q = useLoc(); const d = q.data?.data;

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">Multi-Language Intelligence</h1><p className="text-xs text-gray-500">不是翻译，是本地化。一个品牌，多种语言。</p></div></div>

      {d && (
        <>
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold mb-3">🌐 本地化健康度: {d.health.score}%</h3>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {(Object.entries(d.health.coverage) as [SupportedLanguage, number][]).map(([lang, count]) => (
                <div key={lang} className={cn('rounded-lg p-3 border', count > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50')}>
                  <div className="text-lg">{lang === 'zh-CN' ? '🇨🇳' : lang === 'zh-TW' ? '🇹🇼' : lang === 'ms-MY' ? '🇲🇾' : '🇬🇧'}</div>
                  <div className="font-bold">{lang}</div><div>{count} assets</div>
                </div>
              ))}
            </div>
            {d.health.recommendations.map((r: string, i: number) => <p key={i} className="text-xs text-amber-700 mt-2">💡 {r}</p>)}
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold mb-3">🎭 文化适配档案</h3>
            {Object.values(LANGUAGE_PROFILES).map(p => (
              <div key={p.language} className="mb-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-1"><span className="text-sm font-bold">{p.region}</span><span className="text-xs bg-gray-200 rounded-full px-2 py-0.5">{p.language}</span></div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div><strong>语调:</strong> {p.tone}</div><div><strong>风格:</strong> {p.culturalStyle}</div>
                  <div><strong>CTA偏好:</strong> {p.preferredCTA}</div><div><strong>平台:</strong> {p.platformBehavior}</div>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
