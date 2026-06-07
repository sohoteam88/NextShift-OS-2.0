'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Copy, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/stores/toast-store';

type Props = { open: boolean; onClose: () => void; slug: string; title: string };

export function ShareFunnelDialog({ open, onClose, slug, title }: Props) {
  const [url, setUrl] = useState('');
  const qrRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(`${window.location.origin}/f/${slug}`);
    }
  }, [slug]);

  useEffect(() => {
    if (!open || !url || !qrRef.current) return;
    import('qrcode').then(QRCode => {
      QRCode.toCanvas(qrRef.current!, url, { width: 180, margin: 1 }, () => {});
    });
  }, [open, url]);

  if (!open) return null;

  function copy() {
    navigator.clipboard.writeText(url);
    toast('success', '链接已复制');
  }

  function shareWhatsApp() {
    const msg = `来看看我的「${title}」页面：${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-base font-semibold">分享漏斗</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* QR Code */}
          <div className="flex justify-center">
            <canvas ref={qrRef} className="rounded-[var(--radius-md)]" />
          </div>

          {/* URL */}
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-gray-50 px-3 py-2">
            <span className="flex-1 truncate text-sm text-gray-700">{url}</span>
            <button onClick={copy} className="shrink-0 text-[var(--color-primary)] hover:opacity-70">
              <Copy className="h-4 w-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" icon={<Copy className="h-4 w-4" />} onClick={copy}>复制链接</Button>
            <Button className="flex-1" icon={<MessageCircle className="h-4 w-4" />} onClick={shareWhatsApp}>
              分享到 WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
