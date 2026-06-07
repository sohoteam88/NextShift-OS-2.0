'use client';
import { X } from 'lucide-react';
import type { FunnelSection } from '../types';

const SECTION_TYPES: { type: FunnelSection['type']; emoji: string; label: string; default: () => FunnelSection }[] = [
  { type: 'hero', emoji: '🎯', label: 'Hero', default: () => ({ type: 'hero', headline: '标题', subheadline: '副标题', cta_text: '立即咨询', cta_type: 'whatsapp', cta_target: '' }) },
  { type: 'pain', emoji: '😰', label: '痛点', default: () => ({ type: 'pain', title: '你是否有这些困扰？', items: [{ text: '困扰一' }] }) },
  { type: 'benefits', emoji: '✅', label: '优势', default: () => ({ type: 'benefits', title: '你会获得', items: [{ icon: 'heart', title: '好处一', description: '描述' }] }) },
  { type: 'testimonial', emoji: '💬', label: '评价', default: () => ({ type: 'testimonial', title: '他们的评价', items: [] }) },
  { type: 'mechanism', emoji: '🔧', label: '原理', default: () => ({ type: 'mechanism', title: '为什么选择我们', description: '解释说明...' }) },
  { type: 'faq', emoji: '❓', label: 'FAQ', default: () => ({ type: 'faq', title: '常见问题', items: [{ question: '问题一？', answer: '答案...' }] }) },
  { type: 'form', emoji: '📝', label: '表单', default: () => ({ type: 'form', fields: ['name', 'phone'], submit_text: '立即提交', success_message: '感谢你的提交！' }) },
  { type: 'cta', emoji: '📢', label: 'CTA', default: () => ({ type: 'cta', headline: '立即行动', button_text: '联系我们', button_type: 'whatsapp', button_target: '' }) },
];

type Props = { open: boolean; onClose: () => void; onAdd: (section: FunnelSection) => void };

export function AddSectionDialog({ open, onClose, onAdd }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-[var(--radius-lg)] bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-base font-semibold">添加 Section</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <div className="grid grid-cols-4 gap-3 p-6">
          {SECTION_TYPES.map(({ type, emoji, label, default: def }) => (
            <button
              key={type}
              onClick={() => { onAdd(def()); onClose(); }}
              className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 hover:border-[var(--color-primary)] hover:bg-blue-50 transition-colors"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-medium text-[var(--color-text)]">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
