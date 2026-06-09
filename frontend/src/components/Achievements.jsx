import { useState, useEffect } from 'react';
import { getProgress, getQuizHistory } from '../api.js';

const BADGES = [
  { name: 'Bronze', icon: '🥉', min: 0, max: 250, color: '#CD7F32', desc: 'Starting your journey' },
  { name: 'Silver', icon: '🥈', min: 251, max: 500, color: '#C0C0C0', desc: 'Building momentum' },
  { name: 'Gold', icon: '🥇', min: 501, max: 1000, color: '#F59E0B', desc: 'Consistent learner' },
  { name: 'Diamond', icon: '💎', min: 1001, max: 1500, color: '#60A5FA', desc: 'Knowledge seeker' },
  { name: 'Platinum', icon: '🔮', min: 1501, max: 2499, color: '#8A55FF', desc: 'Elite performer' },
  { name: 'Master', icon: '👑', min: 2500, max: Infinity, color: '#EF4444', desc: 'Ultimate champion' },
];

export default function Achievements({ firebaseUser }) {
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProgress(firebaseUser.uid), getQuizHistory(firebaseUser.uid)])
      .then(([p, h]) => { setProgress(p); setHistory(h.history || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [firebaseUser.uid]);

  if (loading) return <div className="dash-kpi-title" style={{ padding: '2rem' }}>Loading achievements...</div>;

  const pts = progress?.total_points || 0;
  const badge = progress?.badge || 'Bronze';
  const skillsAttempted = [...new Set(history.map((h) => h.skill))];
  const perfectQuizzes = history.filter((h) => h.score === 100).length;
  const totalQuizzes = history.length;

  const milestones = [
    { label: 'First Quiz', icon: '🎯', earned: totalQuizzes >= 1 },
    { label: '5 Quizzes', icon: '📚', earned: totalQuizzes >= 5 },
    { label: '10 Quizzes', icon: '🔟', earned: totalQuizzes >= 10 },
    { label: 'Perfect Score', icon: '💯', earned: perfectQuizzes >= 1 },
    { label: '3 Skills', icon: '🧠', earned: skillsAttempted.length >= 3 },
    { label: '500 Points', icon: '⭐', earned: pts >= 500 },
    { label: '1000 Points', icon: '🌟', earned: pts >= 1000 },
    { label: '2500 Points', icon: '🔥', earned: pts >= 2500 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Achievements</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-dash-text-muted)' }}>
          Your earned badges and learning milestones.
        </p>
      </div>

      {/* Active Badge showcase */}
      <div className="dash-section-card" style={{
        background: 'linear-gradient(135deg, rgba(138,85,255,0.06) 0%, transparent 100%)',
        border: '2px solid var(--color-dash-purple)', alignItems: 'center', gap: '1rem',
        flexDirection: 'row', padding: '2rem',
      }}>
        {(() => {
          const b = BADGES.find((b) => b.name === badge) || BADGES[0];
          return (
            <>
              <div style={{
                width: 90, height: 90, borderRadius: '50%', fontSize: '2.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `radial-gradient(circle, ${b.color}22, transparent)`,
                border: `4px solid ${b.color}`, flexShrink: 0,
              }}>
                {b.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-dash-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Badge</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: b.color, lineHeight: 1.2 }}>{b.name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-dash-text-muted)' }}>{b.desc} · {pts} total points</div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Badge ladder */}
      <div className="dash-section-card">
        <span className="dash-kpi-title" style={{ marginBottom: '1.25rem' }}>Badge Levels</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {BADGES.map((b) => {
            const earned = pts >= b.min;
            const active = badge === b.name;
            return (
              <div key={b.name} style={{
                padding: '1.25rem', borderRadius: 14, textAlign: 'center',
                border: `2px solid ${active ? b.color : earned ? `${b.color}50` : 'var(--color-dash-border)'}`,
                background: active ? `${b.color}12` : 'transparent',
                opacity: earned ? 1 : 0.45,
                transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{b.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: earned ? b.color : 'var(--color-dash-text-muted)' }}>{b.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-dash-text-muted)', marginTop: '0.2rem' }}>
                  {b.max === Infinity ? `${b.min}+ pts` : `${b.min}–${b.max} pts`}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-dash-text-muted)', marginTop: '0.2rem' }}>{b.desc}</div>
                {active && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: b.color, background: `${b.color}18`, borderRadius: 20, padding: '2px 8px', display: 'inline-block' }}>
                    Current
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestone achievements */}
      <div className="dash-section-card">
        <span className="dash-kpi-title" style={{ marginBottom: '1.25rem' }}>Milestones</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem' }}>
          {milestones.map(({ label, icon, earned }) => (
            <div key={label} style={{
              padding: '1rem', borderRadius: 12, textAlign: 'center',
              border: `2px solid ${earned ? 'var(--color-dash-green)' : 'var(--color-dash-border)'}`,
              background: earned ? 'rgba(16,185,129,0.08)' : 'transparent',
              opacity: earned ? 1 : 0.45,
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>{icon}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: earned ? 'var(--color-dash-green)' : 'var(--color-dash-text-muted)' }}>
                {earned ? '✓ ' : ''}{label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
