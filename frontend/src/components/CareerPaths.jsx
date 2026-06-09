import { useState, useEffect } from 'react';
import { recommendCareers, customCareerPath, selectRole, getCareerPaths, getSkillsContext } from '../api.js';

function MatchRing({ pct }) {
  const color = pct >= 70 ? 'var(--color-dash-green)' : pct >= 40 ? 'var(--color-dash-gold)' : 'var(--color-dash-red)';
  const r = 22, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
      <svg viewBox="0 0 56 56" width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-dash-border)" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color }}>
        {pct}%
      </div>
    </div>
  );
}

function UserStatusPanel({ skills, missingSkills, atsScore }) {
  if (!skills?.length && !missingSkills?.length) return null;
  return (
    <div className="dash-section-card" style={{ marginBottom: '1.25rem',
      background: 'linear-gradient(135deg,rgba(138,85,255,0.04) 0%,transparent 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-dash-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.5rem' }}>
            Your Skills (from resume)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {skills.slice(0, 14).map((s, i) => (
              <span key={i} style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 9px', borderRadius: 20,
                background: 'rgba(138,85,255,0.1)', color: 'var(--color-dash-purple)', border: '1px solid rgba(138,85,255,0.2)' }}>
                {s}
              </span>
            ))}
            {skills.length > 14 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--color-dash-text-muted)' }}>+{skills.length - 14} more</span>
            )}
          </div>
        </div>
        {missingSkills?.length > 0 && (
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-dash-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.5rem' }}>
              Skill Gaps (last JD analysis)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {missingSkills.slice(0, 8).map((s, i) => (
                <span key={i} style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 9px', borderRadius: 20,
                  background: 'rgba(239,68,68,0.1)', color: 'var(--color-dash-red)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  ✗ {s}
                </span>
              ))}
            </div>
          </div>
        )}
        {atsScore > 0 && (
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-dash-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.25rem' }}>Last ATS</div>
            <span style={{ fontSize: '1.6rem', fontWeight: 800,
              color: atsScore >= 70 ? 'var(--color-dash-green)' : 'var(--color-dash-gold)' }}>
              {atsScore}
            </span>
            <div style={{ fontSize: '0.6rem', color: 'var(--color-dash-text-muted)' }}>/100</div>
          </div>
        )}
      </div>
    </div>
  );
}

