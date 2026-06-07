'use client';
import { useState } from 'react';
import type { FormSection, FunnelTheme } from '../../types';

type Props = {
  section: FormSection;
  theme: FunnelTheme;
  funnelSlug: string;
  funnelId: string;
  quizResult?: { score: number; title: string };
};

const LABELS: Record<string, string> = { name: '姓名', phone: '电话', email: '电子邮件', whatsapp: 'WhatsApp' };
const TYPES: Record<string, string> = { name: 'text', phone: 'tel', email: 'email', whatsapp: 'tel' };

type State = 'idle' | 'submitting' | 'success' | 'error';

export function PublicFormSection({ section, theme, funnelSlug, funnelId, quizResult }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [redirect, setRedirect] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Track form start
    fetch(`/api/v1/public/funnel/${funnelSlug}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'form_start' }),
    }).catch(() => {});

    setState('submitting');
    try {
      const res = await fetch(`/api/v1/public/funnel/${funnelSlug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          source_funnel_id: funnelId,
          website: '', // honeypot intentionally empty
          ...(quizResult && { quiz_result: quizResult }),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setErrorMsg(json.error?.message ?? '提交失败，请重试'); setState('error'); return; }
      setRedirect(json.data?.whatsapp_redirect ?? '');
      setState('success');
    } catch {
      setErrorMsg('网络错误，请重试');
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-2xl">✅</p>
        <p className="mt-3 text-base font-semibold text-gray-900">{section.success_message}</p>
        {redirect && (
          <a href={redirect} target="_blank" rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: theme.primary_color }}>
            📱 立即通过 WhatsApp 联系
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="px-6 py-10">
      {section.title && <h2 className="mb-5 text-xl font-bold text-center text-gray-900">{section.title}</h2>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot */}
        <input name="website" type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off"
          value="" readOnly />
        {section.fields.map(f => (
          <div key={f}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{LABELS[f]}</label>
            <input
              type={TYPES[f] ?? 'text'}
              required={f === 'name'}
              value={values[f] ?? ''}
              onChange={e => setValues(v => ({ ...v, [f]: e.target.value }))}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder={LABELS[f]}
            />
          </div>
        ))}
        {state === 'error' && <p className="text-sm text-red-600">{errorMsg}</p>}
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="w-full rounded-full py-4 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: theme.primary_color }}
        >
          {state === 'submitting' ? '提交中...' : section.submit_text}
        </button>
      </form>
    </div>
  );
}
