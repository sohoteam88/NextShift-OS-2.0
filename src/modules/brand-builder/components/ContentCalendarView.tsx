'use client';

import * as React from 'react';
import {
  Calendar,
  List,
  LayoutList,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  SkipForward,
  Sparkles,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/cn';

type CalendarItem = {
  id: string;
  date: string;
  pillar: string;
  pillarEmoji: string;
  title: string;
  hook: string | null;
  platform: string;
  format: string;
  status: string;
  contentId: string | null;
  notes: string | null;
};

type ViewMode = 'month' | 'week' | 'list';

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-700',
  drafted: 'bg-amber-100 text-amber-700',
  published: 'bg-green-100 text-green-700',
  skipped: 'bg-gray-100 text-gray-500 line-through',
};

const STATUS_LABELS: Record<string, string> = {
  planned: '计划中',
  drafted: '已起草',
  published: '已发布',
  skipped: '已跳过',
};

const PLATFORM_EMOJI: Record<string, string> = {
  facebook: '📘',
  instagram: '📸',
  tiktok: '🎵',
};

const FORMAT_LABELS: Record<string, string> = {
  short_video: '短视频',
  carousel: '多图',
  photo: '单图',
  story: 'Story',
  live: '直播',
  reel: 'Reel',
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0 = Sunday
  const daysInMonth = getDaysInMonth(year, month);
  const grid: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(year, month, d));
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

