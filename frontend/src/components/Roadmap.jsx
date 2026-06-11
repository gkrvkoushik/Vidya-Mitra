import { useState, useEffect, useRef } from 'react';
import { generateRoadmap, getAllRoadmaps, getSkillsContext, post, deleteRoadmap } from '../api.js';

const PACES = ['Slow', 'Moderate', 'Fast'];
const PACE_DESC = { Slow: '12 weeks', Moderate: '8 weeks', Fast: '5 weeks' };
const PACE_COLOR = {
  Slow: 'var(--color-dash-blue)',
  Moderate: 'var(--color-dash-purple)',
  Fast: 'var(--color-dash-red)',
};
const DIFF_COLOR = {
  Beginner: 'var(--color-dash-green)',
  Intermediate: 'var(--color-dash-gold)',
  Advanced: 'var(--color-dash-red)',
};

function SkillPill({ label, type }) {
  const styles = {
    have:     { bg: 'rgba(16,185,129,0.1)',  color: 'var(--color-dash-green)',  prefix: '✓' },
    required: { bg: 'rgba(239,68,68,0.1)',   color: 'var(--color-dash-red)',    prefix: '↗' },
    gain:     { bg: 'rgba(138,85,255,0.12)', color: 'var(--color-dash-purple)', prefix: '🎯' },
    builds:   { bg: 'rgba(59,130,246,0.1)',  color: 'var(--color-dash-blue)',   prefix: '⚡' },
  };
  const s = styles[type] || styles.have;
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 600, padding: '2px 9px', borderRadius: 20,
      background: s.bg, color: s.color, border: `1px solid ${s.bg}`,
    }}>
      {s.prefix} {label}
    </span>
  );
}

