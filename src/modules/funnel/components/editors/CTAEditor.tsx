'use client';
import type { CTASection } from '../../types';

type Props = { value: CTASection; onChange: (v: CTASection) => void };

export function CTAEditor({ value, onChange }: Props) {
  return (
    <div className="space-y-3 py-3">
      <div><p className="mb-1 text-xs font-medium text-gray-600">主标题</p>
        <input className={inp} value={value.headline} onChange={e => onChange({ ...value, headline: e.target.value })} /></div>
      <div><p className="mb-1 text-xs font-medium text-gray-600">副标题（可选）</p>
        <input className={inp} value={value.subheadline ?? ''} onChange={e => onChange({ ...value, subheadline: e.target.value })} /></div>
      <div><p className="mb-1 text-xs font-medium text-gray-600">按钮文字</p>
        <input className={inp} value={value.button_text} onChange={e => onChange({ ...value, button_text: e.target.value })} /></div>
      <div><p className="mb-1 text-xs font-medium text-gray-600">按钮类型</p>
        <select className={inp} value={value.button_type} onChange={e => onChange({ ...value, button_type: e.target.value as CTASection['button_type'] })}>
          <option value="whatsapp">WhatsApp</option>
          <option value="form">表单</option>
          <option value="link">链接</option>
        </select>
      </div>
      <div><p className="mb-1 text-xs font-medium text-gray-600">按钮目标</p>
        <input className={inp} value={value.button_target} onChange={e => onChange({ ...value, button_target: e.target.value })} /></div>
    </div>
  );
}
const inp = 'w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';
