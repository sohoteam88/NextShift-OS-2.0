'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  productName: string | null;
  purchaseDate: string;
  nextFollowup: string | null;
  status: 'active' | 'at_risk' | 'churned';
  notes: string | null;
  owner: { id: string; name: string };
  lead: { id: string; name: string; pipelineStage: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
  active: '活跃',
  at_risk: '需关注',
  churned: '已流失',
};

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  at_risk: 'bg-yellow-100 text-yellow-700',
  churned: 'bg-red-100 text-red-600',
};

function useCustomers(status: string) {
  return useQuery({
    queryKey: ['customers', status],
    queryFn: async () => {
      const params = status !== 'all' ? `?status=${status}` : '';
      const res = await fetch(`/api/v1/crm/customers${params}`);
      if (!res.ok) throw new Error('Failed to load customers');
      return res.json() as Promise<{ data: Customer[]; meta: { total: number } }>;
    },
    staleTime: 30_000,
  });
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

function AddCustomerDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    productName: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    nextFollowup: '',
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/crm/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || undefined,
          productName: form.productName || undefined,
          purchaseDate: new Date(form.purchaseDate).toISOString(),
          nextFollowup: form.nextFollowup ? new Date(form.nextFollowup).toISOString() : undefined,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create customer');
    },
    onSuccess: () => {
      setOpen(false);
      setForm({ name: '', phone: '', productName: '', purchaseDate: new Date().toISOString().slice(0, 10), nextFollowup: '', notes: '' });
      onCreated();
    },
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-primary-hover)]"
      >
        + 添加客户
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">添加新客户</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">姓名 *</label>
            <input
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">电话</label>
            <input
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">产品</label>
            <input
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm"
              value={form.productName}
              onChange={(e) => setForm((prev) => ({ ...prev, productName: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">购买日期 *</label>
            <input
              type="date"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm"
              value={form.purchaseDate}
              onChange={(e) => setForm((prev) => ({ ...prev, purchaseDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">下次跟进</label>
            <input
              type="date"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm"
              value={form.nextFollowup}
              onChange={(e) => setForm((prev) => ({ ...prev, nextFollowup: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">备注</label>
            <textarea
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={!form.name || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-primary)] py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-[var(--color-primary-hover)]"
          >
            {mutation.isPending ? '保存中…' : '保存'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const { data, isLoading } = useCustomers(statusFilter);
  const customers = data?.data ?? [];

  const statusTabs = [
    { value: 'all', label: '全部' },
    { value: 'active', label: '活跃' },
    { value: 'at_risk', label: '需关注' },
    { value: 'churned', label: '已流失' },
  ];

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await fetch(`/api/v1/crm/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">客户管理</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            跟踪已购买客户，提醒复购，预防流失
          </p>
        </div>
        <AddCustomerDialog onCreated={() => queryClient.invalidateQueries({ queryKey: ['customers'] })} />
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 border-b border-[var(--color-border)]">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`border-b-2 px-3 pb-2 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] p-12 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">还没有客户记录</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">点击「添加客户」开始记录已购买客户</p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => {
            const days = daysUntil(customer.nextFollowup);
            const isOverdue = days !== null && days < 0;
            const isDueToday = days !== null && days === 0;

            return (
              <div
                key={customer.id}
                className={`rounded-[var(--radius-lg)] border bg-white p-4 shadow-[var(--shadow-sm)] ${
                  isOverdue ? 'border-red-200' : 'border-[var(--color-border)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-text)]">{customer.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[customer.status]}`}>
                        {STATUS_LABEL[customer.status]}
                      </span>
                      {isOverdue && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          逾期跟进
                        </span>
                      )}
                      {isDueToday && (
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                          今天跟进
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--color-text-muted)]">
                      {customer.productName && <span>产品：{customer.productName}</span>}
                      {customer.phone && <span>{customer.phone}</span>}
                      <span>购买：{formatDate(customer.purchaseDate)}</span>
                      {customer.nextFollowup && (
                        <span className={isOverdue ? 'font-medium text-red-600' : ''}>
                          下次跟进：{formatDate(customer.nextFollowup)}
                          {days !== null && days > 0 && ` (${days} 天后)`}
                        </span>
                      )}
                    </div>
                    {customer.lead && (
                      <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                        来自客户：
                        <Link href={`/crm/${customer.lead.id}`} className="text-[var(--color-primary)] hover:underline">
                          {customer.lead.name}
                        </Link>
                      </div>
                    )}
                  </div>

                  <select
                    value={customer.status}
                    onChange={(e) => updateStatus.mutate({ id: customer.id, status: e.target.value })}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-2 py-1 text-xs"
                  >
                    <option value="active">活跃</option>
                    <option value="at_risk">需关注</option>
                    <option value="churned">已流失</option>
                  </select>
                </div>

                {customer.notes && (
                  <p className="mt-2 text-xs text-[var(--color-text-muted)] line-clamp-2">{customer.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
