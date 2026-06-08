'use client';
import { MessageCircle } from 'lucide-react';

type Props = {
  phone: string;
  label: string;
  primaryColor: string;
  funnelTitle?: string;
  quizResult?: string;
  slug: string;
};

export function WhatsAppCTA({ phone, label, primaryColor, funnelTitle, quizResult, slug }: Props) {
  const clean = phone.replace(/\D/g, '');
  const quizPart = quizResult ? `，我的结果是「${quizResult}」` : '';
  const msg = funnelTitle
    ? `你好！我在你的「${funnelTitle}」页面看到了信息${quizPart}，想了解更多 😊`
    : '你好！想了解更多信息 😊';
  const href = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;

  async function handleClick() {
    try {
      await fetch(`/api/v1/public/funnel/${slug}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'whatsapp_click' }),
      });
    } catch { /* silent */ }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white shadow-lg transition-opacity hover:opacity-90 active:opacity-80"
      style={{ backgroundColor: primaryColor }}
    >
      <MessageCircle className="h-5 w-5" />
      {label}
    </a>
  );
}
