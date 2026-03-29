'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import DashboardHeader from '@/components/layout/DashboardHeader';

type Question = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};
type Attempt = {
  id: string; score: number; total: number; created_at: string; answers: any;
};

const USER_NAV = [
  { label: 'Overview', href: '/user' },
  { label: 'Courses', href: '/user/courses' },
  { label: 'Materials', href: '/user/materials' },
  { label: 'Quizzes', href: '/user/quizzes' },
  { label: 'Sessions', href: '/user/sessions' },
];

const FIFA_TOPICS = [
  { value: '', label: 'Random Mix (Recommended)' },
  { value: 'FIFA Agent Regulations and licensing requirements', label: 'Agent Licensing' },
  { value: 'FIFA Football Agent Examination rules and procedures', label: 'Exam Rules & Procedures' },
  { value: 'Representation contracts between agents and players', label: 'Representation Contracts' },
  { value: 'FIFA Transfer Matching System (TMS)', label: 'Transfer Matching System' },
  { value: 'Transfer windows and international transfer certificates', label: 'Transfers & ITC' },
  { value: 'Training compensation and solidarity mechanism', label: 'Training Compensation' },
  { value: 'FIFA Dispute Resolution Chamber', label: 'Dispute Resolution' },
  { value: 'Contract stability and unilateral termination', label: 'Contract Stability' },
  { value: 'FIFA Clearing House regulations', label: 'FIFA Clearing House' },
  { value: 'FIFA Code of Ethics for agents', label: 'Code of Ethics' },
  { value: 'Minor player transfer regulations', label: 'Minor Player Transfers' },
];

type Phase = 'menu' | 'loading' | 'quiz' | 'results';

