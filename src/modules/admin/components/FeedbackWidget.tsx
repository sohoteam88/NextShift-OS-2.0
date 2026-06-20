'use client';

import * as React from 'react';
import { MessageCircle, X } from 'lucide-react';

const TYPES = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'ux', label: 'UX Improvement' },
  { value: 'general', label: 'General Feedback' },
] as const;

export function FeedbackWidget() {
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<string>('general');
  const [message, setMessage] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || message.length < 5) return;
    setSending(true);
    try {
      await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message, route: window.location.pathname }),
      });
      setSubmitted(true);
    } catch {} finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(!open); setSubmitted(false); setMessage(''); }}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg transition-transform hover:scale-105 lg:bottom-6 lg:right-6"
        aria-label="Feedback"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom))] right-4 z-50 w-[calc(100vw-2rem)] max-w-80 rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-xl lg:bottom-20 lg:right-6">
          {submitted ? (
            <div className="py-4 text-center">
              <p className="text-sm font-semibold text-emerald-600">Thank you!</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Your feedback helps us improve.</p>
              <button onClick={() => setOpen(false)} className="mt-3 text-xs font-medium text-[var(--color-primary)]">Close</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3 className="mb-3 text-sm font-semibold">Send Feedback</h3>
              <select value={type} onChange={(e) => setType(e.target.value)} className="mb-2 h-9 w-full rounded border px-2 text-xs">
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or suggestion..."
                rows={3}
                className="mb-3 w-full resize-none rounded border px-3 py-2 text-xs outline-none focus:border-[var(--color-primary)]"
                minLength={5}
                required
              />
              <button
                type="submit"
                disabled={sending || message.length < 5}
                className="h-9 w-full rounded bg-[var(--color-primary)] text-xs font-semibold text-white disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
