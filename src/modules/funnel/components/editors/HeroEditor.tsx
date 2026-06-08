'use client';
import type { HeroSection } from '../../types';

type Props = { value: HeroSection; onChange: (v: HeroSection) => void };

export function HeroEditor({ value, onChange }: Props) {
  const set = <K extends keyof HeroSection>(k: K, v: HeroSection[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3 py-3">
      <Field label="标题"><input className={input} value={value.headline} onChange={e => set('headline', e.target.value)} /></Field>
      <Field label="副标题"><textarea className={input} rows={2} value={value.subheadline} onChange={e => set('subheadline', e.target.value)} /></Field>
      <Field label="按钮文字"><input className={input} value={value.cta_text} onChange={e => set('cta_text', e.target.value)} /></Field>
      <Field label="按钮类型">
        <select className={input} value={value.cta_type} onChange={e => set('cta_type', e.target.value as HeroSection['cta_type'])}>
          <option value="whatsapp">WhatsApp</option>
          <option value="form">表单</option>
          <option value="link">链接</option>
        </select>
      </Field>
      <Field label="按钮目标（电话/URL）"><input className={input} value={value.cta_target} onChange={e => set('cta_target', e.target.value)} /></Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="mb-1 text-xs font-medium text-gray-600">{label}</p>{children}</div>;
}
const input = 'w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';
