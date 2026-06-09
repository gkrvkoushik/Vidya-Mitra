import { useState, useEffect } from 'react';
import { getProgress, getQuizHistory } from '../api.js';

const BADGE_ORDER = ['Bronze', 'Silver', 'Gold', 'Diamond', 'Platinum', 'Master'];
const BADGE_THRESHOLDS = { Bronze: 0, Silver: 251, Gold: 501, Diamond: 1001, Platinum: 1501, Master: 2500 };
const BADGE_COLORS = {
  Bronze: '#CD7F32', Silver: '#C0C0C0', Gold: '#F59E0B',
  Diamond: '#60A5FA', Platinum: '#8A55FF', Master: '#EF4444',
};
const BADGE_ICONS = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Diamond: '💎', Platinum: '🔮', Master: '👑' };

function nextBadgeInfo(badge, totalPoints) {
  const idx = BADGE_ORDER.indexOf(badge);
  if (idx === BADGE_ORDER.length - 1) return null;
  const next = BADGE_ORDER[idx + 1];
  return { name: next, required: BADGE_THRESHOLDS[next], gap: BADGE_THRESHOLDS[next] - totalPoints };
}

export default function Progress({ user, firebaseUser }) {
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProgress(firebaseUser.uid),
      getQuizHistory(firebaseUser.uid),
    ]).then(([p, h]) => {
      setProgress(p);
      setHistory(h.history || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [firebaseUser.uid]);

  if (loading) return <div className="dash-kpi-title" style={{ padding: '2rem' }}>Loading progress...</div>;

  const pts = progress?.total_points || 0;
  const badge = progress?.badge || 'Bronze';
  const badgeColor = BADGE_COLORS[badge];
  const next = nextBadgeInfo(badge, pts);
  const curThreshold = BADGE_THRESHOLDS[badge];
  const nextThreshold = next ? next.required : pts;
  const fillPct = next ? Math.min(100, ((pts - curThreshold) / (nextThreshold - curThreshold)) * 100) : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Progress Tracker</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-dash-text-muted)' }}>
          Track your learning journey, quiz performance, and badge level.
        </p>
      </div>

      {/* Top KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { title: 'Total Points', value: pts, sub: 'earned from quizzes', color: 'var(--color-dash-purple)' },
          { title: 'Quizzes Taken', value: progress?.quizzes_attempted || 0, sub: 'attempts', color: 'var(--color-dash-blue)' },
          { title: 'Avg Score', value: `${progress?.average_score || 0}%`, sub: 'across all quizzes', color: 'var(--color-dash-green)' },
          { title: 'Roadmap', value: `${progress?.roadmap_progress || 0}%`, sub: 'completed', color: 'var(--color-dash-gold)' },
        ].map(({ title, value, sub, color }) => (
          <div key={title} className="dash-kpi-card">
            <span className="dash-kpi-title">{title}</span>
            <span className="dash-kpi-value-huge" style={{ color }}>{value}</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-dash-text-muted)' }}>{sub}</span>
          </div>
        ))}
      </div>

      {/* Badge Progress */}
      <div className="dash-section-card">
        <span className="dash-kpi-title" style={{ marginBottom: '1rem' }}>Badge Progress</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '2rem', flexShrink: 0,
            background: `radial-gradient(circle, ${badgeColor}22, transparent)`,
            border: `3px solid ${badgeColor}`,
          }}>
            {BADGE_ICONS[badge]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: badgeColor }}>{badge}</span>
              {next && (
                <span style={{ fontSize: '0.78rem', color: 'var(--color-dash-text-muted)' }}>
                  {next.gap} pts to {next.name} {BADGE_ICONS[next.name]}
                </span>
              )}
            </div>
            <div className="skills-progressbar-base" style={{ height: 10 }}>
              <div className="skills-progressbar-fill" style={{
                width: `${fillPct}%`, backgroundColor: badgeColor, transition: 'width 1s ease-out',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.68rem', color: 'var(--color-dash-text-muted)' }}>
              <span>{curThreshold} pts</span>
              {next && <span>{next.required} pts</span>}
            </div>
          </div>
        </div>

        {/* Badge ladder */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {BADGE_ORDER.map((b) => {
            const earned = BADGE_THRESHOLDS[b] <= pts;
            return (
              <div key={b} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                padding: '0.6rem 0.75rem', borderRadius: 12, flex: 1, minWidth: 70,
                border: `2px solid ${b === badge ? BADGE_COLORS[b] : 'var(--color-dash-border)'}`,
                background: b === badge ? `${BADGE_COLORS[b]}15` : 'transparent',
                opacity: earned ? 1 : 0.4,
              }}>
                <span style={{ fontSize: '1.2rem' }}>{BADGE_ICONS[b]}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: earned ? BADGE_COLORS[b] : 'var(--color-dash-text-muted)' }}>{b}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--color-dash-text-muted)' }}>{BADGE_THRESHOLDS[b]}+</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quiz History */}
      <div className="dash-section-card">
        <span className="dash-kpi-title" style={{ marginBottom: '1rem' }}>Recent Quiz History</span>
        {history.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--color-dash-text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            No quizzes attempted yet. Take a quiz to see your history here!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {history.map((h, i) => {
              const score = h.score || 0;
              const scoreColor = score >= 70 ? 'var(--color-dash-green)' : score >= 40 ? 'var(--color-dash-gold)' : 'var(--color-dash-red)';
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem',
                  borderRadius: 12, background: 'var(--color-dash-bg)',
                  border: '1px solid var(--color-dash-border)',
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${scoreColor}18`, flexShrink: 0 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: scoreColor }}>{Math.round(score)}%</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{h.skill}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-dash-text-muted)' }}>
                      {h.difficulty} · ✓{h.correctAnswers} ✗{h.wrongAnswers} —{h.unattempted}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-dash-purple)' }}>
                      +{h.pointsEarned} pts
                    </div>
                    {h.createdAt?.seconds && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-dash-text-muted)' }}>
                        {new Date(h.createdAt.seconds * 1000).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
