'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Edit2, Search } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AdminUserRecord, AdminUserRole, AdminUserStatus, AdminUsersResponse } from '../types';
import { EditUserDialog } from './EditUserDialog';

type Props = {
  currentUserId: string;
  currentUserRole: AdminUserRole;
};

function statusVariant(status: AdminUserStatus) {
  if (status === 'active') return 'success';
  if (status === 'pending') return 'warning';
  return 'danger';
}

export function UserManagementPanel({ currentUserId, currentUserRole }: Props) {
  const t = useTranslations('admin');
  const common = useTranslations('common');
  const [search, setSearch] = React.useState('');
  const [role, setRole] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [selectedUser, setSelectedUser] = React.useState<AdminUserRecord | null>(null);
  const limit = 10;

  const query = useQuery({
    queryKey: ['admin-users', { search, role, status, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (role) params.set('role', role);
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('limit', String(limit));
      const res = await fetch(`/api/v1/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json() as Promise<AdminUsersResponse>;
    },
  });

  const users = query.data?.data ?? [];
  const meta = query.data?.meta ?? { page: 1, limit, total: 0, totalPages: 1 };

  React.useEffect(() => {
    setPage(1);
  }, [search, role, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('usersTitle')}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {t('usersSubtitle', { count: meta.total })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchUsers')}
            className="pl-9"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm"
        >
          <option value="">{t('allRoles')}</option>
          <option value="member">{t('roleMember')}</option>
          <option value="leader">{t('roleLeader')}</option>
          <option value="operator">{t('roleOperator')}</option>
          <option value="platform_admin">{t('rolePlatformAdmin')}</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm"
        >
          <option value="">{t('allStatuses')}</option>
          <option value="active">{t('statusActive')}</option>
          <option value="pending">{t('statusPending')}</option>
          <option value="suspended">{t('statusSuspended')}</option>
        </select>
        <Link
          href="/team"
          className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]"
        >
          {t('inviteMember')}
        </Link>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-sm">
            <thead className="bg-[var(--color-surface)]">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">{t('presence')}</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">{t('name')}</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">{t('email')}</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">{t('role')}</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">{t('status')}</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
                    {common('noResults')}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--color-surface)]">
                    <td className="px-4 py-3">
                      <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">{user.name}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{user.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Edit2 className="h-4 w-4" />}
                        onClick={() => setSelectedUser(user)}
                      >
                        {common('edit')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-text-muted)]">
        <p>
          {t('pageOf', { page: meta.page, total: meta.totalPages })}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            {common('back')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={meta.page >= meta.totalPages}
            onClick={() => setPage((value) => Math.min(meta.totalPages, value + 1))}
          >
            {common('next')}
          </Button>
        </div>
      </div>

      <EditUserDialog
        open={Boolean(selectedUser)}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onSaved={() => {
          setSelectedUser(null);
        }}
      />
    </div>
  );
}
