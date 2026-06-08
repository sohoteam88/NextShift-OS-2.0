'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AdminUserRecord, AdminUserRole, AdminUserStatus } from '../types';

type Props = {
  open: boolean;
  currentUserId: string;
  currentUserRole: AdminUserRole;
  user: AdminUserRecord | null;
  onClose: () => void;
  onSaved: () => void;
};

const roleOptions: AdminUserRole[] = ['member', 'leader', 'operator', 'platform_admin'];
const statusOptions: AdminUserStatus[] = ['active', 'pending', 'suspended'];

export function EditUserDialog({ open, currentUserId, currentUserRole, user, onClose, onSaved }: Props) {
  const t = useTranslations('admin');
  const common = useTranslations('common');
  const qc = useQueryClient();
  const [role, setRole] = React.useState<AdminUserRole>('member');
  const [status, setStatus] = React.useState<AdminUserStatus>('active');

  React.useEffect(() => {
    if (user) {
      setRole(user.role);
      setStatus(user.status);
    }
  }, [user]);

  const canEditRole =
    Boolean(user) &&
    user?.id !== currentUserId &&
    (currentUserRole === 'platform_admin' || (user?.role !== 'operator' && user?.role !== 'platform_admin'));
  const canEditStatus = Boolean(user) && (currentUserRole === 'platform_admin' || user?.role !== 'platform_admin');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('No user selected');
      }

      const payload: Record<string, string> = {};
      if (role !== user.role) payload.role = role;
      if (status !== user.status) payload.status = status;

      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to update user');
      }
      return res.json() as Promise<{ data: AdminUserRecord }>;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-users'] });
      onSaved();
      onClose();
    },
  });

  if (!open || !user) return null;

  const roleChanged = role !== user.role;
  const statusChanged = status !== user.status;

  async function handleSave() {
    if (roleChanged || statusChanged) {
      const confirmation = window.confirm(
        roleChanged && statusChanged
          ? t('confirmUserRoleAndStatusChange')
          : roleChanged
            ? t('confirmUserRoleChange')
            : t('confirmUserStatusChange'),
      );
      if (!confirmation) return;
    }
    await mutation.mutateAsync();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('editUser')}</h2>
              <Badge variant={user.status === 'active' ? 'success' : user.status === 'pending' ? 'warning' : 'danger'}>
                {user.status}
              </Badge>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">{user.name} · {user.email}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" icon={<X className="h-4 w-4" />} onClick={onClose} />
        </div>

        <div className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--color-text)]">{t('role')}</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AdminUserRole)}
                disabled={!canEditRole}
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm disabled:cursor-not-allowed disabled:bg-[var(--color-surface)]"
              >
                {roleOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {!canEditRole && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  {user.role === 'operator'
                    ? t('operatorRoleLocked')
                    : user.role === 'platform_admin'
                      ? t('platformAdminLocked')
                      : t('selfRoleLocked')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--color-text)]">{t('status')}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AdminUserStatus)}
                disabled={!canEditStatus}
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm"
              >
                {statusOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {!canEditStatus && <p className="text-xs text-[var(--color-text-muted)]">{t('platformAdminLocked')}</p>}
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-muted)]">
            <p>{t('auditNotice')}</p>
            <p className="mt-1">
              {t('currentUserHint', { name: user.name, role: user.role, status: user.status })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] p-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            {common('cancel')}
          </Button>
          <Button type="button" loading={mutation.isPending} onClick={handleSave}>
            {common('save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
