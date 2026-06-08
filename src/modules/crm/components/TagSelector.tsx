'use client';
import { useState, useRef, useEffect } from 'react';
import { Search, Plus, ChevronDown } from 'lucide-react';
import { TagBadge } from './TagBadge';
import { useTags, useCreateTag, type Tag } from '../hooks/use-tags';
import { cn } from '@/lib/cn';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#06b6d4', '#64748b',
];

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  canCreate?: boolean;
  placeholder?: string;
  className?: string;
};

export function TagSelector({ selectedIds, onChange, canCreate = false, placeholder = '选择标签', className }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useTags();
  const createTag = useCreateTag();
  const allTags = data?.data ?? [];

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = allTags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );
  const selected = allTags.filter((t) => selectedIds.includes(t.id));

  function toggle(tag: Tag) {
    if (selectedIds.includes(tag.id)) {
      onChange(selectedIds.filter((id) => id !== tag.id));
    } else {
      onChange([...selectedIds, tag.id]);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      const res = await createTag.mutateAsync({ name: newName.trim(), color: newColor });
      onChange([...selectedIds, res.data.id]);
      setNewName('');
      setCreating(false);
    } catch {
      // error handled by toast elsewhere
    }
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {selected.map((tag) => (
            <TagBadge
              key={tag.id}
              name={tag.name}
              color={tag.color}
              onRemove={() => toggle(tag)}
            />
          ))}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-muted)] hover:border-gray-400"
      >
        <span>{selected.length === 0 ? placeholder : `${selected.length} 个标签已选`}</span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-40 mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white shadow-lg">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标签..."
              className="flex-1 text-sm focus:outline-none"
            />
          </div>

          {/* Tag list */}
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[var(--color-text-muted)]">没有匹配标签</li>
            ) : (
              filtered.map((tag) => (
                <li
                  key={tag.id}
                  onClick={() => toggle(tag)}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-[var(--color-surface)]"
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={selectedIds.includes(tag.id)}
                    className="h-4 w-4 rounded"
                  />
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                  <span className="text-sm text-[var(--color-text)]">{tag.name}</span>
                </li>
              ))
            )}
          </ul>

          {/* Create new tag */}
          {canCreate && (
            <div className="border-t border-[var(--color-border)] p-2">
              {!creating ? (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-[var(--color-primary)] hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4" />
                  创建新标签
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={cn(
                          'h-5 w-5 rounded-full transition-transform',
                          newColor === c && 'scale-125 ring-2 ring-white ring-offset-1',
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="标签名称"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                      className="flex-1 rounded border border-[var(--color-border)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={createTag.isPending}
                      className="rounded bg-[var(--color-primary)] px-2 py-1 text-xs text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                    >
                      添加
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
