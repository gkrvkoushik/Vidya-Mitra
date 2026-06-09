import { useState, useEffect, useRef, useCallback } from 'react';
import { generateQuiz, submitQuiz } from '../api.js';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const QUIZ_DURATION = 30 * 60; // 30 minutes in seconds
const MAX_FULLSCREEN_EXITS = 3;

export default function Quiz({ user, firebaseUser }) {
  const [phase, setPhase] = useState('setup'); // setup | loading | active | result
  const [skill, setSkill] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION);
  const [fsExits, setFsExits] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef(null);
  const containerRef = useRef(null);
  const questionsRef = useRef(questions);
  const answersRef = useRef(answers);

  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const handleSubmit = useCallback(async (finalAnswers) => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    try {
      const res = await submitQuiz(
        firebaseUser.uid, skill, difficulty,
        questionsRef.current,
        finalAnswers || answersRef.current
      );
      setResult(res);
      setPhase('result');
    } catch (e) {
      setError(e.message);
      setPhase('result');
    } finally {
      setSubmitting(false);
    }
  }, [firebaseUser.uid, skill, difficulty, submitting]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'active') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(answersRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, handleSubmit]);

  // Fullscreen exit detection
  useEffect(() => {
    if (phase !== 'active') return;
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        setFsExits((prev) => {
          const next = prev + 1;
          if (next >= MAX_FULLSCREEN_EXITS) {
            handleSubmit(answersRef.current);
          }
          return next;
        });
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [phase, handleSubmit]);

  const enterFullscreen = () => {
    const el = containerRef.current || document.documentElement;
    el.requestFullscreen?.().catch(() => {});
  };

  const startQuiz = async () => {
    if (!skill.trim()) { setError('Please enter a skill.'); return; }
    setError('');
    setPhase('loading');
    try {
      const res = await generateQuiz(firebaseUser.uid, skill.trim(), difficulty);
      const qs = res.questions || [];
      if (qs.length === 0) throw new Error('No questions received. Try a different skill.');
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(-1));
      setCurrent(0);
      setTimeLeft(QUIZ_DURATION);
      setFsExits(0);
      setResult(null);
      setPhase('active');
      setTimeout(enterFullscreen, 100);
    } catch (e) {
      setError(e.message);
      setPhase('setup');
    }
  };

  const selectAnswer = (idx) => {
    setAnswers((prev) => { const a = [...prev]; a[current] = idx; return a; });
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const getBadge = (points) => {
    if (points >= 2500) return 'Master';
    if (points >= 1501) return 'Platinum';
    if (points >= 1001) return 'Diamond';
    if (points >= 501) return 'Gold';
    if (points >= 251) return 'Silver';
    return 'Bronze';
  };

  const BADGE_COLORS = {
    Bronze: '#CD7F32', Silver: '#C0C0C0', Gold: '#F59E0B',
    Diamond: '#60A5FA', Platinum: '#8A55FF', Master: '#EF4444',
  };

  // ── Setup Phase ──────────────────────────────────────────────────────────────
  if (phase === 'setup' || phase === 'loading') {
    return (
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Skill Quiz</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-dash-text-muted)', marginBottom: '1.5rem' }}>
          10 AI-generated MCQs · +5 correct · −1 wrong · 30 min · Fullscreen enforced
        </p>

        <div style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="edit-field-group">
            <label className="edit-field-label">Skill / Topic *</label>
            <input className="edit-field-input" placeholder="e.g. Python, Machine Learning, SQL..."
              value={skill} onChange={(e) => setSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startQuiz()} />
          </div>

          <div className="edit-field-group">
            <label className="edit-field-label">Difficulty</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {DIFFICULTIES.map((d) => (
                <button key={d} onClick={() => setDifficulty(d)}
                  style={{
                    padding: '0.5rem 1.25rem', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem',
                    border: `2px solid ${difficulty === d ? 'var(--color-dash-purple)' : 'var(--color-dash-border)'}`,
                    background: difficulty === d ? 'var(--color-dash-purple)' : 'transparent',
                    color: difficulty === d ? 'white' : 'var(--color-dash-text-muted)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="dash-section-card" style={{ padding: '1rem 1.25rem', flexDirection: 'row', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-dash-text-muted)', lineHeight: 1.5 }}>
              The quiz runs in <strong style={{ color: 'var(--color-dash-text)' }}>fullscreen mode</strong>.
              Exiting fullscreen <strong style={{ color: 'var(--color-dash-red)' }}>{MAX_FULLSCREEN_EXITS} times</strong> will auto-submit.
              You have <strong style={{ color: 'var(--color-dash-text)' }}>30 minutes</strong> to complete 10 questions.
            </div>
          </div>

          {error && <p className="edit-error-msg">{error}</p>}

          <button className="edit-save-btn" onClick={startQuiz}
            disabled={phase === 'loading'}
            style={{ alignSelf: 'flex-start', padding: '0.7rem 2rem' }}>
            {phase === 'loading' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner" /> Generating Quiz...
              </span>
            ) : 'Start Quiz →'}
          </button>
        </div>
      </div>
    );
  }

  // ── Active Quiz Phase ────────────────────────────────────────────────────────
  if (phase === 'active') {
    const q = questions[current];
    const isTimeLow = timeLeft < 120;
    const answered = answers.filter((a) => a !== -1).length;

    return (
      <div ref={containerRef} style={{
        minHeight: '100vh', background: 'var(--color-dash-bg)', color: 'var(--color-dash-text)',
        display: 'flex', flexDirection: 'column', padding: '1.5rem 2rem', gap: '1.5rem',
      }}>
        {/* Header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--color-dash-card)', borderRadius: 14, padding: '0.9rem 1.5rem',
          border: '1px solid var(--color-dash-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{skill}</span>
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20,
              background: difficulty === 'Easy' ? 'rgba(16,185,129,0.12)' : difficulty === 'Medium' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
              color: difficulty === 'Easy' ? 'var(--color-dash-green)' : difficulty === 'Medium' ? 'var(--color-dash-gold)' : 'var(--color-dash-red)',
            }}>{difficulty}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {fsExits > 0 && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-dash-red)' }}>
                ⚠ {MAX_FULLSCREEN_EXITS - fsExits} fullscreen exit{MAX_FULLSCREEN_EXITS - fsExits !== 1 ? 's' : ''} left
              </span>
            )}
            <span style={{
              fontSize: '1.1rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
              color: isTimeLow ? 'var(--color-dash-red)' : 'var(--color-dash-purple)',
              minWidth: 60,
            }}>
              ⏱ {formatTime(timeLeft)}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-dash-text-muted)', fontWeight: 600 }}>
              {answered}/{questions.length} answered
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {questions.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)} style={{
              flex: 1, height: 5, borderRadius: 4, cursor: 'pointer', transition: 'background 0.2s',
              background: i === current ? 'var(--color-dash-purple)'
                : answers[i] !== -1 ? 'var(--color-dash-green)'
                : 'var(--color-dash-border)',
            }} />
          ))}
        </div>

        {/* Question card */}
        <div className="dash-section-card" style={{ flex: 1, gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-dash-text-muted)', textTransform: 'uppercase' }}>
              Question {current + 1} of {questions.length}
            </span>
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.55 }}>{q.question}</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {q.options.map((opt, i) => {
              const sel = answers[current] === i;
              return (
                <button key={i} onClick={() => selectAnswer(i)} style={{
                  width: '100%', textAlign: 'left', padding: '0.9rem 1.25rem',
                  borderRadius: 12, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                  transition: 'all 0.15s', fontFamily: 'inherit',
                  border: `2px solid ${sel ? 'var(--color-dash-purple)' : 'var(--color-dash-border)'}`,
                  background: sel ? 'rgba(138,85,255,0.1)' : 'var(--color-dash-bg)',
                  color: sel ? 'var(--color-dash-purple)' : 'var(--color-dash-text)',
                }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 26, height: 26, borderRadius: '50%', marginRight: '0.75rem', fontSize: '0.78rem',
                    fontWeight: 800, flexShrink: 0,
                    background: sel ? 'var(--color-dash-purple)' : 'var(--color-dash-border)',
                    color: sel ? 'white' : 'var(--color-dash-text-muted)',
                  }}>
                    {['A', 'B', 'C', 'D'][i]}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="edit-cancel-btn" onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}>← Previous</button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {current < questions.length - 1 ? (
              <button className="edit-save-btn" onClick={() => setCurrent((c) => c + 1)}>Next →</button>
            ) : (
              <button className="edit-save-btn"
                style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}
                onClick={() => handleSubmit(answers)} disabled={submitting}>
                {submitting ? 'Submitting...' : '✓ Submit Quiz'}
              </button>
            )}
          </div>
        </div>

        {/* Question number grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{
              width: 36, height: 36, borderRadius: 8, fontWeight: 800, fontSize: '0.8rem',
              cursor: 'pointer', transition: 'all 0.15s', border: 'none',
              background: i === current ? 'var(--color-dash-purple)'
                : answers[i] !== -1 ? 'rgba(16,185,129,0.15)'
                : 'var(--color-dash-card)',
              color: i === current ? 'white'
                : answers[i] !== -1 ? 'var(--color-dash-green)'
                : 'var(--color-dash-text-muted)',
              boxShadow: i === current ? '0 2px 8px rgba(138,85,255,0.3)' : 'none',
            }}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Result Phase ─────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const badge = result ? getBadge(result.total_points) : null;
    const badgeColor = badge ? BADGE_COLORS[badge] : '#888';

    return (
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Quiz Results</h2>

        {error && !result && <p className="edit-error-msg" style={{ marginBottom: '1rem' }}>{error}</p>}

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 700 }}>
            {/* Score banner */}
            <div className="dash-section-card" style={{
              background: 'linear-gradient(135deg, rgba(138,85,255,0.08) 0%, rgba(138,85,255,0.02) 100%)',
              border: '2px solid var(--color-dash-purple)', flexDirection: 'row', alignItems: 'center',
              gap: '2rem', padding: '1.75rem 2rem',
            }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-dash-purple)', lineHeight: 1 }}>
                  {result.score_percentage}%
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-dash-text-muted)', marginTop: 4 }}>Score</div>
              </div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'Correct', value: result.correct, color: 'var(--color-dash-green)', icon: '✓' },
                  { label: 'Wrong', value: result.wrong, color: 'var(--color-dash-red)', icon: '✗' },
                  { label: 'Skipped', value: result.unattempted, color: 'var(--color-dash-text-muted)', icon: '—' },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{icon} {value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-dash-text-muted)' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Points & Badge */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="dash-kpi-card">
                <span className="dash-kpi-title">Points Earned</span>
                <span className="dash-kpi-value-huge" style={{ color: 'var(--color-dash-purple)' }}>
                  +{result.points_earned}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-dash-text-muted)' }}>
                  Total: {result.total_points} pts
                </span>
              </div>
              <div className="dash-kpi-card">
                <span className="dash-kpi-title">Current Badge</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: badgeColor, marginTop: '0.25rem' }}>
                  🏅 {badge}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-dash-text-muted)' }}>
                  {result.total_points} total points
                </span>
              </div>
            </div>

            {/* Review answers */}
            <div className="dash-section-card">
              <span className="dash-kpi-title" style={{ marginBottom: '1rem' }}>Answer Review</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {questions.map((q, i) => {
                  const userAns = answers[i];
                  const isCorrect = userAns === q.correct_index;
                  const isSkipped = userAns === -1;
                  return (
                    <div key={i} style={{
                      padding: '1rem 1.25rem', borderRadius: 12,
                      borderLeft: `4px solid ${isSkipped ? 'var(--color-dash-border)' : isCorrect ? 'var(--color-dash-green)' : 'var(--color-dash-red)'}`,
                      background: 'var(--color-dash-bg)',
                    }}>
                      <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                        {i + 1}. {q.question}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: isSkipped ? 'var(--color-dash-text-muted)' : isCorrect ? 'var(--color-dash-green)' : 'var(--color-dash-red)' }}>
                        {isSkipped ? '— Skipped'
                          : isCorrect ? `✓ ${q.options[userAns]}`
                          : `✗ You: ${q.options[userAns]} · Correct: ${q.options[q.correct_index]}`}
                      </p>
                      {q.explanation && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--color-dash-text-muted)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="edit-save-btn" onClick={() => {
            setPhase('setup'); setQuestions([]); setAnswers([]);
            setResult(null); setError(''); setSkill('');
          }}>
            Take Another Quiz →
          </button>
          <button className="edit-cancel-btn" onClick={() => setPhase('setup')}>
            ← Change Settings
          </button>
        </div>
      </div>
    );
  }

  return null;
}
