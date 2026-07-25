'use client';

import * as React from 'react';

type Props = {
  field: string;
  label: string;
  whyNow: string;
  placeholder: string;
  initialValue?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  onSaved?: (value: string) => void;
  onSkipped?: () => void;
};

export async function saveJustInTimeField(field: string, value: string) {
  const response = await fetch('/api/v1/brand-builder/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [field]: value.trim() }),
  });
  if (!response.ok) throw new Error('保存失败，请稍后再试');
  return response.json().catch(() => null);
}

export function skipJustInTimeField(onSkipped?: () => void) {
  onSkipped?.();
}

/**
 * A small, non-blocking prompt for information that is useful only at the
 * moment a user needs it. It intentionally updates only the requested field,
 * never Brand DNA provenance.
 */
export function JustInTimeFieldPrompt({
  field,
  label,
  whyNow,
  placeholder,
  initialValue = '',
  inputMode,
  onSaved,
  onSkipped,
}: Props) {
  const [value, setValue] = React.useState(initialValue);
  const [visible, setVisible] = React.useState(!initialValue.trim());
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!visible) return null;

  async function submit() {
    const nextValue = value.trim();
    if (!nextValue) return;
    setSaving(true);
    setError(null);
    try {
      await saveJustInTimeField(field, nextValue);
      setVisible(false);
      onSaved?.(nextValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请稍后再试');
    } finally {
      setSaving(false);
    }
  }

  function skip() {
    setVisible(false);
    skipJustInTimeField(onSkipped);
  }

  return React.createElement(
    'section',
    { className: 'rounded-[var(--radius-lg)] border border-blue-200 bg-blue-50 p-4 shadow-sm' },
    React.createElement('p', { className: 'text-sm font-semibold text-[var(--color-text)]' }, label),
    React.createElement('p', { className: 'mt-1 text-sm leading-6 text-[var(--color-text-muted)]' }, whyNow),
    React.createElement(
      'label',
      { className: 'mt-3 block' },
      React.createElement('span', { className: 'sr-only' }, label),
      React.createElement('input', {
        type: 'text',
        value,
        inputMode,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value),
        placeholder,
        className: 'w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100',
      }),
    ),
    error ? React.createElement('p', { role: 'alert', className: 'mt-2 text-sm text-rose-700' }, error) : null,
    React.createElement(
      'div',
      { className: 'mt-3 flex flex-wrap items-center gap-3' },
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => void submit(),
          disabled: saving || !value.trim(),
          className: 'inline-flex h-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50',
        },
        saving ? '保存中...' : '保存并继续',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: skip, className: 'text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]' },
        '暂时跳过',
      ),
    ),
  );
}
