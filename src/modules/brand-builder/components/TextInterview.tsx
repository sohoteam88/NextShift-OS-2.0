'use client';

import * as React from 'react';
import { Send, SkipForward } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  INTERVIEW_QUESTIONS,
  SKIPPABLE_QUESTIONS,
  type InterviewQuestion,
} from '../constants/interview-questions';

type Message = {
  role: 'ai' | 'user';
  text: string;
};

type ExtractedProfile = Record<string, unknown>;

type Props = {
  interviewId: string;
  language?: string;
  onComplete: (profile: ExtractedProfile) => void;
};

const GREETING: Record<string, string> = {
  zh: '你好！让我来了解你，帮你定位你的社交媒体品牌。',
  en: "Hi! Let me get to know you and help define your social media brand.",
  ms: 'Hai! Mari saya kenali anda untuk membantu membina jenama media sosial anda.',
};

async function saveAnswer(interviewId: string, questionId: string, answer: string) {
  await fetch(`/api/v1/brand-builder/interview/${interviewId}/answer`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question_id: questionId, answer }),
  });
}

async function triggerExtraction(interviewId: string): Promise<ExtractedProfile> {
  const res = await fetch(`/api/v1/brand-builder/interview/${interviewId}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const json = (await res.json()) as { data: ExtractedProfile };
  return json.data;
}

export function TextInterview({ interviewId, language = 'zh', onComplete }: Props) {
  const questions: InterviewQuestion[] = INTERVIEW_QUESTIONS[language] ?? INTERVIEW_QUESTIONS.zh;
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'ai', text: GREETING[language] ?? GREETING.zh },
    { role: 'ai', text: questions[0].text },
  ]);
  const [input, setInput] = React.useState('');
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [extracting, setExtracting] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isSkippable = SKIPPABLE_QUESTIONS.has(currentQuestion.id);

  async function submit(answer: string) {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);

    setMessages((prev) => [...prev, { role: 'user', text: answer }]);
    setInput('');
    setSelectedOption(null);

    await saveAnswer(interviewId, currentQuestion.id, answer);

    if (isLastQuestion) {
      setExtracting(true);
      setMessages((prev) => [...prev, { role: 'ai', text: '分析中，请稍等...' }]);
      try {
        const profile = await triggerExtraction(interviewId);
        onComplete(profile);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', text: '提取失败，请重试。' },
        ]);
        setExtracting(false);
      }
    } else {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setMessages((prev) => [...prev, { role: 'ai', text: questions[nextIndex].text }]);
    }

    setSubmitting(false);
  }

  async function skip() {
    await saveAnswer(interviewId, currentQuestion.id, '（已跳过）');
    if (isLastQuestion) {
      setExtracting(true);
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: '分析中，请稍等...' },
      ]);
      try {
        const profile = await triggerExtraction(interviewId);
        onComplete(profile);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', text: '提取失败，请重试。' },
        ]);
        setExtracting(false);
      }
    } else {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setMessages((prev) => [...prev, { role: 'ai', text: questions[nextIndex].text }]);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--color-text)]">AI 品牌顾问</p>
        <span className="text-xs text-[var(--color-text-muted)]">
          问题 {Math.min(currentIndex + 1, questions.length)}/{questions.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
          >
            {msg.role === 'ai' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs text-white">
                AI
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-[var(--radius-lg)] px-4 py-2.5 text-sm',
                msg.role === 'ai'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)]'
                  : 'bg-[var(--color-primary)] text-white',
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!extracting && (
        <div className="border-t border-[var(--color-border)] p-4 space-y-3">
          {currentQuestion.options && (
            <div className="flex flex-wrap gap-2">
              {currentQuestion.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedOption(selectedOption === opt ? null : opt)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    selectedOption === opt
                      ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]',
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void submit(selectedOption ? `${selectedOption}${input ? ` — ${input}` : ''}` : input);
                }
              }}
              placeholder={currentQuestion.options ? '其他...' : '输入你的回答...'}
              disabled={submitting}
              className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
            {isSkippable && (
              <button
                type="button"
                onClick={() => void skip()}
                disabled={submitting}
                title="跳过"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] disabled:opacity-60"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                void submit(selectedOption ? `${selectedOption}${input ? ` — ${input}` : ''}` : input)
              }
              disabled={(!input.trim() && !selectedOption) || submitting}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {extracting && (
        <div className="border-t border-[var(--color-border)] p-4 text-center text-sm text-[var(--color-text-muted)]">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />{' '}
          AI 正在分析你的品牌...
        </div>
      )}
    </div>
  );
}
