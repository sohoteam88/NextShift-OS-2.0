'use client';
import { Plus, Trash2 } from 'lucide-react';
import type { BenefitsSection } from '../../types';

const ICONS = ['heart', 'target', 'clock', 'star', 'shield', 'zap', 'check', 'sparkles'];
type Props = { value: BenefitsSection; onChange: (v: BenefitsSection) => void };

export function BenefitsEditor({ value, onChange }: Props) {
  const setItem = (i: number, k: string, v: string) => {
    const items = [...value.items];
    items[i] = { ...items[i], [k]: v };
    onChange({ ...value, items });
  };
  const add = () => onChange({ ...value, items: [...value.items, { icon: 'heart', title: '', description: '' }] });
  const remove = (i: number) => onChange({ ...value, items: value.items.filter((_, j) => j !== i) });

  return (
    <div className="space-y-3 py-3">
      <div><p className="mb-1 text-xs font-medium text-gray-600">标题</p>
        <input className={inp} value={value.title} onChange={e => onChange({ ...value, title: e.target.value })} /></div>
      <div>
        <p className="mb-1 text-xs font-medium text-gray-600">优势列表</p>
        <div className="space-y-3">
          {value.items.map((item, i) => (
            <div key={i} className="rounded border border-gray-200 p-2 space-y-2">
              <div className="flex items-center gap-2">
                <select className={`${inp} w-28`} value={item.icon} onChange={e => setItem(i, 'icon', e.target.value)}>
                  {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
                <button onClick={() => remove(i)} className="ml-auto text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
              <input className={inp} placeholder="标题" value={item.title} onChange={e => setItem(i, 'title', e.target.value)} />
              <input className={inp} placeholder="描述" value={item.description} onChange={e => setItem(i, 'description', e.target.value)} />
            </div>
          ))}
          <button onClick={add} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Plus className="h-3.5 w-3.5" />添加优势</button>
        </div>
      </div>
    </div>
  );
}
const inp = 'w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';
