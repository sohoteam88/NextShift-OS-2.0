'use client';

import type { CapCutScript } from '../types';

export function CapCutGuideView({ capcut }: { capcut: CapCutScript }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">CapCut 剪辑指南</h2>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">整体节奏：{capcut.overall_pacing}</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">文字样式</h3>
          <div className="space-y-2">
            {capcut.text_styles.map((style) => (
              <div key={style.name} className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 text-sm">
                <p className="font-medium text-[var(--color-text)]">{style.name}</p>
                <p className="text-[var(--color-text-muted)]">{style.usage} · {style.font_suggestion} · {style.color}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">配乐建议</h3>
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 text-sm">
            <p>氛围：{capcut.music_suggestion.mood}</p>
            <p>CapCut 分类：{capcut.music_suggestion.capcut_category}</p>
            <p>BPM：{capcut.music_suggestion.bpm_range}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">逐场景剪辑步骤</h3>
        {capcut.edit_instructions.map((step, index) => (
          <div key={step.scene_number} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
            <p className="font-semibold text-[var(--color-text)]">Scene {step.scene_number} ({step.clip_duration})</p>
            <p className="mt-2 text-sm">文字：{step.text_overlay.content} · {step.text_overlay.style_name}</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">位置：{step.text_overlay.position} · 动画：{step.text_overlay.animation}</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">特效：{step.effects.join('、') || '无'}</p>
            {step.sound_effect ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">音效：{step.sound_effect}</p> : null}
            {capcut.transitions[index] ? <p className="mt-3 text-xs text-[var(--color-primary)]">↓ 转场：{capcut.transitions[index].suggested_transition}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
