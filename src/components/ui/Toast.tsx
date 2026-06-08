'use client';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore, type ToastType } from '@/stores/toast-store';
import { cn } from '@/lib/cn';

const styles: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />,
  error: <XCircle className="h-4 w-4 shrink-0 text-red-600" />,
  info: <Info className="h-4 w-4 shrink-0 text-blue-600" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />,
};

export function ToastContainer() {
  const { toasts, remove } = useToastStore();

  if (!toasts.length) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm shadow-md',
            styles[t.type],
          )}
        >
          {icons[t.type]}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
