import { useState, useRef, useEffect } from 'react';
import { analyzeResume, getLatestAnalysis } from '../api.js';
import { uploadResumeToCloudinaryOnly } from '../resumeUpload.js';

export default function ResumeAnalysis({ user, firebaseUser }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [stage, setStage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setInitLoading(false);
      return;
    }
    let active = true;
    getLatestAnalysis(firebaseUser.uid)
      .then((data) => {
        if (!active) return;
        if (data && data.status === 'success') {
          setResult(data);
          setJobDescription(data.job_description || '');
        }
      })
      .catch((err) => {
        console.error('Error fetching latest resume analysis:', err);
      })
      .finally(() => {
        if (active) {
          setInitLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [firebaseUser?.uid]);

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

  const handleDownloadPDF = () => {
    setDownloading(true);
    const now = new Date().toLocaleString();
    const userName = user?.name || 'Candidate';
    const fileName = resumeFile?.name || 'Resume';

    const scoreColor = result.ats_score >= 75 ? '#10B981' : result.ats_score >= 50 ? '#F59E0B' : '#EF4444';
    const scoreLabel = result.ats_score >= 75 ? 'Strong Match' : result.ats_score >= 50 ? 'Moderate Match' : 'Needs Improvement';

    const pillHtml = (items, bg, color) =>
      (items || []).map(s =>
        `<span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:600;background:${bg};color:${color};margin:3px 3px 3px 0;border:1px solid ${color}40">${s}</span>`
      ).join('');

    const bulletHtml = (items) =>
      (items || []).map(i =>
        `<li style="font-size:12px;line-height:1.7;color:#374151">${i}</li>`
      ).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Resume Analysis Report — ${userName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #fff; color: #1F2937; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px 48px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #7E46F0; margin-bottom: 28px; }
    .brand { font-size: 20px; font-weight: 800; color: #7E46F0; }
    .brand span { font-size: 11px; display: block; color: #6B7280; font-weight: 500; margin-top: 2px; }
    .meta { text-align: right; font-size: 11px; color: #6B7280; line-height: 1.6; }
    .meta strong { color: #1F2937; }
    .score-row { display: flex; gap: 16px; margin-bottom: 24px; }
    .score-card { flex: 1; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px 20px; }
    .score-card.main { border-color: #7E46F0; background: linear-gradient(135deg, rgba(126,70,240,0.06), rgba(126,70,240,0.02)); }
    .score-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6B7280; margin-bottom: 6px; }
    .score-value { font-size: 32px; font-weight: 800; color: ${scoreColor}; line-height: 1; }
    .score-value small { font-size: 14px; color: #9CA3AF; }
    .score-badge { display: inline-block; margin-top: 6px; font-size: 10px; font-weight: 700; padding: 2px 10px; border-radius: 20px; background: ${scoreColor}18; color: ${scoreColor}; }
    .score-sub { font-size: 12px; color: #6B7280; margin-top: 4px; }
    .section { margin-bottom: 22px; }
    .section-title { font-size: 13px; font-weight: 800; color: #1F2937; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #F3F4F6; display: flex; align-items: center; gap: 6px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .card { border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px 16px; }
    .card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 8px; }
    .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    ul { padding-left: 16px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB; display: flex; justify-content: space-between; font-size: 10px; color: #9CA3AF; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 24px 32px; }
    }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand">VidyaGuide AI <span>AI-Powered Resume Analysis Report</span></div>
    </div>
    <div class="meta">
      <strong>${userName}</strong><br/>
      ${fileName}<br/>
      Generated: ${now}
    </div>
  </div>

  <!-- Scores -->
  <div class="score-row">
    <div class="score-card main">
      <div class="score-label">ATS Score</div>
      <div class="score-value">${result.ats_score}<small>/100</small></div>
      <div class="score-badge">${scoreLabel}</div>
    </div>
    <div class="score-card">
      <div class="score-label">Match Percentage</div>
      <div class="score-value" style="color:#7E46F0">${result.match_percentage}%</div>
      <div class="score-sub">${result.matched_skills?.length || 0} of ${(result.matched_skills?.length || 0) + (result.missing_skills?.length || 0)} skills matched</div>
    </div>
    <div class="score-card">
      <div class="score-label">Skills Extracted</div>
      <div class="score-value" style="color:#3B82F6">${result.skills?.length || 0}</div>
      <div class="score-sub">from your resume</div>
    </div>
  </div>

  <!-- Skills -->
  <div class="section">
    <div class="section-title">📊 Skills Analysis</div>
    <div class="two-col">
      <div class="card">
        <div class="card-label" style="color:#10B981">✅ Matched Skills (${result.matched_skills?.length || 0})</div>
        <div>${pillHtml(result.matched_skills, 'rgba(16,185,129,0.1)', '#10B981')}</div>
      </div>
      <div class="card">
        <div class="card-label" style="color:#EF4444">❌ Missing Skills (${result.missing_skills?.length || 0})</div>
        <div>${pillHtml(result.missing_skills, 'rgba(239,68,68,0.1)', '#EF4444')}</div>
      </div>
    </div>
  </div>

  <!-- Strengths / Weaknesses / Recommendations -->
  <div class="section">
    <div class="section-title">📋 Detailed Assessment</div>
    <div class="three-col">
      <div class="card">
        <div class="card-label" style="color:#7E46F0">💪 Strengths</div>
        <ul>${bulletHtml(result.strengths)}</ul>
      </div>
      <div class="card">
        <div class="card-label" style="color:#F59E0B">⚠️ Weaknesses</div>
        <ul>${bulletHtml(result.weaknesses)}</ul>
      </div>
      <div class="card">
        <div class="card-label" style="color:#3B82F6">💡 Recommendations</div>
        <ul>${bulletHtml(result.recommendations)}</ul>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>VidyaGuide AI · AI-Powered Career Platform</span>
    <span>Confidential — For ${userName} only</span>
  </div>
</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(html);
    win.document.close();
    
    // Print window needs a small delay to finish loading styles and layout before opening print dialog
    setTimeout(() => {
      try {
        win.print();
      } catch (err) {
        console.error('Print failed:', err);
      }
      setDownloading(false);
    }, 800);
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

  if (initLoading) {
    return (
      <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '0.75rem' }}>
        <span className="spinner" style={{ borderColor: 'rgba(138,85,255,0.3)', borderTopColor: 'var(--color-dash-purple)', width: 28, height: 28, borderWidth: 3 }} />
        <span style={{ fontSize: '0.85rem', color: 'var(--color-dash-text-muted)' }}>Loading latest analysis...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 2rem 0' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Resume Analysis</h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-dash-text-muted)', marginBottom: '1.5rem' }}>
        Upload your resume and paste a job description to get your ATS score and skill gap report.
      </p>

      {!result && (
        <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 640 }}>
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

      {result && (
        <div ref={reportRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Action buttons row */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="edit-save-btn" onClick={handleDownloadPDF} disabled={downloading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem', fontSize: '0.85rem' }}>
              {downloading ? (
                <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Preparing PDF...</>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download PDF Report
                </>
              )}
            </button>
            <button className="edit-cancel-btn" onClick={() => setResult(null)}>
              ← Analyze Another Resume
            </button>
          </div>

          {/* Scores row */}
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
