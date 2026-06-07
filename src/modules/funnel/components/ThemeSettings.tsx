'use client';
import type { FunnelTheme } from '../types';

const PRESET_COLORS = ['#2563eb', '#10b981', '#7c3aed', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899', '#111827'];
const BG_OPTIONS = [
  { value: '#ffffff', label: '白色' },
  { value: '#f9fafb', label: '浅灰' },
  { value: '#eff6ff', label: '浅蓝' },
];

type Props = { value: FunnelTheme; onChange: (v: FunnelTheme) => void };

export function ThemeSettings({ value, onChange }: Props) {
  return (
    <div className="space-y-4 py-3">
      <div>
        <p className="mb-2 text-xs font-medium text-gray-600">主色</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => onChange({ ...value, primary_color: c })}
              className={`h-6 w-6 rounded-full transition-transform ${value.primary_color === c ? 'scale-125 ring-2 ring-white ring-offset-1' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={value.primary_color}
            onChange={e => onChange({ ...value, primary_color: e.target.value })}
            className="h-6 w-6 cursor-pointer rounded-full border-0 p-0"
            title="自定义颜色"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-gray-600">背景色</p>
        <div className="flex gap-2">
          {BG_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...value, bg_color: opt.value })}
              className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                value.bg_color === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-gray-600">字体</p>
        <select
          value={value.font}
          onChange={e => onChange({ ...value, font: e.target.value as FunnelTheme['font'] })}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
        >
          <option value="system">系统默认</option>
          <option value="inter">Inter</option>
          <option value="noto-sans-sc">Noto Sans SC（中文）</option>
        </select>
      </div>
    </div>
  );
}
