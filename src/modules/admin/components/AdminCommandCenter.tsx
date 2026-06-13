import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Flame,
  LayoutTemplate,
  ListChecks,
  Users,
} from 'lucide-react';
import type {
  WorkspaceAttention,
  WorkspaceCommandData,
  WorkspaceFunnelHealth,
  WorkspaceMemberHealth,
} from '@/modules/admin/services/workspaceHealthService';

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatCurrency(value: number) {
  return `RM${formatNumber(value)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function scoreTone(score: number) {
  if (score > 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
}

function severityTone(severity: WorkspaceAttention['severity']) {
  if (severity === 'critical') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (severity === 'high') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-[var(--color-text-muted)]">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--color-text-muted)]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function MetricCard({ label, value, helper, icon: Icon }: { label: string; value: string | number; helper?: string; icon: React.ElementType }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
        <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
      </div>
      <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{value}</p>
      {helper ? <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helper}</p> : null}
    </div>
  );
}

function AttentionPanel({ items }: { items: WorkspaceAttention[] }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">Needs Attention</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Priority ordered operational issues.</p>
        </div>
        <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
      </div>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
            No urgent issues right now.
          </div>
        ) : (
          items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between rounded-[var(--radius-md)] border px-3 py-3 text-sm transition-colors hover:bg-white ${severityTone(item.severity)}`}
            >
              <span className="font-medium">{item.value} {item.label}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

function MemberRow({ member }: { member: WorkspaceMemberHealth }) {
  return (
    <tr className="hover:bg-[var(--color-surface)]">
      <td className="border-b border-[var(--color-border)] px-4 py-3">
        <p className="font-medium text-[var(--color-text)]">{member.name}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{member.email}</p>
      </td>
      <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">{member.role}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">
        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${member.journeyProgress}%` }} />
        </div>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{member.journeyProgress}% · {member.currentStage}</p>
      </td>
      <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">{member.currentFunnel}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">{formatDate(member.lastActiveAt)}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreTone(member.healthScore)}`}>
          Health {member.healthScore}
        </span>
      </td>
      <td className="border-b border-[var(--color-border)] px-4 py-3 text-sm">
        {member.needsHelp ? <span className="text-amber-700">Needs Attention</span> : <span className="text-emerald-700">OK</span>}
      </td>
    </tr>
  );
}

