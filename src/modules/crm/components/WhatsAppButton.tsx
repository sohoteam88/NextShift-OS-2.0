'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/stores/toast-store';

type Props = {
  leadId: string;
  phone?: string | null;
  leadName: string;
  message?: string;
  size?: 'sm' | 'md';
  className?: string;
};

export function WhatsAppButton({ leadId, phone, leadName, message, size = 'sm', className }: Props) {
  const [confirming, setConfirming] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  if (!phone) {
    return (
      <span title="此客户没有 WhatsApp 号码" className="cursor-not-allowed opacity-50">
        <Button
          variant="secondary"
          size={size}
          disabled
          icon={<MessageCircle className="h-4 w-4" />}
          className={className}
        >
          WhatsApp
        </Button>
      </span>
    );
  }

  const cleanPhone = phone.replace(/\D/g, '');
  const waUrl = message
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${cleanPhone}`;

  async function logContact() {
    try {
      await fetch(`/api/v1/crm/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'whatsapp', description: `WhatsApp 已联系 ${leadName}` }),
      });
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      qc.invalidateQueries({ queryKey: ['followup-counts'] });
      toast('success', 'WhatsApp 活动已记录');
    } catch {
      // silent
    }
  }

  function handleClick() {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setConfirming(true);
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
        <span>记录此次联系？</span>
        <button
          onClick={() => { logContact(); setConfirming(false); }}
          className="font-semibold underline"
        >
          是
        </button>
        <button onClick={() => setConfirming(false)} className="underline opacity-70">
          否
        </button>
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      size={size}
      onClick={handleClick}
      icon={<MessageCircle className="h-4 w-4 text-emerald-600" />}
      className={className}
    >
      WhatsApp
    </Button>
  );
}
