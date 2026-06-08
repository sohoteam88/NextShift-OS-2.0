'use client';
import { Plus, Trash2 } from 'lucide-react';
import type { FAQSection } from '../../types';

type Props = { value: FAQSection; onChange: (v: FAQSection) => void };

export function FAQEditor({ value, onChange }: Props) {
  const setItem = (i: number, k: 'question' | 'answer', v: string) => {
    const items = [...value.items];
    items[i] = { ...items[i], [k]: v };
    onChange({ ...value, items });
  };
  const add = () => onChange({ ...value, items: [...value.items, { question: '', answer: '' }] });
  const remove = (i: number) => onChange({ ...value, items: value.items.filter((_, j) => j !== i) });

  return (
    <div className="space-y-3 py-3">
      <div><p className="mb-1 text-xs font-medium text-gray-600">标题</p>
        <input className={inp} value={value.title} onChange={e => onChange({ ...value, title: e.target.value })} /></div>
      <div>
        <p className="mb-1 text-xs font-medium text-gray-600">FAQ 列表</p>
        <div className="space-y-3">
          {value.items.map((item, i) => (
            <div key={i} className="rounded border border-gray-200 p-2 space-y-2">
              <div className="flex items-center gap-2">
                <input className={inp} placeholder="问题" value={item.question} onChange={e => setItem(i, 'question', e.target.value)} />
                <button onClick={() => remove(i)} className="text-red-400 shrink-0"><Trash2 className="h-4 w-4" /></button>
              </div>
              <textarea className={inp} rows={2} placeholder="答案" value={item.answer} onChange={e => setItem(i, 'answer', e.target.value)} />
            </div>
          ))}
          <button onClick={add} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Plus className="h-3.5 w-3.5" />添加 FAQ</button>
        </div>
      </div>
    </div>
  );
}
const inp = 'w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';
