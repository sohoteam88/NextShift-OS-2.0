'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  Kanban,
  Loader2,
  MessageCircle,
  Search,
  SlidersHorizontal,
  UserCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/molecules/EmptyState';
import { relativeTime } from '@/lib/relative-time';
import { LeadCard } from '@/modules/crm/components/LeadCard';
import { LeadScoreBadge } from '@/modules/crm/components/LeadScoreBadge';
import { LeadTable } from '@/modules/crm/components/LeadTable';
import { WhatsAppButton } from '@/modules/crm/components/WhatsAppButton';
import { AddLeadDialog } from '@/modules/crm/components/AddLeadDialog';
import { useSetFollowup } from '@/modules/crm/hooks/use-followup';
import { useLeads, type LeadFilters, type LeadRow } from '@/modules/crm/hooks/use-leads';
import { useTags } from '@/modules/crm/hooks/use-tags';
import { cn } from '@/lib/cn';

const STAGES = [
  { value: 'new', label: '新 Leads' },
  { value: '新线索', label: '新线索' },
  { value: '已联系', label: '已联系' },
  { value: '已确认需求', label: '已确认需求' },
  { value: '已预约', label: '已预约' },
  { value: '已转化', label: '已转化' },
  { value: '已流失', label: '已流失' },
] as const;

function isNewStage(stage: string) {
  return ['new', 'new_lead', 'lead', '新线索'].includes(stage);
}

function isOverdue(value?: string | null) {
  return Boolean(value && new Date(value) < new Date());
}

function isDueToday(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
}

function isUnhandledLead(lead: LeadRow) {
  return isNewStage(lead.pipelineStage) && !lead.nextFollowup;
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date;
}

function suggestedMessage(lead: LeadRow) {
  return `Hi ${lead.name}, 我刚收到你的资料。想先了解你现在最想解决的问题是什么？`;
}

function leadActionReason(lead: LeadRow) {
  if (isOverdue(lead.nextFollowup)) return '跟进已经逾期，今天先处理。';
  if (isDueToday(lead.nextFollowup)) return '今天已经到跟进时间。';
  if (isUnhandledLead(lead)) return '新 Lead 还没有设定下一步。';
  if (lead.score >= 70) return '高分 Lead，优先开启对话。';
  return '需要确认需求并安排下一步。';
}

function sortPriority(a: LeadRow, b: LeadRow) {
  const score = (lead: LeadRow) => {
    if (isOverdue(lead.nextFollowup)) return 1000 + lead.score;
    if (isDueToday(lead.nextFollowup)) return 800 + lead.score;
    if (isUnhandledLead(lead)) return 600 + lead.score;
    return lead.score;
  };
  return score(b) - score(a);
}

