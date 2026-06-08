'use client';
import type { FormSection } from '../../types';

const FIELD_OPTIONS: FormSection['fields'][number][] = ['name', 'phone', 'email', 'whatsapp'];
const LABELS: Record<string, string> = { name: '姓名', phone: '电话', email: '邮箱', whatsapp: 'WhatsApp' };
type Props = { value: FormSection; onChange: (v: FormSection) => void };

export function FormEditor({ value, onChange }: Props) {
  const toggleField = (f: FormSection['fields'][number]) => {
    const fields = value.fields.includes(f)
      ? value.fields.filter(x => x !== f)
      : [...value.fields, f];
    onChange({ ...value, fields });
  };

  return (
    <div className="space-y-3 py-3">
      <div><p className="mb-1 text-xs font-medium text-gray-600">标题（可选）</p>
        <input className={inp} value={value.title ?? ''} onChange={e => onChange({ ...value, title: e.target.value })} /></div>
      <div>
        <p className="mb-2 text-xs font-medium text-gray-600">表单字段</p>
        <div className="flex flex-wrap gap-2">
          {FIELD_OPTIONS.map(f => (
            <label key={f} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" checked={value.fields.includes(f)} onChange={() => toggleField(f)} className="rounded" />
              {LABELS[f]}
            </label>
          ))}
        </div>
      </div>
      <div><p className="mb-1 text-xs font-medium text-gray-600">提交按钮文字</p>
        <input className={inp} value={value.submit_text} onChange={e => onChange({ ...value, submit_text: e.target.value })} /></div>
      <div><p className="mb-1 text-xs font-medium text-gray-600">成功提示语</p>
        <textarea className={inp} rows={2} value={value.success_message} onChange={e => onChange({ ...value, success_message: e.target.value })} /></div>
      <div><p className="mb-1 text-xs font-medium text-gray-600">提交后跳转 WhatsApp（可选）</p>
        <input className={inp} placeholder="+60123456789" value={value.whatsapp_redirect ?? ''} onChange={e => onChange({ ...value, whatsapp_redirect: e.target.value })} /></div>
    </div>
  );
}
const inp = 'w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';
