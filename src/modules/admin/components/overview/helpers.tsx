'use client';
import { useLocale } from 'next-intl';
import type { WorkspaceAttention } from '@/modules/admin/services/workspaceHealthService';

export function useFormatters() {
  const locale = useLocale();
  return {
    formatNumber(value: number) { return new Intl.NumberFormat(locale).format(value); },
    formatCurrency(value: number) { return new Intl.NumberFormat(locale, { style: 'currency', currency: 'MYR' }).format(value); },
    formatDate(value: string) { return new Date(value).toLocaleDateString(locale, { month: 'short', day: 'numeric' }); },
  };
}

export function scoreTone(score: number) {
  if (score > 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
}

export function severityTone(severity: WorkspaceAttention['severity']) {
  if (severity === 'critical') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (severity === 'high') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}
