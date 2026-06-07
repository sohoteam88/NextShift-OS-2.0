'use client';
import { Plus, Trash2 } from 'lucide-react';
import type { QuizConfig, QuizQuestion, QuizResult } from '../../types';

type Props = { value: QuizConfig; onChange: (v: QuizConfig) => void };

export function QuizEditor({ value, onChange }: Props) {
  // Questions
  const addQ = () => onChange({ ...value, questions: [...value.questions, { text: '', options: [{ text: '', score: 1 }] }] });
  const removeQ = (qi: number) => onChange({ ...value, questions: value.questions.filter((_, j) => j !== qi) });
  const setQ = (qi: number, q: QuizQuestion) => {
    const qs = [...value.questions];
    qs[qi] = q;
    onChange({ ...value, questions: qs });
  };

  // Results
  const addR = () => onChange({ ...value, results: [...value.results, { min_score: 0, max_score: 10, title: '', description: '' }] });
  const removeR = (ri: number) => onChange({ ...value, results: value.results.filter((_, j) => j !== ri) });
  const setR = (ri: number, r: QuizResult) => {
    const rs = [...value.results];
    rs[ri] = r;
    onChange({ ...value, results: rs });
  };

  return (
    <div className="space-y-5 py-3">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value.capture_before_results} onChange={e => onChange({ ...value, capture_before_results: e.target.checked })} className="rounded" />
        显示结果前收集用户信息
      </label>

      {/* Questions */}
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-700">测试题目</p>
        <div className="space-y-4">
          {value.questions.map((q, qi) => (
            <div key={qi} className="rounded border border-gray-200 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input className={inp} placeholder={`问题 ${qi + 1}`} value={q.text} onChange={e => setQ(qi, { ...q, text: e.target.value })} />
                <button onClick={() => removeQ(qi)} className="text-red-400 shrink-0"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="space-y-1 pl-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input className={`${inp} flex-1`} placeholder="选项文字" value={opt.text}
                      onChange={e => { const opts = [...q.options]; opts[oi] = { ...opts[oi], text: e.target.value }; setQ(qi, { ...q, options: opts }); }} />
                    <input type="number" className="w-16 rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="分数" value={opt.score}
                      onChange={e => { const opts = [...q.options]; opts[oi] = { ...opts[oi], score: Number(e.target.value) }; setQ(qi, { ...q, options: opts }); }} />
                    <button onClick={() => setQ(qi, { ...q, options: q.options.filter((_, j) => j !== oi) })} className="text-red-400 text-xs">✕</button>
                  </div>
                ))}
                <button onClick={() => setQ(qi, { ...q, options: [...q.options, { text: '', score: 1 }] })}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"><Plus className="h-3 w-3" />添加选项</button>
              </div>
            </div>
          ))}
          <button onClick={addQ} className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><Plus className="h-4 w-4" />添加问题</button>
        </div>
      </div>

      {/* Results */}
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-700">测试结果</p>
        <div className="space-y-3">
          {value.results.map((r, ri) => (
            <div key={ri} className="rounded border border-gray-200 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">分数区间</span>
                <input type="number" className="w-16 rounded border border-gray-300 px-2 py-1 text-sm" value={r.min_score} onChange={e => setR(ri, { ...r, min_score: Number(e.target.value) })} />
                <span className="text-xs">-</span>
                <input type="number" className="w-16 rounded border border-gray-300 px-2 py-1 text-sm" value={r.max_score} onChange={e => setR(ri, { ...r, max_score: Number(e.target.value) })} />
                <button onClick={() => removeR(ri)} className="ml-auto text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
              <input className={inp} placeholder="结果标题" value={r.title} onChange={e => setR(ri, { ...r, title: e.target.value })} />
              <textarea className={inp} rows={2} placeholder="结果描述" value={r.description} onChange={e => setR(ri, { ...r, description: e.target.value })} />
              <input className={inp} placeholder="CTA 按钮文字（可选）" value={r.cta_text ?? ''} onChange={e => setR(ri, { ...r, cta_text: e.target.value })} />
            </div>
          ))}
          <button onClick={addR} className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><Plus className="h-4 w-4" />添加结果</button>
        </div>
      </div>
    </div>
  );
}
const inp = 'w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';