function getWeekDays(anchor: Date): Date[] {
  const day = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

type ItemActionsProps = {
  item: CalendarItem;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
};

function ItemActions({ item, onStatusChange, onDelete }: ItemActionsProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded px-1.5 py-0.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
      >
        •••
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-20 min-w-[160px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white shadow-lg py-1">
            {item.status !== 'published' && (
              <button
                type="button"
                onClick={() => { onStatusChange(item.id, 'published'); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              >
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                标记已发布
              </button>
            )}
            {item.status === 'planned' && (
              <button
                type="button"
                onClick={() => { onStatusChange(item.id, 'drafted'); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              >
                <FileText className="h-4 w-4 text-amber-600" />
                标记已起草
              </button>
            )}
            {item.status !== 'skipped' && item.status !== 'published' && (
              <button
                type="button"
                onClick={() => { onStatusChange(item.id, 'skipped'); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              >
                <SkipForward className="h-4 w-4 text-gray-500" />
                跳过
              </button>
            )}
            <button
              type="button"
              onClick={() => { onDelete(item.id); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              删除
            </button>
          </div>
        </>
      )}
    </div>
  );
}

type Props = {
  initialItems: CalendarItem[];
  hasProfile: boolean;
};

export function ContentCalendarView({ initialItems, hasProfile }: Props) {
  const [items, setItems] = React.useState<CalendarItem[]>(initialItems);
  const [view, setView] = React.useState<ViewMode>('month');
  const [cursor, setCursor] = React.useState(new Date());
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/brand-builder/calendar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 30 }),
      });
      const json = (await res.json()) as { data?: CalendarItem[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Generation failed');
      setItems(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generating calendar');
    } finally {
      setGenerating(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/v1/brand-builder/calendar/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/v1/brand-builder/calendar/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  }

  const published = items.filter((i) => i.status === 'published').length;
  const total = items.length;

  return (
    <div className="space-y-5">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5">
          {(['month', 'week', 'list'] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors',
                view === v
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )}
            >
              {v === 'month' && <Calendar className="h-4 w-4" />}
              {v === 'week' && <LayoutList className="h-4 w-4" />}
              {v === 'list' && <List className="h-4 w-4" />}
              {v === 'month' ? '月' : v === 'week' ? '周' : '表'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {total > 0 && (
            <span className="text-sm text-[var(--color-text-muted)]">
              已发布 {published}/{total}
            </span>
          )}
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={generating || !hasProfile}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : items.length > 0 ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? 'AI 生成中...' : items.length > 0 ? '重新生成' : 'AI 生成日历'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!hasProfile && (
        <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          请先完成品牌建设问卷，AI 才能生成个性化内容日历。
        </div>
      )}

      {items.length === 0 && !generating && hasProfile && (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] py-16 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-[var(--color-text-muted)]" />
          <p className="mt-3 font-medium text-[var(--color-text)]">还没有内容日历</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">点击「AI 生成日历」创建 30 天内容计划</p>
        </div>
      )}

      {items.length > 0 && view === 'month' && (
        <MonthView
          items={items}
          cursor={cursor}
          setCursor={setCursor}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}

      {items.length > 0 && view === 'week' && (
        <WeekView
          items={items}
          cursor={cursor}
          setCursor={setCursor}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}

      {items.length > 0 && view === 'list' && (
        <ListView
          items={items}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

// ---- MONTH VIEW ----

function MonthView({
  items,
  cursor,
  setCursor,
  onStatusChange,
  onDelete,
}: {
  items: CalendarItem[];
  cursor: Date;
  setCursor: (d: Date) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [selected, setSelected] = React.useState<Date | null>(null);
  const grid = getMonthGrid(cursor.getFullYear(), cursor.getMonth());
  const today = new Date();

  const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

  function prevMonth() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  }

  function itemsForDay(day: Date) {
    return items.filter((item) => isSameDay(new Date(item.date), day));
  }

  const selectedItems = selected ? itemsForDay(selected) : [];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="rounded p-1 hover:bg-[var(--color-surface)]">
          <ChevronLeft className="h-5 w-5 text-[var(--color-text-muted)]" />
        </button>
        <span className="text-sm font-semibold text-[var(--color-text)]">
          {cursor.getFullYear()} 年 {MONTH_NAMES[cursor.getMonth()]}
        </span>
        <button type="button" onClick={nextMonth} className="rounded p-1 hover:bg-[var(--color-surface)]">
          <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-1 text-xs font-medium text-[var(--color-text-muted)]">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-[var(--color-border)]">
        {grid.map((day, idx) => {
          if (!day) return <div key={idx} className="bg-[var(--color-surface)] min-h-[72px]" />;
          const dayItems = itemsForDay(day);
          const isToday = isSameDay(day, today);
          const isSelected = selected && isSameDay(day, selected);
          return (
            <div
              key={idx}
              onClick={() => setSelected(isSelected ? null : day)}
              className={cn(
                'min-h-[72px] cursor-pointer bg-white p-1.5 hover:bg-blue-50/50 transition-colors',
                isSelected && 'bg-blue-50',
              )}
            >
              <div className={cn(
                'mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                isToday ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]',
              )}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayItems.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'truncate rounded px-1 py-0.5 text-[10px] leading-tight',
                      STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {item.pillarEmoji} {item.title}
                  </div>
                ))}
                {dayItems.length > 2 && (
                  <div className="text-[10px] text-[var(--color-text-muted)]">+{dayItems.length - 2}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selected && selectedItems.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm space-y-3">
          <h4 className="text-sm font-semibold text-[var(--color-text)]">
            {selected.getMonth() + 1} 月 {selected.getDate()} 日
          </h4>
          {selectedItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- WEEK VIEW ----

function WeekView({
  items,
  cursor,
  setCursor,
  onStatusChange,
  onDelete,
}: {
  items: CalendarItem[];
  cursor: Date;
  setCursor: (d: Date) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const days = getWeekDays(cursor);
  const today = new Date();

  function prevWeek() {
    const d = new Date(cursor);
    d.setDate(d.getDate() - 7);
    setCursor(d);
  }
  function nextWeek() {
    const d = new Date(cursor);
    d.setDate(d.getDate() + 7);
    setCursor(d);
  }

  const DAY_NAMES_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={prevWeek} className="rounded p-1 hover:bg-[var(--color-surface)]">
          <ChevronLeft className="h-5 w-5 text-[var(--color-text-muted)]" />
        </button>
        <span className="text-sm font-semibold text-[var(--color-text)]">
          {days[0]!.getMonth() + 1}/{days[0]!.getDate()} – {days[6]!.getMonth() + 1}/{days[6]!.getDate()}
        </span>
        <button type="button" onClick={nextWeek} className="rounded p-1 hover:bg-[var(--color-surface)]">
          <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
        </button>
      </div>

      {days.map((day) => {
        const dayItems = items.filter((item) => isSameDay(new Date(item.date), day));
        const isToday = isSameDay(day, today);
        return (
          <div key={day.toISOString()} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white">
            <div className={cn(
              'flex items-center gap-2 rounded-t-[var(--radius-md)] border-b border-[var(--color-border)] px-4 py-2',
              isToday ? 'bg-blue-50' : 'bg-[var(--color-surface)]',
            )}>
              <span className={cn(
                'text-sm font-medium',
                isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]',
              )}>
                {DAY_NAMES_SHORT[day.getDay()]} {day.getMonth() + 1}/{day.getDate()}
              </span>
              {isToday && <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs text-white">今天</span>}
              {dayItems.length > 0 && (
                <span className="ml-auto text-xs text-[var(--color-text-muted)]">{dayItems.length} 条</span>
              )}
            </div>
            {dayItems.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[var(--color-text-muted)]">休息日</div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {dayItems.map((item) => (
                  <ItemCard key={item.id} item={item} onStatusChange={onStatusChange} onDelete={onDelete} compact />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- LIST VIEW ----

function ListView({
  items,
  onStatusChange,
  onDelete,
}: {
  items: CalendarItem[];
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [filter, setFilter] = React.useState<string>('all');
  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {['all', 'planned', 'drafted', 'published', 'skipped'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              filter === f
                ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]',
            )}
          >
            {f === 'all' ? `全部 (${items.length})` : `${STATUS_LABELS[f] ?? f} (${items.filter((i) => i.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--color-text-muted)]">日期</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--color-text-muted)]">主题</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-[var(--color-text-muted)] sm:table-cell">平台</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-[var(--color-text-muted)] sm:table-cell">形式</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--color-text-muted)]">状态</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] bg-white">
            {filtered.map((item) => {
              const d = new Date(item.date);
              return (
                <tr key={item.id} className="hover:bg-[var(--color-surface)]">
                  <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-[var(--color-text-muted)]">
                    {d.getMonth() + 1}/{d.getDate()}
                  </td>
                  <td className="max-w-[180px] px-4 py-3">
                    <div className="flex items-start gap-1.5">
                      <span className="text-sm">{item.pillarEmoji}</span>
                      <div>
                        <p className="line-clamp-1 text-sm font-medium text-[var(--color-text)]">{item.title}</p>
                        {item.hook && <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-text-muted)]">{item.hook}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm sm:table-cell">
                    {PLATFORM_EMOJI[item.platform] ?? ''} {item.platform}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-[var(--color-text-muted)] sm:table-cell">
                    {FORMAT_LABELS[item.format] ?? item.format}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={cn(
                      'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                      STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-600',
                    )}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ItemActions item={item} onStatusChange={onStatusChange} onDelete={onDelete} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-[var(--color-text-muted)]">暂无内容</div>
        )}
      </div>
    </div>
  );
}

// ---- ITEM CARD (shared) ----

function ItemCard({
  item,
  onStatusChange,
  onDelete,
  compact = false,
}: {
  item: CalendarItem;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex items-start gap-3', compact ? 'px-4 py-2.5' : 'px-4 py-3')}>
      <span className="mt-0.5 text-xl leading-none">{item.pillarEmoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
            STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-600',
          )}>
            {STATUS_LABELS[item.status] ?? item.status}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {PLATFORM_EMOJI[item.platform] ?? ''} {FORMAT_LABELS[item.format] ?? item.format}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-[var(--color-text)] line-clamp-2">{item.title}</p>
        {!compact && item.hook && (
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)] line-clamp-2">{item.hook}</p>
        )}
        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{item.pillar}</p>
      </div>
      <ItemActions item={item} onStatusChange={onStatusChange} onDelete={onDelete} />
    </div>
  );
}
