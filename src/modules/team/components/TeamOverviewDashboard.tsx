'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowRight, LayoutGrid, Rows3, TreePine, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { MemberInvitePanel } from '@/modules/member/components/MemberInvitePanel';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { TeamMemberNode, TeamMemberRow, TeamSummary, TeamViewMode } from '../types';
import { TeamMemberCard } from './TeamMemberCard';

const TeamTree = dynamic(() => import('./TeamTree').then((mod) => mod.TeamTree), {
  ssr: false,
  loading: () => <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm"><Skeleton className="h-64 w-full" /></div>,
});

const TeamMemberList = dynamic(() => import('./TeamMemberList').then((mod) => mod.TeamMemberList), {
  ssr: false,
  loading: () => <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm"><Skeleton className="h-72 w-full" /></div>,
});

type Props = {
  user: AuthUser;
  defaultView?: TeamViewMode;
  initialMemberId?: string | null;
};

function findNodeById(node: TeamMemberNode, id: string): TeamMemberNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const match = findNodeById(child, id);
    if (match) return match;
  }
  return null;
}

function useTeamSummary() {
  return useQuery({
    queryKey: ['team-summary'],
    queryFn: async () => {
      const res = await fetch('/api/v1/team/summary');
      if (!res.ok) throw new Error('Failed to load team summary');
      return res.json() as Promise<{ data: TeamSummary }>;
    },
    staleTime: 60_000,
  });
}

function useTeamTree() {
  return useQuery({
    queryKey: ['team-tree'],
    queryFn: async () => {
      const res = await fetch('/api/v1/team/tree');
      if (!res.ok) throw new Error('Failed to load team tree');
      return res.json() as Promise<{ data: TeamMemberNode }>;
    },
    staleTime: 60_000,
  });
}

function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members', true],
    queryFn: async () => {
      const res = await fetch('/api/v1/team/members?include_stats=true');
      if (!res.ok) throw new Error('Failed to load team members');
      return res.json() as Promise<{ data: TeamMemberRow[] }>;
    },
    staleTime: 60_000,
  });
}

function SummaryCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
      {loading ? <Skeleton className="mt-2 h-8 w-20" /> : <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{value}</p>}
    </div>
  );
}

export function TeamOverviewDashboard({ user, defaultView = 'tree', initialMemberId = null }: Props) {
  const t = useTranslations('team');
  const [view, setView] = React.useState<TeamViewMode>(defaultView);
  const [layout, setLayout] = React.useState<'vertical' | 'horizontal'>('vertical');
  const [selectedTreeMember, setSelectedTreeMember] = React.useState<TeamMemberNode | null>(null);
  const [selectedListMember, setSelectedListMember] = React.useState<TeamMemberRow | null>(null);

  const summaryQuery = useTeamSummary();
  const treeQuery = useTeamTree();
  const membersQuery = useTeamMembers();

  const summary = summaryQuery.data?.data;
  const tree = treeQuery.data?.data;
  const members = React.useMemo(() => membersQuery.data?.data ?? [], [membersQuery.data?.data]);

  const largeTeam = (summary?.totalMembers ?? 0) > 50;
  const selectedMember = view === 'tree' ? selectedTreeMember : selectedListMember;

  React.useEffect(() => {
    if (view === 'tree' && !selectedTreeMember && tree) {
      setSelectedTreeMember(initialMemberId ? findNodeById(tree, initialMemberId) ?? tree : tree);
    }
  }, [initialMemberId, tree, selectedTreeMember, view]);

  React.useEffect(() => {
    if (view === 'list' && !selectedListMember && members.length > 0) {
      setSelectedListMember(
        initialMemberId ? members.find((member) => member.id === initialMemberId) ?? members[0] : members[0],
      );
    }
  }, [initialMemberId, members, selectedListMember, view]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('overview')}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('overviewHelp')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/approvals"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)] sm:w-auto"
          >
            <Users className="h-4 w-4" />
            {t('approve')}
          </Link>
          <Link
            href="/team/members"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)] sm:w-auto"
          >
            <Rows3 className="h-4 w-4" />
            {t('members')}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label={t('totalMembers')} value={String(summary?.totalMembers ?? 0)} loading={summaryQuery.isLoading} />
        <SummaryCard label={t('activeMembers')} value={String(summary?.activeMembers ?? 0)} loading={summaryQuery.isLoading} />
        <SummaryCard label={t('totalLeads')} value={String(summary?.totalLeads ?? 0)} loading={summaryQuery.isLoading} />
        <SummaryCard label={t('totalConversions')} value={String(summary?.totalConversions ?? 0)} loading={summaryQuery.isLoading} />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-2 shadow-sm">
        <Button
          variant={view === 'tree' ? 'primary' : 'ghost'}
          size="sm"
          icon={<TreePine className="h-4 w-4" />}
          onClick={() => setView('tree')}
        >
          {t('treeView')}
        </Button>
        <Button
          variant={view === 'list' ? 'primary' : 'ghost'}
          size="sm"
          icon={<LayoutGrid className="h-4 w-4" />}
          onClick={() => setView('list')}
        >
          {t('listView')}
        </Button>

        {view === 'tree' && (
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <span className="text-sm text-[var(--color-text-muted)]">{t('orientation')}</span>
            <Button
              variant={layout === 'vertical' ? 'primary' : 'secondary'}
              size="sm"
              icon={<Rows3 className="h-4 w-4" />}
              onClick={() => setLayout('vertical')}
            >
              {t('vertical')}
            </Button>
            <Button
              variant={layout === 'horizontal' ? 'primary' : 'secondary'}
              size="sm"
              icon={<LayoutGrid className="h-4 w-4" />}
              onClick={() => setLayout('horizontal')}
            >
              {t('horizontal')}
            </Button>
          </div>
        )}
      </div>

      {view === 'tree' ? (
        treeQuery.isLoading || !tree ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <TeamTree
            root={tree}
            layout={layout}
            largeTeam={largeTeam}
            selectedId={selectedTreeMember?.id ?? null}
            onSelect={setSelectedTreeMember}
          />
        )
      ) : membersQuery.isLoading ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <TeamMemberList
          members={members}
          loading={membersQuery.isLoading}
          selectedId={selectedListMember?.id ?? null}
          onSelect={setSelectedListMember}
        />
      )}

      {selectedMember && (
        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('memberDetail')}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('memberDetailHelp')}</p>
            </div>
            <Badge variant="info">{selectedMember.role}</Badge>
          </div>

          <TeamMemberCard
            member={selectedMember}
            onSendMessage={
              selectedMember.phone
                ? () => window.open(`https://wa.me/${selectedMember.phone!.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer')
                : undefined
            }
          />
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('inviteTitle')}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('inviteHelp')}</p>
          </div>
          <Link href="/admin/approvals" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]">
            <span>{t('approve')}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <MemberInvitePanel role={user.role as 'member' | 'leader' | 'operator' | 'platform_admin'} />
      </section>
    </div>
  );
}
