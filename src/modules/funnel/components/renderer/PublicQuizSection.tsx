'use client';
import { useState } from 'react';
import type { QuizConfig, FunnelTheme } from '../../types';

type Props = {
  quiz: QuizConfig;
  theme: FunnelTheme;
  funnelSlug: string;
  funnelId: string;
  funnelTitle: string;
  whatsappPhone?: string;
};

type Phase = 'quiz' | 'capture' | 'result';

export function PublicQuizSection({ quiz, theme, funnelSlug, funnelId, funnelTitle, whatsappPhone }: Props) {
  const [phase, setPhase] = useState<Phase>('quiz');
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [captureValues, setCaptureValues] = useState({ name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [redirect, setRedirect] = useState('');

  const totalScore = scores.reduce((a, b) => a + b, 0);
  const result = quiz.results.find(r => totalScore >= r.min_score && totalScore <= r.max_score)
    ?? quiz.results[quiz.results.length - 1];

  function pickOption(score: number) {
    const next = [...scores, score];
    setScores(next);
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setPhase(quiz.capture_before_results ? 'capture' : 'result');
    }
  }

  async function handleCapture(e: React.FormEvent) {
    e.preventDefault();
    if (!submitted && captureValues.name) {
      setSubmitting(true);
      try {
        const res = await fetch(`/api/v1/public/funnel/${funnelSlug}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: captureValues.name,
            phone: captureValues.phone,
            source_funnel_id: funnelId,
            website: '',
            quiz_result: { score: totalScore, title: result?.title ?? '' },
          }),
        });
        const json = await res.json();
        setRedirect(json.data?.whatsapp_redirect ?? '');
        setSubmitted(true);
      } catch { /* silent */ }
      finally { setSubmitting(false); }
    }
    setPhase('result');
  }

  const progress = phase === 'quiz' ? ((currentQ + 1) / quiz.questions.length) * 100 : 100;

  if (phase === 'quiz') {
    const q = quiz.questions[currentQ];
    return (
      <div className="px-6 py-8">
        {/* Progress bar */}
        <div className="mb-4 h-2 w-full rounded-full bg-gray-200">
          <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: theme.primary_color }} />
        </div>
        <p className="mb-1 text-xs text-gray-500">问题 {currentQ + 1} / {quiz.questions.length}</p>
        <h3 className="mb-6 text-lg font-bold text-gray-900">{q.text}</h3>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => pickOption(opt.score)}
              className="w-full rounded-xl border-2 border-gray-200 px-5 py-4 text-left text-sm font-medium text-gray-800 transition-colors hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98]">
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'capture') {
    return (
      <div className="px-6 py-8">
        <h3 className="mb-2 text-xl font-bold text-gray-900 text-center">🎉 测试完成！</h3>
        <p className="mb-6 text-center text-sm text-gray-500">输入你的信息，立即查看你的专属结果</p>
        <form onSubmit={handleCapture} className="space-y-4">
          <input name="website" type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" readOnly value="" />
          <input required placeholder="你的姓名" value={captureValues.name}
            onChange={e => setCaptureValues(v => ({ ...v, name: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" />
          <input placeholder="电话（可选）" value={captureValues.phone} type="tel"
            onChange={e => setCaptureValues(v => ({ ...v, phone: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" />
          <button type="submit" disabled={submitting}
            className="w-full rounded-full py-4 text-base font-bold text-white"
            style={{ backgroundColor: theme.primary_color }}>
            {submitting ? '处理中...' : '查看我的结果 →'}
          </button>
        </form>
      </div>
    );
  }

  // Result
  return (
    <div className="px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
        style={{ backgroundColor: theme.primary_color + '20' }}>🏆</div>
      <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: theme.primary_color }}>你的结果</p>
      <h3 className="mt-2 text-2xl font-bold text-gray-900">{result?.title}</h3>
      <p className="mt-3 text-gray-600">{result?.description}</p>
      <p className="mt-2 text-xs text-gray-400">总分: {totalScore}</p>

      <div className="mt-8 space-y-3">
        {(result?.cta_target || whatsappPhone) && (
          <a href={redirect || (whatsappPhone ? `https://wa.me/${whatsappPhone.replace(/\D/g, '')}` : '#')}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-bold text-white"
            style={{ backgroundColor: theme.primary_color }}>
            📱 {result?.cta_text || '立即咨询'}
          </a>
        )}
      </div>
    </div>
  );
}
