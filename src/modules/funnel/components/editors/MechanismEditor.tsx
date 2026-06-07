'use client';
import type { MechanismSection } from '../../types';

type Props = { value: MechanismSection; onChange: (v: MechanismSection) => void };

export function MechanismEditor({ value, onChange }: Props) {
  return (
    <div className="space-y-3 py-3">
      <div><p className="mb-1 text-xs font-medium text-gray-600">标题</p>
        <input className={inp} value={value.title} onChange={e => onChange({ ...value, title: e.target.value })} /></div>
      <div><p className="mb-1 text-xs font-medium text-gray-600">描述</p>
        <textarea className={inp} rows={3} value={value.description} onChange={e => onChange({ ...value, description: e.target.value })} /></div>
      <div><p className="mb-1 text-xs font-medium text-gray-600">图片 URL（可选）</p>
        <input className={inp} value={value.image_url ?? ''} onChange={e => onChange({ ...value, image_url: e.target.value })} /></div>
    </div>
  );
}
const inp = 'w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';