export default function CrmPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<LeadFilters>({
    page: 1,
    limit: 50,
    sort_by: 'createdAt',
    sort_order: 'desc',
  });
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const leadsQuery = useLeads(filters);
  const tagsQuery = useTags();
  const setFollowup = useSetFollowup();

  useEffect(() => {
    const timeout = setTimeout(
      () => setFilters((current) => ({ ...current, search: search || undefined, page: 1 })),
      300,
    );
    return () => clearTimeout(timeout);
  }, [search]);

  const setFilter = useCallback((key: keyof LeadFilters, value: string | number | undefined) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  }, []);

  const leads = leadsQuery.data?.data ?? [];
  const meta = leadsQuery.data?.meta;
  const allTags = tagsQuery.data?.data ?? [];
  const totalLeads = meta?.total ?? leads.length;

  const leadStats = useMemo(() => {
    const unhandled = leads.filter(isUnhandledLead);
    const overdue = leads.filter((lead) => isOverdue(lead.nextFollowup));
    const dueToday = leads.filter((lead) => isDueToday(lead.nextFollowup));
    const contactable = leads.filter((lead) => Boolean(lead.phone || lead.email));
    const priority = [...leads]
      .filter((lead) => isUnhandledLead(lead) || isOverdue(lead.nextFollowup) || isDueToday(lead.nextFollowup) || lead.score >= 70)
      .sort(sortPriority)
      .slice(0, 4);

    return {
      unhandled,
      overdue,
      dueToday,
      contactable,
      priority,
      actionCount: unhandled.length + overdue.length + dueToday.length,
    };
  }, [leads]);

  const hasLeads = totalLeads > 0;
  const hasWork = leadStats.actionCount > 0;
  const hasContactMethod = leadStats.contactable.length > 0;
  const hasOwnerAssigned = hasLeads && leads.every((lead) => Boolean(lead.owner?.id));
  const readyConditions = [
    hasLeads,
    hasContactMethod,
    hasOwnerAssigned,
    hasWork,
  ].filter(Boolean).length;

  async function scheduleFollowup(leadId: string, days: number) {
    await setFollowup.mutateAsync({ leadId, date: addDays(days) });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-blue-600">AI COO Mission</p>
          <h1 className="mt-1 text-2xl font-bold tracking-normal text-gray-950">处理新 Leads</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            当系统已经有 Leads，但还没有明确跟进动作，COO 会把重点从继续获客切到处理新 Leads，避免线索冷掉或被遗漏。
          </p>
        </div>
        <div className={cn(
          'inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold',
          hasLeads ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700',
        )}>
          <UserCheck className="h-3.5 w-3.5" />
          {hasLeads ? `${totalLeads} 个 Leads` : '等待 Leads'}
        </div>
      </header>

      <section className="rounded-xl border border-blue-100 bg-blue-50 p-5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-blue-700">
              <MessageCircle className="h-4 w-4" />
              COO 判断
            </div>
            <h2 className="mt-3 text-xl font-bold tracking-normal text-gray-950">
              {!hasLeads
                ? '还没有 Leads 可以处理。'
                : hasWork
                  ? '你有 Leads 还没有进入跟进节奏。'
                  : '当前 Leads 已经有跟进安排。'}
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-gray-700">
              <p>
                为什么是这个？因为 Lead 已经进入系统后，最有杠杆的动作不是继续做页面或加流量，而是马上确认需求、记录联系、安排下一次跟进。
              </p>
              <p>
                为什么是现在？新 Lead 的信任和兴趣最热，越晚处理，越难判断他是零售客户、招募对象，还是暂时不适合。
              </p>
              <p>
                为什么不是继续启动更多流量？如果现有 Leads 没被跟进，继续加流量只会制造更多遗漏。
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-blue-100 bg-white p-4">
            <div className="text-xs font-bold uppercase text-gray-500">Recommended Next Action</div>
            <div className="mt-2 text-lg font-bold text-gray-950">
              {hasLeads ? '处理新 Leads' : '先启动流量测试'}
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {hasLeads
                ? '优先处理没有跟进日期、今天到期或已经逾期的 Leads。每个 Lead 至少完成一次联系、一个备注、一个下一步。'
                : '还没有潜在客户进入系统时，应该先让流量进入漏斗。'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  const firstLead = leadStats.priority[0] ?? leads[0];
                  if (firstLead) router.push(`/crm/${firstLead.id}`);
                }}
                disabled={!hasLeads}
                icon={<ArrowRight className="h-4 w-4" />}
              >
                处理第一位 Lead
              </Button>
              {!hasLeads && (
                <Link
                  href="/traffic-engine"
                  className="inline-flex h-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-xs font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)]"
                >
                  回到流量测试
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5 md:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-950">处理条件</h2>
            <p className="mt-1 text-sm text-gray-500">这些条件决定 COO 是否应该推荐“处理新 Leads”。</p>
          </div>
          <div className="text-sm font-bold text-gray-700">{readyConditions} / 4 已满足</div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ConditionRow
            title="已有 Leads 进入系统"
            description="至少有一个潜在客户来自漏斗、流量测试或手动录入。"
            ready={hasLeads}
          />
          <ConditionRow
            title="Lead 有可联系资料"
            description="至少有电话、WhatsApp 或 email，才能推进真实对话。"
            ready={hasContactMethod}
          />
          <ConditionRow
            title="Lead 有负责人"
            description="每个 Lead 都需要明确 owner，避免团队里没人处理。"
            ready={hasOwnerAssigned}
          />
          <ConditionRow
            title="存在待处理动作"
            description="新 Lead、今日跟进或逾期跟进需要优先进入队列。"
            ready={hasWork}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={Users} label="全部 Leads" value={String(totalLeads)} />
        <MetricCard icon={Clock3} label="未安排跟进" value={String(leadStats.unhandled.length)} />
        <MetricCard icon={CalendarClock} label="今日/逾期" value={String(leadStats.dueToday.length + leadStats.overdue.length)} />
        <MetricCard icon={MessageCircle} label="可直接联系" value={String(leadStats.contactable.length)} />
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5 md:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-950">今日处理队列</h2>
            <p className="mt-1 text-sm text-gray-500">先处理没有下一步、今天到期、逾期或高分的 Leads。</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<Kanban className="h-4 w-4" />}
            onClick={() => router.push('/crm/pipeline')}
          >
            打开 Pipeline
          </Button>
        </div>

        {leadsQuery.isLoading ? (
          <div className="mt-5 flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : leadStats.priority.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-600" />
            <h3 className="mt-2 text-sm font-bold text-gray-950">
              {hasLeads ? '今天没有紧急 Lead。' : '还没有 Lead 进入。'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {hasLeads ? '你可以继续查看完整列表，或进入 Pipeline 优化阶段。' : '先完成流量测试，让第一个 Lead 进入 CRM。'}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {leadStats.priority.map((lead) => (
              <PriorityLeadCard
                key={lead.id}
                lead={lead}
                loading={setFollowup.isPending}
                onOpen={() => router.push(`/crm/${lead.id}`)}
                onTomorrow={() => scheduleFollowup(lead.id, 1)}
                onTwoDays={() => scheduleFollowup(lead.id, 2)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-950">完整 Lead 列表</h2>
            <p className="mt-1 text-sm text-gray-500">用于搜索、筛选、查看所有 Leads 和手动新增。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Kanban className="h-4 w-4" />}
              onClick={() => router.push('/crm/pipeline')}
            >
              Pipeline
            </Button>
            <Button size="sm" onClick={() => setDialogOpen(true)}>新增 Lead</Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Input
            name="search"
            type="search"
            placeholder="搜索姓名、电话或 email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full sm:w-64"
          />
          <div className="flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-gray-500">
            <Search className="h-4 w-4" />
            <span>筛选</span>
          </div>
          <select
            value={filters.stage ?? ''}
            onChange={(event) => setFilter('stage', event.target.value || undefined)}
            className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="">全部阶段</option>
            {STAGES.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}
          </select>
          <select
            value={filters.sort_by ?? 'createdAt'}
            onChange={(event) => setFilter('sort_by', event.target.value)}
            className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="createdAt">最新进入</option>
            <option value="updatedAt">最近更新</option>
            <option value="score">Lead 分数</option>
            <option value="name">姓名</option>
          </select>
          {allTags.length > 0 && (
            <select
              value={filters.tag ?? ''}
              onChange={(event) => setFilter('tag', event.target.value || undefined)}
              className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">全部标签</option>
              {allTags.map((tag) => <option key={tag.id} value={tag.name}>{tag.name}</option>)}
            </select>
          )}
        </div>

        <div className="mt-5">
          {!leadsQuery.isLoading && leads.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="还没有 Leads"
              description="当漏斗或流量测试带来潜在客户后，会出现在这里。你也可以先手动新增。"
              actionLabel="新增 Lead"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <LeadTable leads={leads} loading={leadsQuery.isLoading} />
              </div>
              <div className="space-y-3 md:hidden">
                {leadsQuery.isLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="h-28 animate-pulse rounded-[var(--radius-lg)] bg-gray-200" />
                    ))
                  : leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
              </div>
            </>
          )}
        </div>

        {meta && meta.total_pages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              disabled={filters.page === 1}
              onClick={() => setFilters((current) => ({ ...current, page: (current.page ?? 1) - 1 }))}
            >
              上一页
            </Button>
            <span className="text-sm text-[var(--color-text-muted)]">
              第 {filters.page ?? 1} / {meta.total_pages} 页
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={filters.page === meta.total_pages}
              onClick={() => setFilters((current) => ({ ...current, page: (current.page ?? 1) + 1 }))}
            >
              下一页
            </Button>
          </div>
        )}
      </section>

      <AddLeadDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}

function ConditionRow({ title, description, ready }: { title: string; description: string; ready: boolean }) {
  return (
    <div className={cn(
      'flex items-start gap-3 rounded-lg border p-4',
      ready ? 'border-emerald-100 bg-emerald-50/40' : 'border-[var(--color-border)] bg-white',
    )}>
      <div className={cn('mt-0.5 rounded-lg p-2', ready ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
        {ready ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-950">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-3 text-2xl font-bold text-gray-950">{value}</div>
    </div>
  );
}

function PriorityLeadCard({
  lead,
  loading,
  onOpen,
  onTomorrow,
  onTwoDays,
}: {
  lead: LeadRow;
  loading: boolean;
  onOpen: () => void;
  onTomorrow: () => void;
  onTwoDays: () => void;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-gray-950">{lead.name}</h3>
            <LeadScoreBadge score={lead.score} />
          </div>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            {lead.source ?? '未知来源'} · {lead.pipelineStage} · {relativeTime(lead.updatedAt)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onOpen} icon={<ArrowRight className="h-4 w-4" />}>
          详情
        </Button>
      </div>
      <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-700">
        {leadActionReason(lead)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <WhatsAppButton
          leadId={lead.id}
          phone={lead.phone}
          leadName={lead.name}
          message={suggestedMessage(lead)}
          size="sm"
        />
        <Button
          variant="secondary"
          size="sm"
          loading={loading}
          onClick={onTomorrow}
          icon={<CalendarClock className="h-4 w-4" />}
        >
          明天跟进
        </Button>
        <Button
          variant="secondary"
          size="sm"
          loading={loading}
          onClick={onTwoDays}
          icon={<SlidersHorizontal className="h-4 w-4" />}
        >
          后天跟进
        </Button>
      </div>
    </div>
  );
}