function FunnelRow({ funnel }: { funnel: WorkspaceFunnelHealth }) {
  return (
    <tr className="hover:bg-[var(--color-surface)]">
      <td className="border-b border-[var(--color-border)] px-4 py-3">
        <p className="font-medium text-[var(--color-text)]">{funnel.title}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{funnel.status}</p>
      </td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">{funnel.published ? 'Published' : 'Draft'}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">{funnel.views}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">{funnel.conversions}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">{funnel.conversionRate}%</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreTone(funnel.healthScore)}`}>
          {funnel.healthScore}
        </span>
      </td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">
        {funnel.inactive ? <span className="text-amber-700">No traffic</span> : <span className="text-emerald-700">Active</span>}
      </td>
    </tr>
  );
}

export function AdminOverview({ data }: { data: WorkspaceCommandData }) {
  const topMetrics = [
    { label: 'Members', value: data.overview.totalMembers, helper: 'Total workspace members', icon: Users },
    { label: 'Active This Week', value: data.overview.activeThisWeek, helper: 'Members with recent activity', icon: Flame },
    { label: 'Funnels', value: data.overview.funnels, helper: 'Created funnels', icon: LayoutTemplate },
    { label: 'Leads', value: data.overview.leads, helper: 'Total captured leads', icon: BarChart3 },
  ];
  const revenueMetrics = [
    { label: 'Appointments', value: data.overview.appointments, helper: 'Pipeline appointments', icon: Clock3 },
    { label: 'Customers', value: data.overview.customers, helper: 'Converted customers', icon: CheckCircle2 },
    { label: 'Team Members', value: data.overview.teamMembers, helper: 'Sponsored members', icon: Users },
    { label: 'Revenue', value: formatCurrency(data.overview.revenue), helper: `${data.overview.conversionRate}% conversion`, icon: CircleDollarSign },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations Command Center"
        title="Workspace Overview"
        description="Know what needs attention, which members are stuck, and what actions are required today."
        action={<Link href="/admin/operations" className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-white">Today&apos;s Tasks <ArrowRight className="h-4 w-4" /></Link>}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{topMetrics.map((item) => <MetricCard key={item.label} {...item} />)}</section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{revenueMetrics.map((item) => <MetricCard key={item.label} {...item} />)}</section>
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <AttentionPanel items={data.attention} />
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--color-text)]">Workspace Health</h2>
          <div className="mt-4 flex items-end gap-3">
            <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${scoreTone(data.overview.healthScore)}`}>{data.overview.healthScore}/100</span>
            <p className="text-sm text-[var(--color-text-muted)]">Members, funnels, leads, content, and approvals.</p>
          </div>
          <div className="mt-5 space-y-3">
            {data.journey.slice(0, 5).map((stage) => (
              <div key={stage.id}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-[var(--color-text)]">{stage.label}</span>
                  <span className="text-[var(--color-text-muted)]">{stage.users} users</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.min(100, stage.users * 12)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        {[
          { href: '/admin/members', title: 'Member Health Center', value: data.members.filter((m) => m.needsHelp).length, label: 'need help' },
          { href: '/admin/funnels', title: 'Funnel Health Center', value: data.funnels.filter((f) => f.inactive).length, label: 'without traffic' },
          { href: '/admin/beta', title: 'Beta Command Center', value: data.overview.activeThisWeek, label: 'activated this week' },
        ].map((card) => (
          <Link key={card.href} href={card.href} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm transition-colors hover:bg-[var(--color-surface)]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[var(--color-text)]">{card.title}</h2>
              <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{card.value}</p>
            <p className="text-sm text-[var(--color-text-muted)]">{card.label}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

export function AdminMembersCenter({ data }: { data: WorkspaceCommandData }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Member Health Center" description="Track progress, last active dates, health scores, and who needs help." />
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs text-[var(--color-text-muted)]">
            <tr>{['Member', 'Role', 'Journey Progress', 'Current Funnel', 'Last Active', 'Health', 'Needs Help?'].map((h) => <th key={h} className="border-b border-[var(--color-border)] px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>{data.members.map((member) => <MemberRow key={member.id} member={member} />)}</tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminFunnelsCenter({ data }: { data: WorkspaceCommandData }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Funnel Health Center" description="Monitor published funnels, traffic, conversions, and health scores." />
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs text-[var(--color-text-muted)]">
            <tr>{['Funnel', 'Published', 'Views', 'Conversions', 'Conversion', 'Health', 'Status'].map((h) => <th key={h} className="border-b border-[var(--color-border)] px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>{data.funnels.map((funnel) => <FunnelRow key={funnel.id} funnel={funnel} />)}</tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminJourneyCenter({ data }: { data: WorkspaceCommandData }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Journey Monitoring" description="See where users are stuck across the customer and member journey." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {data.journey.map((stage) => <MetricCard key={stage.id} label={stage.label} value={stage.users} helper="users in stage" icon={ListChecks} />)}
      </section>
    </div>
  );
}

export function AdminTeamCenter({ data }: { data: WorkspaceCommandData }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Team Command Center" description="Monitor team activity, leads, appointments, customers, and recruitment conversion." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Team Members" value={data.overview.teamMembers} helper="Sponsored members" icon={Users} />
        <MetricCard label="Active This Week" value={data.overview.activeThisWeek} helper="Recent activity" icon={Flame} />
        <MetricCard label="Content Published" value={data.content.publishingActivity} helper="Last 30 days" icon={FileText} />
        <MetricCard label="Leads Generated" value={data.overview.leads} helper="All time" icon={BarChart3} />
        <MetricCard label="Appointments" value={data.overview.appointments} helper="Pipeline appointment stages" icon={Clock3} />
        <MetricCard label="Customers" value={data.overview.customers} helper="Converted customers" icon={CheckCircle2} />
        <MetricCard label="Recruitment Conversion" value={`${data.overview.conversionRate}%`} helper="Customer conversion proxy" icon={Users} />
      </section>
    </div>
  );
}

export function AdminContentCenter({ data }: { data: WorkspaceCommandData }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Content Monitoring" description="Track generated posts, videos, publishing activity, and most used platforms." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Posts Generated" value={data.content.postsGenerated} helper="Last 30 days" icon={FileText} />
        <MetricCard label="Videos Generated" value={data.content.videosGenerated} helper="Last 30 days" icon={FileText} />
        <MetricCard label="Publishing Activity" value={data.content.publishingActivity} helper="Published items" icon={CheckCircle2} />
        <MetricCard label="Most Used Platform" value={data.content.platforms[0]?.label ?? 'None'} helper={`${data.content.platforms[0]?.value ?? 0} items`} icon={BarChart3} />
      </section>
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Platforms</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {['Facebook', 'Instagram', 'TikTok', 'XHS'].map((platform) => {
            const count = data.content.platforms.find((item) => item.label.toLowerCase() === platform.toLowerCase())?.value ?? 0;
            return <div key={platform} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"><p className="font-medium">{platform}</p><p className="text-2xl font-semibold">{count}</p></div>;
          })}
        </div>
      </section>
    </div>
  );
}

export function AdminBillingCenter({ data }: { data: WorkspaceCommandData }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Billing Monitoring" description="Monitor active plans, trials, failed payments, grace period users, and MRR." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Active Plans" value={data.billing.activePlans} icon={CircleDollarSign} />
        <MetricCard label="Trials" value={data.billing.trials} icon={Clock3} />
        <MetricCard label="Expired" value={data.billing.expired} icon={AlertTriangle} />
        <MetricCard label="Failed Payments" value={data.billing.failedPayments} icon={AlertTriangle} />
        <MetricCard label="Grace Period Users" value={data.billing.gracePeriodUsers} icon={Users} />
        <MetricCard label="MRR" value={formatCurrency(data.billing.mrr)} icon={CircleDollarSign} />
      </section>
    </div>
  );
}

export function AdminOperationsCenter({ data }: { data: WorkspaceCommandData }) {
  const tasks = [
    ...data.attention.map((item) => ({ label: `${item.value} ${item.label}`, href: item.href })),
    { label: `${data.members.filter((item) => item.needsHelp).length} members requiring follow-up`, href: '/admin/members' },
    { label: `${data.funnels.filter((item) => item.inactive).length} funnels requiring attention`, href: '/admin/funnels' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Daily Operations Center" description="A focused checklist for approvals, follow-ups, funnel issues, and payments." />
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Today&apos;s Tasks</h2>
        <div className="mt-4 space-y-2">
          {tasks.map((task) => (
            <Link key={`${task.href}-${task.label}`} href={task.href} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-3 text-sm hover:bg-[var(--color-surface)]">
              <span>{task.label}</span>
              <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />
            </Link>
          ))}
        </div>
      </section>
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Recent Activity</h2>
        <div className="mt-4 space-y-3">
          {data.activity.length === 0 ? <p className="text-sm text-[var(--color-text-muted)]">No recent activity yet.</p> : data.activity.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[var(--color-text)]">{item.label}</span>
              <span className="whitespace-nowrap text-[var(--color-text-muted)]">{formatDate(item.createdAt)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
