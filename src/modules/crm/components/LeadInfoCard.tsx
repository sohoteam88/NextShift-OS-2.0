'use client';
import { useState } from 'react';
import { Phone, Mail, User, Calendar } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { TagSelector } from './TagSelector';
import { useSetLeadTags } from '../hooks/use-tags';
import { useToast } from '@/stores/toast-store';
import { type LeadDetail } from '../hooks/use-leads';

type Props = { lead: LeadDetail };

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 shrink-0 text-[var(--color-text-muted)]">{icon}</span>
      <div>
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
        <p className="text-sm text-[var(--color-text)]">{value}</p>
      </div>
    </div>
  );
}

export function LeadInfoCard({ lead }: Props) {
  const [tagIds, setTagIds] = useState<string[]>(lead.tags.map(({ tag }) => tag.id));
  const setLeadTags = useSetLeadTags();
  const { toast } = useToast();

  async function handleTagChange(newIds: string[]) {
    setTagIds(newIds);
    try {
      await setLeadTags.mutateAsync({ leadId: lead.id, tagIds: newIds });
    } catch {
      setTagIds(lead.tags.map(({ tag }) => tag.id)); // revert
      toast('error', '标签更新失败');
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">客户信息</h3>
      <div className="divide-y divide-[var(--color-border)]">
        <InfoRow icon={<Phone className="h-4 w-4" />} label="电话" value={lead.phone} />
        <InfoRow icon={<Mail className="h-4 w-4" />} label="邮件" value={lead.email} />
        <InfoRow icon={<User className="h-4 w-4" />} label="来源" value={lead.source} />
        <div className="flex items-start gap-3 py-2">
          <span className="mt-0.5 shrink-0 text-[var(--color-text-muted)]">
            <User className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">负责人</p>
            <div className="mt-1 flex items-center gap-2">
              <Avatar name={lead.owner.name} size="sm" />
              <span className="text-sm text-[var(--color-text)]">{lead.owner.name}</span>
            </div>
          </div>
        </div>
        <InfoRow
          icon={<Calendar className="h-4 w-4" />}
          label="创建时间"
          value={new Date(lead.createdAt).toLocaleDateString('zh-CN')}
        />
      </div>

      {/* Editable tags */}
      <div className="mt-3">
        <p className="mb-1.5 text-xs text-[var(--color-text-muted)]">标签</p>
        <TagSelector
          selectedIds={tagIds}
          onChange={handleTagChange}
          canCreate
          placeholder="添加标签"
        />
      </div>
    </div>
  );
}
