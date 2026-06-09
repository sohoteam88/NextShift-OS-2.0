'use client';

import * as React from 'react';
import { GripVertical, Camera, Type, Mic } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SceneBlock = {
  time?: string;
  visual: string;
  text_overlay: string;
  voiceover: string;
};

type EditableFieldProps = {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  className?: string;
};

function EditableField({ value, onChange, multiline = false, className }: EditableFieldProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const ref = React.useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  function commit() {
    setEditing(false);
    if (draft.trim() !== value) onChange(draft.trim());
  }

  if (editing) {
    const shared = {
      ref: ref as React.RefObject<HTMLTextAreaElement & HTMLInputElement>,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
        setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        if (!multiline && e.key === 'Enter') { e.preventDefault(); commit(); }
      },
      className: cn(
        'w-full rounded border border-[var(--color-primary)] bg-blue-50/30 px-2 py-1 text-sm text-[var(--color-text)] focus:outline-none',
        className,
      ),
    };
    return multiline ? (
      <textarea {...shared} rows={3} style={{ resize: 'vertical' }} />
    ) : (
      <input type="text" {...shared} />
    );
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      className={cn(
        'cursor-text rounded px-1 text-sm text-[var(--color-text)] hover:bg-blue-50 hover:ring-1 hover:ring-[var(--color-primary)]/40',
        className,
      )}
      title="点击编辑"
    >
      {value || <span className="text-[var(--color-text-muted)] italic">（空）</span>}
    </span>
  );
}

type SceneCardProps = {
  scene: SceneBlock;
  index: number;
  label: string;
  badge?: string;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  onChange: (updated: SceneBlock) => void;
};

export function SceneCard({
  scene,
  index,
  label,
  badge,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragOver,
  onDrop,
  onChange,
}: SceneCardProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? (e) => onDragStart?.(e, index) : undefined}
      onDragOver={draggable ? (e) => { e.preventDefault(); onDragOver?.(e, index); } : undefined}
      onDrop={draggable ? (e) => { e.preventDefault(); onDrop?.(e, index); } : undefined}
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm transition-opacity',
        isDragging && 'opacity-40',
        draggable && 'cursor-grab active:cursor-grabbing',
      )}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 rounded-t-[var(--radius-lg)] border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2">
        {draggable && (
          <GripVertical className="h-4 w-4 flex-shrink-0 text-[var(--color-text-muted)]" />
        )}
        <span className="text-sm font-semibold text-[var(--color-text)]">{label}</span>
        {(badge ?? scene.time) && (
          <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
            {badge ?? scene.time}
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        {/* Visual */}
        <div className="flex items-start gap-2">
          <Camera className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-primary)]" />
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 text-xs font-medium text-[var(--color-text-muted)]">画面</p>
            <EditableField
              value={scene.visual}
              onChange={(v) => onChange({ ...scene, visual: v })}
              multiline
            />
          </div>
        </div>

        {/* Text overlay */}
        <div className="flex items-start gap-2">
          <Type className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 text-xs font-medium text-[var(--color-text-muted)]">字幕</p>
            <EditableField
              value={scene.text_overlay}
              onChange={(v) => onChange({ ...scene, text_overlay: v })}
            />
          </div>
        </div>

        {/* Voiceover */}
        <div className="flex items-start gap-2">
          <Mic className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 text-xs font-medium text-[var(--color-text-muted)]">旁白</p>
            <EditableField
              value={scene.voiceover}
              onChange={(v) => onChange({ ...scene, voiceover: v })}
              multiline
            />
          </div>
        </div>
      </div>
    </div>
  );
}
