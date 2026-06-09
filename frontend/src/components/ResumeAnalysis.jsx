import { useState } from 'react';
import { analyzeResume } from '../api.js';
import { uploadResumeToCloudinaryOnly } from '../resumeUpload.js';

export default function ResumeAnalysis({ user, firebaseUser }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!resumeFile || !jobDescription.trim()) {
      setError('Please upload a resume and enter a job description.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      setStage('Uploading resume...');
      const resumeUrl = await uploadResumeToCloudinaryOnly(firebaseUser.uid, resumeFile);

      // Backend will extract text from the Cloudinary URL using pypdf.
      // Pass resume_text as empty — backend uses it only as last-resort fallback.
      setStage('Running AI analysis...');
      const data = await analyzeResume(firebaseUser.uid, resumeUrl, '', jobDescription);
      setResult(data);
      setStage('');
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
      setStage('');
    }
  };

  const ScoreRing = ({ score }) => {
    const pct = Math.min(100, Math.max(0, score));
    const color = pct >= 75 ? '#10B981' : pct >= 50 ? '#FBBF24' : '#EF4444';
    return (
      <div style={{ position: 'relative', width: 100, height: 100 }}>
        <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: 100, height: 100 }}>
          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-dash-border)" strokeWidth="4" />
          <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${pct * 0.942} 94.2`} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{score}</span>
          <span style={{ fontSize: '0.55rem', color: 'var(--color-dash-text-muted)' }}>ATS Score</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '0 0 2rem 0' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Resume Analysis</h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-dash-text-muted)', marginBottom: '1.5rem' }}>
        Upload your resume and paste a job description to get your ATS score and skill gap report.
      </p>

      {!result && (
        <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 640 }}>
          {/* Resume Upload */}
          <div className="edit-field-group">
            <label className="edit-field-label">Resume (PDF) *</label>
            <div className="edit-file-upload-zone">
              <input type="file" accept=".pdf" id="resume-analysis-upload"
                style={{ display: 'none' }} onChange={(e) => setResumeFile(e.target.files[0] || null)} />
              <label htmlFor="resume-analysis-upload" className="edit-file-upload-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {resumeFile ? `✓ ${resumeFile.name}` : 'Click to upload resume PDF'}
              </label>
            </div>
          </div>

          {/* Job Description */}
          <div className="edit-field-group">
            <label className="edit-field-label">Job Description *</label>
            <textarea className="edit-field-input" rows={8}
              style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
              placeholder="Paste the full job description here..."
              value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
          </div>

          {error && <p className="edit-error-msg">{error}</p>}

          <button type="submit" className="edit-save-btn"
            style={{ alignSelf: 'flex-start', padding: '0.7rem 2rem' }} disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner" /> {stage || 'Analyzing...'}
              </span>
            ) : 'Analyze Resume →'}
          </button>
        </form>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top row: scores */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="dash-kpi-card" style={{ alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <ScoreRing score={result.ats_score} />
            </div>
            <div className="dash-kpi-card">
              <span className="dash-kpi-title">Match %</span>
              <span className="dash-kpi-value-huge" style={{ color: 'var(--color-dash-green)' }}>
                {result.match_percentage}%
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-dash-text-muted)' }}>
                {result.matched_skills?.length} of {(result.matched_skills?.length || 0) + (result.missing_skills?.length || 0)} skills matched
              </span>
            </div>
            <div className="dash-kpi-card">
              <span className="dash-kpi-title">Skills Extracted</span>
              <span className="dash-kpi-value-huge">{result.skills?.length || 0}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-dash-text-muted)' }}>from your resume</span>
            </div>
          </div>

          {/* Skills columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <SkillList title="✅ Matched Skills" items={result.matched_skills} color="var(--color-dash-green)" />
            <SkillList title="❌ Missing Skills" items={result.missing_skills} color="var(--color-dash-red)" />
          </div>

          {/* Strengths / Weaknesses / Recommendations */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <BulletCard title="💪 Strengths" items={result.strengths} />
            <BulletCard title="⚠️ Weaknesses" items={result.weaknesses} />
            <BulletCard title="💡 Recommendations" items={result.recommendations} />
          </div>

          <button className="edit-cancel-btn" onClick={() => setResult(null)}
            style={{ alignSelf: 'flex-start' }}>
            ← Analyze Another Resume
          </button>
        </div>
      )}
    </div>
  );
}

function SkillList({ title, items = [], color }) {
  return (
    <div className="dash-section-card">
      <span className="dash-kpi-title" style={{ color }}>{title}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
        {items.length ? items.map((s) => (
          <span key={s} style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem',
            fontWeight: 600, background: `${color}18`, color, border: `1px solid ${color}40` }}>
            {s}
          </span>
        )) : <span style={{ fontSize: '0.75rem', color: 'var(--color-dash-text-muted)' }}>None</span>}
      </div>
    </div>
  );
}

function BulletCard({ title, items = [] }) {
  return (
    <div className="dash-section-card">
      <span className="dash-kpi-title">{title}</span>
      <ul style={{ marginTop: '0.75rem', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: '0.78rem', lineHeight: 1.4 }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
