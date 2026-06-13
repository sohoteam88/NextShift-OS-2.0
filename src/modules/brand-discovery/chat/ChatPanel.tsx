'use client';

import * as React from 'react';
import { Send, Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getOpeningMessage } from '../coachBrain';
import { SLOT_DEFINITIONS, type SlotMap, type SlotName } from '../slotExtractionService';

// ============================================================
// Types
// ============================================================

type Locale = 'zh' | 'en' | 'ms';

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
}

interface ChatPanelProps {
  locale?: Locale;
  messages: ChatMessage[];
  slots: SlotMap;
  isTyping: boolean;
  onSendMessage: (message: string) => void;
  onStartVoice: () => void;
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function ChatPanel({
  locale = 'zh',
  messages,
  slots,
  isTyping,
  onSendMessage,
  onStartVoice,
  className,
}: ChatPanelProps) {
  const [input, setInput] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    onSendMessage(trimmed);
    setInput('');
  }

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Chat header */}
      <div className="shrink-0 border-b border-[var(--color-border)] bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
        <p className="text-sm font-bold text-white">
          {locale === 'en'
            ? 'AI Brand Coach'
            : locale === 'ms'
              ? 'Jurulatih Jenama AI'
              : 'AI 品牌教练'}
        </p>
        <p className="text-xs text-blue-200">
          {locale === 'en'
            ? 'Chat naturally — like WhatsApp'
            : locale === 'ms'
              ? 'Sembang seperti WhatsApp'
              : '像 WhatsApp 一样聊天'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f0f2f5]">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--color-text-muted)]">
              {locale === 'en'
                ? 'Start chatting with your AI brand coach...'
                : locale === 'ms'
                  ? 'Mula bersembang dengan jurulatih jenama AI...'
                  : '开始和 AI 品牌教练聊天吧...'}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white text-[var(--color-text)] rounded-bl-md border border-gray-200',
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-[var(--color-border)] bg-white px-4 py-3 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={onStartVoice}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          title={locale === 'en' ? 'Voice input' : locale === 'ms' ? 'Input suara' : '语音输入'}
        >
          <Mic className="h-4 w-4" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            locale === 'en'
              ? 'Type your message...'
              : locale === 'ms'
                ? 'Taip mesej...'
                : '输入消息...'
          }
          disabled={isTyping}
          className="flex-1 h-10 rounded-full border border-[var(--color-border)] px-4 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isTyping ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}
