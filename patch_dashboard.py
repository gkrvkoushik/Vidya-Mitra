import re

path = r'e:\Agent-2k26\frontend\src\components\Dashboard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Patch 1: react import
c = c.replace(
    "import { useState } from 'react';",
    "import { useState, useEffect, useRef } from 'react';",
    1
)

# Patch 2: api import
if 'getAllRoadmaps' not in c:
    c = c.replace(
        "import ResumeAnalysis from './ResumeAnalysis.jsx';",
        "import ResumeAnalysis from './ResumeAnalysis.jsx';\nimport { getAllRoadmaps, generateRoadmap } from '../api.js';",
        1
    )

# Patch 3: replace static roadmap state block using regex
old_pattern = r'  // Timeline list state.*?const \[basePoints, setBasePoints\] = useState\(\d+\);'
new_state = '''  // Live roadmap state from API
  const [dashRoadmap, setDashRoadmap] = useState({ weeks: [], completed: [], progress: 0, role: '' });
  const [dashRoadmapLoading, setDashRoadmapLoading] = useState(true);
  const dashInitialized = useRef(false);
  const [basePoints, setBasePoints] = useState(0);

  useEffect(() => {
    if (dashInitialized.current) return;
    dashInitialized.current = true;
    const uid = firebaseUser?.uid;
    if (!uid) { setDashRoadmapLoading(false); return; }
    getAllRoadmaps(uid).then(async (rm) => {
      const list = rm.roadmaps || [];
      if (list.length > 0) {
        const first = list[0];
        setDashRoadmap({
          weeks: (first.roadmap || []).slice(0, 4),
          completed: first.completed_topics || [],
          progress: first.progress_percentage || 0,
          role: first.role,
        });
      } else {
        try {
          const res = await generateRoadmap(uid, 'AI Engineer', [], [], 'Moderate');
          setDashRoadmap({ weeks: (res.roadmap || []).slice(0, 4), completed: [], progress: 0, role: 'AI Engineer' });
        } catch (e) { console.error(e); }
      }
      setDashRoadmapLoading(false);
    }).catch(() => setDashRoadmapLoading(false));
  }, [firebaseUser]);'''

c = re.sub(old_pattern, new_state, c, flags=re.DOTALL)

# Patch 4: remove handleToggleStep function and derived vars
old_toggle = r'  // Handle roadmap step completion toggles\n  const handleToggleStep.*?const roadmapProgressPct = Math\.round\(\(completedSteps / roadmapSteps\.length\) \* 100\);'
c = re.sub(old_toggle, '  // roadmap progress driven by dashRoadmap state', c, flags=re.DOTALL)

# Patch 5: Replace the static roadmap progress widget (lines ~672-735)
old_widget = r'\{/\* Roadmap Progress Card \*/\}.*?\{/\* Next Recommended Step \*/\}.*?</div>\s*\n\s*</div>\s*\n\s*\{/\* Row 3'
new_widget = '''              {/* Roadmap Progress Card */}
              <div className="dash-section-card">
                <span className="dash-kpi-title">Roadmap Progress</span>
                <h3 className="dash-section-card-title">{dashRoadmap.role || 'AI Engineer'} Roadmap</h3>
                <span className="dash-section-card-subtitle">{dashRoadmap.progress}% Completed ({dashRoadmap.completed.length} of {dashRoadmap.weeks.length} milestones)</span>

                {dashRoadmapLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 0', color: 'var(--color-dash-text-muted)', fontSize: '0.8rem' }}>
                    <span className="spinner" style={{ borderColor: 'rgba(138,85,255,0.3)', borderTopColor: 'var(--color-dash-purple)', width: 16, height: 16, borderWidth: 2 }} />
                    Generating roadmap...
                  </div>
                ) : (
                  <div className="timeline-flex-wrapper">
                    <div className="roadmap-horizontal-timeline">
                      {dashRoadmap.weeks.map((week, idx) => {
                        const topic = week.topic || week.title || '';
                        const isDone = dashRoadmap.completed.includes(topic);
                        const isActive = !isDone && dashRoadmap.weeks.findIndex(w => !dashRoadmap.completed.includes(w.topic || w.title || '')) === idx;
                        return (
                          <div key={idx} className={`timeline-step-node ${isDone ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                            <div className="timeline-step-circle">{isDone ? '✓' : `W${week.week || idx + 1}`}</div>
                            <span className="timeline-step-label">{topic}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="timeline-bottom-controls">
                  <button className="dash-link-action" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
                    onClick={() => setActiveMenu('Roadmaps')}>
                    View Roadmap <ArrowRightIcon />
                  </button>
                  <div className="timeline-dots-wrapper">
                    {dashRoadmap.weeks.map((w, i) => {
                      const t = w.topic || w.title || '';
                      return <span key={i} className={`timeline-dot-indicator ${dashRoadmap.completed.includes(t) ? 'active' : ''}`} />;
                    })}
                  </div>
                </div>
              </div>

              {/* Next Recommended Step */}
              <div className="dash-section-card">
                <span className="dash-kpi-title">Next Recommended Step</span>
                <div className="recommended-next-step-content" style={{ marginTop: '0.75rem' }}>
                  {(() => {
                    const next = dashRoadmap.weeks.find(w => !dashRoadmap.completed.includes(w.topic || w.title || ''));
                    return next ? (
                      <>
                        <div className="rec-step-desc-wrapper">
                          <span className="rec-step-sublabel">Continue learning</span>
                          <h4 className="rec-step-headline">{next.topic || next.title}</h4>
                          <span className="rec-step-week">Week {next.week || dashRoadmap.weeks.indexOf(next) + 1}</span>
                        </div>
                        <div className="rec-isometric-illustration-container"><IsometricBlockSVG /></div>
                        <button className="btn btn-primary" style={{ width: '100%', borderRadius: '10px' }}
                          onClick={() => setActiveMenu('Roadmaps')}>
                          Continue Roadmap
                        </button>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-dash-text-muted)', fontSize: '0.82rem' }}>
                        {dashRoadmapLoading ? 'Loading...' : '🎉 All steps complete! Go to Roadmaps to generate more.'}
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>

            {/* Row 3'''

c = re.sub(old_widget, new_widget, c, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

# Verify patches applied
with open(path, 'r', encoding='utf-8') as f:
    result = f.read()

checks = [
    ('useEffect import', 'useEffect, useRef' in result),
    ('getAllRoadmaps import', 'getAllRoadmaps' in result),
    ('dashRoadmap state', 'dashRoadmap' in result),
    ('static roadmapSteps gone', 'roadmapSteps' not in result),
    ('live widget', 'dashRoadmap.role' in result),
]
for name, ok in checks:
    print(f"{'OK' if ok else 'FAIL'}: {name}")