function SkillStatusList({ skillStatus, userSkills }) {
  if (!skillStatus?.length) return null;
  return (
    <div style={{ marginTop: '0.85rem' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-dash-text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.45rem' }}>
        Skill Requirements
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {skillStatus.map((s, i) => {
          const have = s.have ?? userSkills.map(x => x.toLowerCase()).includes(s.skill?.toLowerCase());
          const isMust = s.importance === 'must-have';
          return (
            <span key={i} style={{
              fontSize: '0.7rem', fontWeight: 600, padding: '2px 9px', borderRadius: 20,
              background: have ? 'rgba(16,185,129,0.1)' : isMust ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
              color: have ? 'var(--color-dash-green)' : isMust ? 'var(--color-dash-red)' : 'var(--color-dash-gold)',
              border: `1px solid ${have ? 'rgba(16,185,129,0.25)' : isMust ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
            }}>
              {have ? '✓' : isMust ? '✗*' : '~'} {s.skill}
            </span>
          );
        })}
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--color-dash-text-muted)', marginTop: '0.35rem' }}>
        ✓ you have it &nbsp;·&nbsp; ✗* must-have gap &nbsp;·&nbsp; ~ nice-to-have
      </div>
    </div>
  );
}

export default function CareerPaths({ user, firebaseUser, onRoleSelected }) {
  const [data, setData] = useState(null);
  const [ctx, setCtx] = useState({ skills: [], missing_skills: [], ats_score: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');

  const [customRole, setCustomRole] = useState('');
  const [customResult, setCustomResult] = useState(null);
  const [customLoading, setCustomLoading] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    Promise.all([
      getCareerPaths(firebaseUser.uid),
      getSkillsContext(firebaseUser.uid),
    ]).then(([d, c]) => {
      setData(d);
      setSelected(d.selectedRole || '');
      setCtx(c);
    }).catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [firebaseUser.uid]);

  const handleGenerate = async () => {
    setGenerating(true); setError('');
    try {
      const res = await recommendCareers(firebaseUser.uid, ctx.skills || [], user.college || '', []);
      setData(res);
      const c = await getSkillsContext(firebaseUser.uid);
      setCtx(c);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelect = async (role) => {
    setSelected(role);
    try {
      await selectRole(firebaseUser.uid, role);
      if (onRoleSelected) onRoleSelected(role);
    } catch (e) { console.error(e); }
  };

  const handleCustomAnalyze = async () => {
    if (!customRole.trim()) return;
    setCustomLoading(true); setCustomResult(null); setError('');
    try {
      const res = await customCareerPath(firebaseUser.uid, customRole.trim(), ctx.skills || [], user.college || '', []);
      setCustomResult(res.role);
    } catch (e) {
      setError(e.message);
    } finally {
      setCustomLoading(false);
    }
  };

  if (loading) return <div className="dash-kpi-title" style={{ padding: '2rem' }}>Loading career paths...</div>;

  const roles = data?.recommended_roles || data?.recommendedRoles || [];
  const skillsCtx = ctx.skills?.length ? ctx.skills : (data?.skills_context || []);
  const missingCtx = ctx.missing_skills?.length ? ctx.missing_skills : (data?.missing_skills_context || []);
  const atsScore = ctx.ats_score || 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Career Paths</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-dash-text-muted)' }}>
            AI recommendations based on your resume · select a role to generate your roadmap
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', flexShrink: 0 }}>
          <button className="edit-cancel-btn" onClick={() => { setShowCustom(v => !v); setCustomResult(null); }}
            style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
            {showCustom ? '✕ Close' : '+ Custom Role'}
          </button>
          <button className="edit-save-btn" onClick={handleGenerate} disabled={generating}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.82rem' }}>
            {generating ? 'Generating...' : '🔄 Regenerate'}
          </button>
        </div>
      </div>

      {error && <p className="edit-error-msg" style={{ marginBottom: '1rem' }}>{error}</p>}

      {/* User status from resume */}
      <UserStatusPanel skills={skillsCtx} missingSkills={missingCtx} atsScore={atsScore} />

      {/* Custom role analyzer */}
      {showCustom && (
        <div className="dash-section-card" style={{ marginBottom: '1.25rem', border: '2px dashed var(--color-dash-purple)' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Analyze a Custom Role
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <input className="edit-field-input" style={{ flex: 1, minWidth: 220 }}
              placeholder="e.g. DevOps Engineer, Product Manager, Blockchain Developer..."
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomAnalyze()} />
            <button className="edit-save-btn" onClick={handleCustomAnalyze}
              disabled={customLoading || !customRole.trim()}
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', flexShrink: 0 }}>
              {customLoading ? 'Analyzing...' : 'Analyze →'}
            </button>
          </div>

          {customResult && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-dash-border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <MatchRing pct={customResult.match_percentage || 0} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{customResult.title}</div>
                    <button className="edit-save-btn"
                      onClick={() => { handleSelect(customResult.title); setShowCustom(false); }}
                      style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
                      Select this Role →
                    </button>
                  </div>
                  {customResult.salary_range && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-dash-text-muted)', marginTop: 2 }}>
                      {customResult.salary_range}
                    </div>
                  )}
                  {customResult.reason && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-dash-text-muted)', marginTop: '0.4rem', lineHeight: 1.45 }}>
                      {customResult.reason}
                    </div>
                  )}
                </div>
              </div>

              <SkillStatusList skillStatus={customResult.skill_status} userSkills={skillsCtx} />

              {customResult.next_steps?.length > 0 && (
                <div style={{ marginTop: '0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-dash-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.45rem' }}>
                    Next Steps to Bridge the Gap
                  </div>
                  {customResult.next_steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '0.35rem', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--color-dash-purple)', fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                      <span style={{ lineHeight: 1.45 }}>{s}</span>
                    </div>
                  ))}
                </div>
              )}

              {customResult.certifications?.length > 0 && (
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {customResult.certifications.map((c, i) => (
                    <span key={i} style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 12,
                      background: 'var(--color-dash-special-bg)', color: 'var(--color-dash-text-muted)' }}>
                      🏅 {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI recommended roles */}
      {roles.length === 0 ? (
        <div className="dash-section-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--color-dash-text-muted)', marginBottom: '1rem' }}>
            {skillsCtx.length === 0
              ? 'Complete a resume analysis first so we can recommend career paths based on your actual skills.'
              : 'No AI recommendations yet. Click Regenerate to get personalized career paths.'}
          </p>
          <button className="edit-save-btn" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Career Paths →'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {roles.map((role, i) => {
            const title = role.title || role;
            const isSelected = selected === title;
            const matchPct = typeof role.match_percentage === 'number' ? role.match_percentage : 0;

            return (
              <div key={i} className="dash-section-card"
                style={{ border: `2px solid ${isSelected ? 'var(--color-dash-purple)' : 'var(--color-dash-border)'}`,
                  cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => handleSelect(title)}>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <MatchRing pct={matchPct} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{title}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {role.salary_range && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-dash-text-muted)' }}>{role.salary_range}</span>
                        )}
                        {isSelected && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'white',
                            background: 'var(--color-dash-purple)', padding: '2px 10px', borderRadius: 20 }}>
                            ✓ Selected
                          </span>
                        )}
                      </div>
                    </div>

                    {role.reason && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-dash-text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                        {role.reason}
                      </p>
                    )}

                    {/* User alignment with this role */}
                    {skillsCtx.length > 0 && (
                      <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', borderRadius: 10, background: 'var(--color-dash-bg)' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-dash-text-muted)',
                          textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.4rem' }}>
                          Your alignment with this role
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {skillsCtx.slice(0, 7).map((s, j) => (
                            <span key={j} style={{ fontSize: '0.65rem', fontWeight: 600, padding: '1px 7px', borderRadius: 20,
                              background: 'rgba(16,185,129,0.1)', color: 'var(--color-dash-green)', border: '1px solid rgba(16,185,129,0.2)' }}>
                              ✓ {s}
                            </span>
                          ))}
                          {missingCtx.slice(0, 4).map((s, j) => (
                            <span key={`m${j}`} style={{ fontSize: '0.65rem', fontWeight: 600, padding: '1px 7px', borderRadius: 20,
                              background: 'rgba(239,68,68,0.08)', color: 'var(--color-dash-red)', border: '1px solid rgba(239,68,68,0.15)' }}>
                              ✗ {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {role.certifications?.length > 0 && (
                      <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {role.certifications.map((c, j) => (
                          <span key={j} style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: 10,
                            background: 'var(--color-dash-special-bg)', color: 'var(--color-dash-text-muted)' }}>
                            🏅 {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