function WeekCard({ week, index, isDone, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const topic = week.topic || week.title || '';
  const diffColor = DIFF_COLOR[week.difficulty] || 'var(--color-dash-gold)';

  return (
    <div style={{
      display: 'flex', gap: '0', position: 'relative',
    }}>
      {/* Vertical timeline connector */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '1rem', flexShrink: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: isDone ? 'var(--color-dash-green)' : 'var(--color-dash-special-bg)',
          border: `2px solid ${isDone ? 'var(--color-dash-green)' : 'var(--color-dash-border)'}`,
          color: isDone ? 'white' : 'var(--color-dash-text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.72rem', fontWeight: 800, zIndex: 1,
        }}>
          {isDone ? '✓' : `W${week.week || index + 1}`}
        </div>
        <div style={{ width: 2, flex: 1, minHeight: 24, background: 'var(--color-dash-border)', marginTop: 2 }} />
      </div>

      {/* Card body */}
      <div style={{
        flex: 1, marginBottom: '0.85rem',
        background: 'var(--color-dash-card)',
        border: `1px solid ${isDone ? 'var(--color-dash-green)' : 'var(--color-dash-border)'}`,
        borderLeft: `4px solid ${isDone ? 'var(--color-dash-green)' : diffColor}`,
        borderRadius: 12, overflow: 'hidden',
        opacity: isDone ? 0.75 : 1, transition: 'all 0.2s',
      }}>
        {/* Header row — always visible */}
        <div style={{ padding: '0.85rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}
          onClick={() => setExpanded(v => !v)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.88rem', fontWeight: 800,
                textDecoration: isDone ? 'line-through' : 'none',
                color: isDone ? 'var(--color-dash-text-muted)' : 'var(--color-dash-text)',
              }}>{topic}</span>
              {week.difficulty && (
                <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: `${diffColor}18`, color: diffColor, flexShrink: 0 }}>
                  {week.difficulty}
                </span>
              )}
              {week.estimated_hours && (
                <span style={{ fontSize: '0.62rem', color: 'var(--color-dash-text-muted)', flexShrink: 0 }}>
                  ⏱ {week.estimated_hours}h
                </span>
              )}
            </div>

            {/* Skill gained — always visible as the key outcome */}
            {week.skill_gained && (
              <div style={{ marginTop: '0.35rem' }}>
                <SkillPill label={week.skill_gained} type="gain" />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem', flexShrink: 0 }}>
            <span style={{ fontSize: '0.62rem', color: 'var(--color-dash-text-muted)' }}>
              {expanded ? '▲' : '▼'} details
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(topic); }}
              style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: isDone ? 'rgba(16,185,129,0.12)' : 'var(--color-dash-special-bg)',
                color: isDone ? 'var(--color-dash-green)' : 'var(--color-dash-text-muted)',
                border: `1px solid ${isDone ? 'rgba(16,185,129,0.3)' : 'var(--color-dash-border)'}`,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
              {isDone ? '✓ Done' : 'Mark done'}
            </button>
          </div>
        </div>

        {/* Expanded detail panel */}
        {expanded && (
          <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--color-dash-border)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {week.description && (
              <p style={{ fontSize: '0.78rem', color: 'var(--color-dash-text-muted)', lineHeight: 1.55, margin: 0 }}>
                {week.description}
              </p>
            )}

            {/* Skills grid: required | you bring */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>

              {week.required_skills?.length > 0 && (
                <div style={{ background: 'var(--color-dash-bg)', borderRadius: 8, padding: '0.65rem 0.85rem' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--color-dash-red)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.45rem' }}>
                    Required for this stage
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {week.required_skills.map((s, j) => <SkillPill key={j} label={s} type="required" />)}
                  </div>
                </div>
              )}

              {week.current_skills_used?.length > 0 && (
                <div style={{ background: 'var(--color-dash-bg)', borderRadius: 8, padding: '0.65rem 0.85rem' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--color-dash-green)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.45rem' }}>
                    Your skills you'll use
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {week.current_skills_used.map((s, j) => <SkillPill key={j} label={s} type="have" />)}
                  </div>
                </div>
              )}
            </div>

            {week.skill_alignment?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--color-dash-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.35rem' }}>
                  Builds directly on
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {week.skill_alignment.map((s, j) => <SkillPill key={j} label={s} type="builds" />)}
                </div>
              </div>
            )}

            {week.resources?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--color-dash-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.35rem' }}>
                  Resources
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {week.resources.map((r, j) => (
                    <span key={j} style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 8, background: 'var(--color-dash-special-bg)', color: 'var(--color-dash-purple)' }}>
                      📚 {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Roadmap({ user, firebaseUser }) {
  const cacheRef = useRef({});
  const [tabList, setTabList] = useState([]);
  const [activeRole, setActiveRole] = useState('');
  const [data, setData] = useState(null);
  const [ctx, setCtx] = useState({ skills: [], missing_skills: [] });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [configRole, setConfigRole] = useState('');
  const [configPace, setConfigPace] = useState('Moderate');
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    Promise.all([
      getAllRoadmaps(firebaseUser.uid),
      getSkillsContext(firebaseUser.uid),
    ]).then(([rm, c]) => {
      const list = rm.roadmaps || [];
      setCtx(c);
      const cache = {};
      list.forEach(r => { cache[r.role] = r; });
      cacheRef.current = cache;
      setTabList(list.map(r => ({ role: r.role, progress_percentage: r.progress_percentage, learning_pace: r.learning_pace })));
      if (list.length > 0) { setActiveRole(list[0].role); setData(list[0]); }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [firebaseUser.uid]);

  const loadRoadmap = (role) => { setActiveRole(role); setData(cacheRef.current[role] || null); };

  const handleDeleteRoadmap = async (role) => {
    if (!window.confirm(`Are you sure you want to delete the roadmap for "${role}"?`)) return;
    try {
      await deleteRoadmap(firebaseUser.uid, role);
      const updatedTabs = tabList.filter(t => t.role !== role);
      setTabList(updatedTabs);
      delete cacheRef.current[role];
      if (updatedTabs.length > 0) {
        loadRoadmap(updatedTabs[0].role);
      } else {
        setData(null);
        setActiveRole('');
      }
    } catch (e) {
      setError(`Failed to delete roadmap: ${e.message}`);
    }
  };

  const handleGenerate = async () => {
    const role = configRole.trim() || activeRole || '';
    if (!role) { setError('Enter a target role.'); return; }
    setGenerating(true); setError('');
    try {
      const res = await generateRoadmap(firebaseUser.uid, role, ctx.missing_skills || [], ctx.skills || [], configPace);
      const entry = { role: res.role, learning_pace: res.learning_pace, roadmap: res.roadmap, completedTopics: [], progressPercentage: 0, progress_percentage: 0, current_skills: res.current_skills, missing_skills: res.missing_skills };
      cacheRef.current[res.role] = entry;
      setData(entry);
      setActiveRole(res.role);
      setShowConfig(false);
      setConfigRole('');
      setTabList(prev => {
        const updated = { role: res.role, progress_percentage: 0, learning_pace: res.learning_pace };
        return prev.find(t => t.role === res.role) ? prev.map(t => t.role === res.role ? updated : t) : [...prev, updated];
      });
    } catch (e) { setError(e.message); }
    finally { setGenerating(false); }
  };

  const handleToggleTopic = async (topic) => {
    const prev = data;
    const wasDone = (data?.completedTopics || []).includes(topic);
    const newCompleted = wasDone ? (data.completedTopics || []).filter(t => t !== topic) : [...(data.completedTopics || []), topic];
    const newProgress = data?.roadmap?.length ? Math.round((newCompleted.length / data.roadmap.length) * 100) : 0;
    const optimistic = { ...data, completedTopics: newCompleted, progressPercentage: newProgress };
    setData(optimistic);
    cacheRef.current[activeRole] = optimistic;
    setTabList(tabs => tabs.map(t => t.role === activeRole ? { ...t, progress_percentage: newProgress } : t));
    try {
      await post('/api/roadmap/complete-topic', { uid: firebaseUser.uid, topic, role: activeRole });
    } catch (e) {
      setData(prev);
      cacheRef.current[activeRole] = prev;
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2rem' }}>
      <span className="spinner" style={{ borderColor: 'rgba(138,85,255,0.3)', borderTopColor: 'var(--color-dash-purple)', width: 18, height: 18, borderWidth: 2 }} />
      <span className="dash-kpi-title">Loading roadmaps...</span>
    </div>
  );

  const roadmap = data?.roadmap || [];
  const completed = data?.completedTopics || [];
  const progress = data?.progressPercentage ?? data?.progress_percentage ?? 0;
  const pace = data?.learning_pace || data?.learningPace || 'Moderate';
  const roadmapCurrentSkills = data?.current_skills || data?.currentSkills || ctx.skills || [];
  const roadmapMissingSkills = data?.missing_skills || data?.missingSkills || ctx.missing_skills || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Learning Roadmaps</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-dash-text-muted)' }}>
            Personalised week-by-week plans · click any week to expand · click "Mark done" to track progress
          </p>
        </div>
        <button className="edit-save-btn" onClick={() => setShowConfig(v => !v)} style={{ padding: '0.5rem 1.25rem', fontSize: '0.82rem' }}>
          {showConfig ? '✕ Close' : '+ New Roadmap'}
        </button>
      </div>

      {error && <p className="edit-error-msg">{error}</p>}

      {/* Config panel */}
      {showConfig && (
        <div className="dash-section-card" style={{ border: '2px dashed var(--color-dash-purple)' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: '1rem' }}>Configure New Roadmap</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="edit-field-group">
              <label className="edit-field-label">Target Role *</label>
              <input className="edit-field-input"
                placeholder="e.g. AI Engineer, Full Stack Developer, Data Scientist..."
                value={configRole}
                onChange={(e) => setConfigRole(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()} />
              {(ctx.missing_skills?.length > 0 || ctx.skills?.length > 0) && (
                <span style={{ fontSize: '0.7rem', color: 'var(--color-dash-text-muted)', marginTop: '0.25rem' }}>
                  {ctx.skills?.length > 0 && <>✓ {ctx.skills.length} current skills detected · </>}
                  {ctx.missing_skills?.length > 0
                    ? <>Will target {ctx.missing_skills.length} skill gaps: {ctx.missing_skills.slice(0, 3).join(', ')}{ctx.missing_skills.length > 3 ? ` +${ctx.missing_skills.length - 3} more` : ''}</>
                    : 'No skill gaps found — roadmap will be based on role requirements.'}
                </span>
              )}
              {!ctx.skills?.length && !ctx.missing_skills?.length && (
                <span style={{ fontSize: '0.7rem', color: 'var(--color-dash-gold)', marginTop: '0.25rem' }}>
                  ⚠ No resume analysis detected — roadmap will be generated based on the role's standard requirements. Complete a resume analysis for a personalised plan.
                </span>
              )}
            </div>
            <div className="edit-field-group">
              <label className="edit-field-label">Learning Pace</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {PACES.map((p) => (
                  <button key={p} onClick={() => setConfigPace(p)} style={{
                    flex: 1, padding: '0.65rem', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem',
                    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', textAlign: 'center',
                    border: `2px solid ${configPace === p ? PACE_COLOR[p] : 'var(--color-dash-border)'}`,
                    background: configPace === p ? `${PACE_COLOR[p]}18` : 'transparent',
                    color: configPace === p ? PACE_COLOR[p] : 'var(--color-dash-text-muted)',
                  }}>
                    {p}
                    <div style={{ fontSize: '0.62rem', fontWeight: 500, opacity: 0.8, marginTop: 2 }}>{PACE_DESC[p]}</div>
                  </button>
                ))}
              </div>
            </div>
            <button className="edit-save-btn" onClick={handleGenerate} disabled={generating} style={{ alignSelf: 'flex-start', padding: '0.6rem 1.75rem' }}>
              {generating
                ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span className="spinner" /> Generating...</span>
                : 'Generate Roadmap →'}
            </button>
          </div>
        </div>
      )}

      {/* Tab strip */}
      {tabList.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {tabList.map((r) => (
            <button key={r.role} onClick={() => loadRoadmap(r.role)} style={{
              padding: '0.45rem 1rem', borderRadius: 20, fontWeight: 700, fontSize: '0.78rem',
              border: `2px solid ${activeRole === r.role ? 'var(--color-dash-purple)' : 'var(--color-dash-border)'}`,
              background: activeRole === r.role ? 'var(--color-dash-purple)' : 'transparent',
              color: activeRole === r.role ? 'white' : 'var(--color-dash-text-muted)',
              cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
            }}>
              {r.role}
              <span style={{ marginLeft: '0.35rem', fontSize: '0.62rem', opacity: 0.8 }}>{r.progress_percentage || 0}%</span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {roadmap.length === 0 && (
        <div className="dash-section-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--color-dash-text-muted)', marginBottom: '1rem' }}>
            {ctx.skills?.length === 0 && ctx.missing_skills?.length === 0
              ? 'No resume analysis found yet — you can still generate a role-based roadmap. Complete a resume analysis for a personalised skill-aware plan.'
              : 'No roadmaps yet. Click "+ New Roadmap" to generate your first plan.'}
          </p>
          <button className="edit-save-btn" onClick={() => setShowConfig(true)}>Create Your First Roadmap →</button>
        </div>
      )}

      {/* Active roadmap */}
      {roadmap.length > 0 && (
        <>
          {/* Progress + skills snapshot */}
          <div className="dash-section-card" style={{ gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{activeRole}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: `${PACE_COLOR[pace]}15`, color: PACE_COLOR[pace] }}>
                  {pace} · {PACE_DESC[pace]}
                </span>
                <button
                  onClick={() => handleDeleteRoadmap(activeRole)}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--color-dash-red)',
                    cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', borderRadius: '4px', transition: 'background-color 0.2s',
                    marginLeft: '0.25rem',
                  }}
                  title="Delete Roadmap"
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </div>
              <span style={{ fontWeight: 800, color: 'var(--color-dash-purple)' }}>{progress}%</span>
            </div>
            <div className="skills-progressbar-base" style={{ height: 8 }}>
              <div className="skills-progressbar-fill" style={{ width: `${progress}%`, backgroundColor: 'var(--color-dash-purple)', transition: 'width 0.5s' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-dash-text-muted)' }}>
              {completed.length} of {roadmap.length} weeks completed
            </span>

            {/* Current skills vs gaps summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
              {roadmapCurrentSkills.length > 0 && (
                <div style={{ background: 'var(--color-dash-bg)', borderRadius: 8, padding: '0.6rem 0.85rem' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--color-dash-green)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.4rem' }}>
                    Your current skills ({roadmapCurrentSkills.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {roadmapCurrentSkills.slice(0, 10).map((s, i) => <SkillPill key={i} label={s} type="have" />)}
                    {roadmapCurrentSkills.length > 10 && <span style={{ fontSize: '0.65rem', color: 'var(--color-dash-text-muted)' }}>+{roadmapCurrentSkills.length - 10} more</span>}
                  </div>
                </div>
              )}
              {roadmapMissingSkills.length > 0 && (
                <div style={{ background: 'var(--color-dash-bg)', borderRadius: 8, padding: '0.6rem 0.85rem' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--color-dash-red)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.4rem' }}>
                    Skills to acquire ({roadmapMissingSkills.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {roadmapMissingSkills.slice(0, 10).map((s, i) => <SkillPill key={i} label={s} type="required" />)}
                    {roadmapMissingSkills.length > 10 && <span style={{ fontSize: '0.65rem', color: 'var(--color-dash-text-muted)' }}>+{roadmapMissingSkills.length - 10} more</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '0 0.25rem' }}>
            {[
              { type: 'gain',     label: 'Skill you gain' },
              { type: 'required', label: 'Required for stage' },
              { type: 'have',     label: 'Skills you already have' },
              { type: 'builds',   label: 'Builds upon' },
            ].map(({ type, label }) => <SkillPill key={type} label={label} type={type} />)}
          </div>

          {/* Progressive week cards with timeline */}
          <div style={{ paddingLeft: '0.25rem' }}>
            {roadmap.map((week, i) => {
              const topic = week.topic || week.title || '';
              return (
                <WeekCard
                  key={i}
                  week={week}
                  index={i}
                  isDone={completed.includes(topic)}
                  onToggle={handleToggleTopic}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
