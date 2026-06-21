'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { KeyRound, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/stores/toast-store';
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
  const { toast } = useToast();
  const [role, setRole] = React.useState<AdminUserRole>('member');
  const [status, setStatus] = React.useState<AdminUserStatus>('active');
  const [password, setPassword] = React.useState('');
  const [deleteConfirm, setDeleteConfirm] = React.useState('');

  React.useEffect(() => {
    if (user) {
      setRole(user.role);
      setStatus(user.status);
      setPassword('');
      setDeleteConfirm('');
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
      toast('success', common('save'));
      onSaved();
      onClose();
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('No user selected');
      }

      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to reset password');
      }
      return res.json();
    },
    onSuccess: async () => {
      setPassword('');
      toast('success', t('passwordResetSuccess'));
    },
    onError: (error) => {
      toast('error', error instanceof Error ? error.message : 'Failed to reset password');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('No user selected');
      }

      const res = await fetch(`/api/v1/admin/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to delete user');
      }
      return res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast('success', t('userDeletedSuccess'));
      onSaved();
      onClose();
    },
    onError: (error) => {
      toast('error', error instanceof Error ? error.message : 'Failed to delete user');
    },
  });

  if (!open || !user) return null;

  const roleChanged = role !== user.role;
  const statusChanged = status !== user.status;
  const canSecurityAction =
    user.id !== currentUserId &&
    (currentUserRole === 'platform_admin' || (user.role !== 'operator' && user.role !== 'platform_admin'));

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

  async function handlePasswordReset() {
    if (password.length < 8) {
      toast('error', t('passwordMinLength'));
      return;
    }

    const confirmation = window.confirm(t('confirmPasswordReset'));
    if (!confirmation) return;
    await passwordMutation.mutateAsync();
  }

  async function handleDelete() {
    if (deleteConfirm !== 'DELETE') {
      toast('error', t('deleteConfirmRequired'));
      return;
    }

    const confirmation = window.confirm(t('confirmUserDelete'));
    if (!confirmation) return;
    await deleteMutation.mutateAsync();
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

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-[var(--color-text)]">
                  {t('resetPassword')}
                </h3>
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
                {t('resetPasswordHelp')}
              </p>
              <div className="mt-3 space-y-2">
                <Input
                  label={t('newPassword')}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={!canSecurityAction}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={passwordMutation.isPending}
                  disabled={!canSecurityAction || password.length < 8}
                  onClick={handlePasswordReset}
                >
                  {t('resetPassword')}
                </Button>
                {!canSecurityAction && (
                  <p className="text-xs text-[var(--color-text-muted)]">{t('securityActionLocked')}</p>
                )}
              </div>
            </section>

            <section className="rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-rose-700" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-rose-900">
                  {t('deleteUser')}
                </h3>
              </div>
              <p className="mt-2 text-xs leading-5 text-rose-700">
                {t('deleteUserHelp')}
              </p>
              <div className="mt-3 space-y-2">
                <Input
                  label={t('deleteConfirmLabel')}
                  value={deleteConfirm}
                  onChange={(event) => setDeleteConfirm(event.target.value)}
                  disabled={!canSecurityAction}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={deleteMutation.isPending}
                  disabled={!canSecurityAction || deleteConfirm !== 'DELETE'}
                  onClick={handleDelete}
                  className="border-rose-200 text-rose-700 hover:bg-rose-100"
                >
                  {t('deleteUser')}
                </Button>
                {!canSecurityAction && (
                  <p className="text-xs text-rose-700">{t('securityActionLocked')}</p>
                )}
              </div>
            </section>
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