export default function UserQuizzesClient({ userId, attempts: initialAttempts }: { userId: string; attempts: Attempt[] }) {
  const [phase, setPhase] = useState<Phase>('menu');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ question: string; selected: string; correct: string; explanation: string; isCorrect: boolean }[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>(initialAttempts);
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [generatedTopics, setGeneratedTopics] = useState<string[]>([]);

  async function startQuiz() {
    setPhase('loading');
    setError(null);
    setAnswers([]);
    setCurrent(0);
    setSelected(null);
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic || null, count: questionCount }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'Failed to generate quiz');
      setQuestions(data.questions);
      setGeneratedTopics(data.topics ?? []);
      setPhase('quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz. Please try again.');
      setPhase('menu');
    }
  }

  function handleAnswer(option: string) {
    if (selected) return;
    setSelected(option);
    setShowExplanation(true);
  }

  function handleNext() {
    const q = questions[current];
    const isCorrect = selected === q.correct_answer;
    const newAnswers = [...answers, {
      question: q.question,
      selected: selected ?? '',
      correct: q.correct_answer,
      explanation: q.explanation,
      isCorrect,
    }];
    setAnswers(newAnswers);
    setSelected(null);
    setShowExplanation(false);

    if (current + 1 >= questions.length) {
      finishQuiz(newAnswers);
    } else {
      setCurrent(c => c + 1);
    }
  }

  async function finishQuiz(finalAnswers: typeof answers) {
    const score = finalAnswers.filter(a => a.isCorrect).length;
    const total = finalAnswers.length;
    setPhase('results');
    try {
      const supabase = createClient();
      const { data } = await supabase.from('quiz_attempts').insert({
        user_id: userId,
        score,
        total,
        answers: finalAnswers,
      }).select().single();
      if (data) setAttempts(prev => [data, ...prev]);
    } catch {}
  }

  const score = answers.filter(a => a.isCorrect).length;
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  // ── MENU ──
  if (phase === 'menu') return (
    <div className="dash-layout">
      <DashboardHeader navItems={USER_NAV} activeNav="/user/quizzes" />
      <div className="dash-content">
        <div className="page-header">
          <div className="eyebrow">AI-Powered Practice</div>
          <h1>FIFA Agent Exam Quiz</h1>
          <p>Generate fresh multiple choice questions instantly using AI. Every quiz is unique.</p>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 20 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 800 }}>
          {/* Quiz config card */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: 20 }}>Configure Your Quiz</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Topic Focus</label>
                <select value={topic} onChange={e => setTopic(e.target.value)}>
                  {FIFA_TOPICS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Number of Questions</label>
                <select value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}>
                  <option value={5}>5 questions — Quick practice</option>
                  <option value={10}>10 questions — Standard</option>
                  <option value={15}>15 questions — Extended</option>
                  <option value={20}>20 questions — Full mock</option>
                </select>
              </div>
            </div>
            <button onClick={startQuiz} className="btn btn-primary" style={{ padding: '13px 32px' }}>
              Generate Quiz with AI →
            </button>
          </div>

          {/* Stats */}
          <div className="stat-card">
            <div className="stat-label">Quizzes Taken</div>
            <div className="stat-value">{attempts.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Best Score</div>
            <div className="stat-value">
              {attempts.length > 0
                ? `${Math.max(...attempts.map(a => Math.round((a.score / a.total) * 100)))}%`
                : '—'}
            </div>
          </div>
        </div>

        {/* History */}
        {attempts.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div className="section-header" style={{ marginBottom: 14 }}>
              <h2>Recent Attempts</h2>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Date</th><th>Score</th><th>Result</th><th>Questions</th></tr>
                </thead>
                <tbody>
                  {attempts.map(a => {
                    const p = Math.round((a.score / a.total) * 100);
                    return (
                      <tr key={a.id}>
                        <td style={{ fontFamily: "'Saira', sans-serif", color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>{new Date(a.created_at).toLocaleDateString()}</td>
                        <td style={{ fontFamily: "'Saira', sans-serif", fontWeight: 700, fontSize: '0.85rem' }}>{a.score}/{a.total}</td>
                        <td>
                          <span className={`badge ${p >= 70 ? 'badge-active' : p >= 50 ? 'badge-pending' : 'badge-suspended'}`}>
                            {p}% — {p >= 70 ? 'Pass' : p >= 50 ? 'Close' : 'Fail'}
                          </span>
                        </td>
                        <td style={{ fontFamily: "'Saira', sans-serif", color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>{a.total} questions</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── LOADING ──
  if (phase === 'loading') return (
    <div style={{ minHeight: '100vh', background: 'var(--teal)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div style={{ width: 48, height: 48, border: '3px solid rgba(247,188,21,0.2)', borderTop: '3px solid var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontFamily: "'Saira', sans-serif", color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Generating your quiz...</div>
      <div style={{ fontFamily: "'Saira', sans-serif", color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', fontWeight: 300, lineHeight: 1.8 }}>AI is creating fresh questions</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── QUIZ ──
  if (phase === 'quiz') {
    const q = questions[current];
    const progress = ((current) / questions.length) * 100;
    return (
      <div style={{ minHeight: '100vh', background: 'var(--teal)', display: 'flex', flexDirection: 'column' }}>
        {/* Quiz header */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(247,188,21,0.1)' }}>
          <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.02em', lineHeight: 1, color: '#fff', textTransform: 'uppercase' }}>
            Mentor<span style={{ color: 'var(--gold)' }}>ia</span>
          </div>
          <div style={{ fontFamily: "'Saira', sans-serif", fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
            Question {current + 1} of {questions.length}
          </div>
          <button onClick={() => setPhase('menu')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 3, padding: '6px 14px', color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Saira', sans-serif" }}>
            Exit
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.1)' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gold)', transition: 'width 0.3s' }} />
        </div>

        {/* Question */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 5%' }}>
          <div style={{ width: '100%', maxWidth: 680 }}>
            <div style={{ fontFamily: "'Saira', sans-serif", color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>
              FIFA Agent Exam Practice
            </div>
            <h2 style={{ fontFamily: "'Saira Condensed', sans-serif", fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1.2, color: '#fff', marginBottom: 32, textTransform: 'none' }}>
              {q.question}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {q.options.map((option, i) => {
                const isSelected = selected === option;
                const isCorrect = option === q.correct_answer;
                let bg = 'rgba(255,255,255,0.05)';
                let border = '1.5px solid rgba(255,255,255,0.1)';
                let color = 'rgba(255,255,255,0.85)';
                if (selected) {
                  if (isCorrect) { bg = 'rgba(56,161,105,0.2)'; border = '1.5px solid #38a169'; color = '#fff'; }
                  else if (isSelected) { bg = 'rgba(229,62,62,0.2)'; border = '1.5px solid #e53e3e'; color = '#fff'; }
                  else { bg = 'rgba(255,255,255,0.03)'; color = 'rgba(255,255,255,0.35)'; }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(option)} disabled={!!selected}
                    style={{ background: bg, border, borderRadius: 3, padding: '14px 18px', textAlign: 'left', cursor: selected ? 'default' : 'pointer', color, fontFamily: "'Saira', sans-serif", fontSize: '0.9rem', fontWeight: 400, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', border: `1.5px solid ${selected ? (isCorrect ? '#38a169' : isSelected ? '#e53e3e' : 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0, color: selected ? (isCorrect ? '#38a169' : isSelected ? '#e53e3e' : 'rgba(255,255,255,0.2)') : 'rgba(255,255,255,0.5)' }}>
                      {['A','B','C','D'][i]}
                    </span>
                    {option.replace(/^[A-D]\.\s*/, '')}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div style={{ background: 'rgba(247,188,21,0.08)', borderLeft: '3px solid var(--gold)', borderRadius: '0 3px 3px 0', padding: '14px 18px', marginBottom: 20, fontFamily: "'Saira', sans-serif", fontSize: '0.82rem', fontWeight: 400, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)' }}>
                <div style={{ fontFamily: "'Saira', sans-serif", color: 'var(--gold)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Explanation</div>
                {q.explanation}
              </div>
            )}

            {selected && (
              <button onClick={handleNext} className="btn btn-primary">
                {current + 1 >= questions.length ? 'See Results →' : 'Next Question →'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS ──
  if (phase === 'results') return (
    <div style={{ minHeight: '100vh', background: 'var(--teal)', padding: '48px 5%' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: "'Saira', sans-serif", color: 'var(--gold)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 12 }}>Quiz Complete</div>
          <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontWeight: 900, fontSize: 'clamp(3rem,8vw,5rem)', lineHeight: 1, color: pct >= 70 ? '#68d391' : pct >= 50 ? 'var(--gold)' : '#fc8181' }}>
            {pct}%
          </div>
          <div style={{ fontFamily: "'Saira', sans-serif", color: 'rgba(255,255,255,0.6)', fontSize: '1rem', fontWeight: 300, lineHeight: 1.75, marginTop: 8 }}>
            {score} correct out of {questions.length} questions
          </div>
          <div style={{ marginTop: 12 }}>
            <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 3, fontFamily: "'Saira', sans-serif", fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', background: pct >= 70 ? 'rgba(56,161,105,0.2)' : pct >= 50 ? 'rgba(247,188,21,0.15)' : 'rgba(229,62,62,0.2)', color: pct >= 70 ? '#68d391' : pct >= 50 ? 'var(--gold)' : '#fc8181' }}>
              {pct >= 70 ? '✓ Exam Ready' : pct >= 50 ? 'Keep Practising' : 'More Study Needed'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 40 }}>
          <button onClick={startQuiz} className="btn btn-primary">Try Again →</button>
          <button onClick={() => setPhase('menu')} className="btn btn-outline" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}>Back to Menu</button>
        </div>

        {/* Answer review */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: "'Saira', sans-serif", color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16 }}>Answer Review</div>
          {answers.map((a, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${a.isCorrect ? 'rgba(56,161,105,0.3)' : 'rgba(229,62,62,0.3)'}`, borderRadius: 3, padding: '16px 20px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: a.isCorrect ? '#68d391' : '#fc8181', flexShrink: 0, marginTop: 2 }}>{a.isCorrect ? '✓' : '✗'}</span>
                <div style={{ fontFamily: "'Saira', sans-serif", fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontWeight: 400 }}>{a.question}</div>
              </div>
              {!a.isCorrect && (
                <div style={{ fontFamily: "'Saira', sans-serif", fontSize: '0.78rem', fontWeight: 400, color: '#fc8181', marginBottom: 6, marginLeft: 24 }}>
                  Your answer: {a.selected.replace(/^[A-D]\.\s*/, '')}
                </div>
              )}
              <div style={{ fontFamily: "'Saira', sans-serif", fontSize: '0.78rem', fontWeight: 400, color: '#68d391', marginBottom: 8, marginLeft: 24 }}>
                {a.isCorrect ? 'Correct: ' : 'Correct answer: '}{a.correct.replace(/^[A-D]\.\s*/, '')}
              </div>
              <div style={{ fontFamily: "'Saira', sans-serif", fontSize: '0.78rem', fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginLeft: 24, lineHeight: 1.5 }}>{a.explanation}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return null;
}
