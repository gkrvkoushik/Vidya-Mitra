import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getInterviewContext,
  startInterview,
  submitInterviewAnswer,
  getInterviewReport,
  getInterviewHistory,
} from '../api.js';

const TOTAL_QUESTIONS = 5;
const INTERVIEW_DURATION = 10 * 60; // 10 minutes
const MAX_FS_EXITS = 1;

// ── Helpers ───────────────────────────────────────────────────────────────────

function ScoreRing({ value, max = 10, size = 56, color = 'var(--color-dash-purple)' }) {
  const r = (size / 2) * 0.78;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / max) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-dash-border)" strokeWidth={size*0.1} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.1}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transform:'rotate(-90deg)', transformOrigin:'50% 50%', transition:'stroke-dashoffset 0.8s ease' }} />
      <text x="50%" y="50%" textAnchor="middle" dy="0.38em"
        style={{ fontSize: size*0.28, fontWeight:800, fill:'var(--color-dash-text)' }}>
        {value}
      </text>
    </svg>
  );
}

function RadarChart({ scores }) {
  const cx=110, cy=110, r=80;
  const labels=['Technical','Communication','Confidence','Completeness'];
  const vals=[scores.technical, scores.communication, scores.confidence, scores.completeness];
  const angles=labels.map((_,i)=>(i*2*Math.PI)/labels.length - Math.PI/2);
  const pts=()=>angles.map((a,i)=>[cx+r*(vals[i]/10)*Math.cos(a), cy+r*(vals[i]/10)*Math.sin(a)]);
  const gridPts=(f)=>angles.map(a=>[cx+r*f*Math.cos(a), cy+r*f*Math.sin(a)]);
  const poly=(p)=>p.map(([x,y])=>`${x},${y}`).join(' ');
  return (
    <svg width={220} height={220} style={{ overflow:'visible' }}>
      {[0.25,0.5,0.75,1].map(f=>(
        <polygon key={f} points={poly(gridPts(f))} fill="none" stroke="var(--color-dash-border)" strokeWidth={1} />
      ))}
      {angles.map((a,i)=>(
        <line key={i} x1={cx} y1={cy} x2={cx+r*Math.cos(a)} y2={cy+r*Math.sin(a)}
          stroke="var(--color-dash-border)" strokeWidth={1} />
      ))}
      <polygon points={poly(pts())} fill="rgba(138,85,255,0.15)" stroke="var(--color-dash-purple)" strokeWidth={2} />
      {angles.map((a,i)=>(
        <text key={i} x={cx+(r+18)*Math.cos(a)} y={cy+(r+18)*Math.sin(a)}
          textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize:9.5, fontWeight:700, fill:'var(--color-dash-text-muted)' }}>
          {labels[i]}
        </text>
      ))}
    </svg>
  );
}

function HiringBadge({ recommendation }) {
  const map={
    'Strong Hire':{ color:'#10B981', bg:'rgba(16,185,129,0.12)', icon:'🏆' },
    'Hire':{ color:'#3B82F6', bg:'rgba(59,130,246,0.12)', icon:'✅' },
    'Borderline':{ color:'#F59E0B', bg:'rgba(245,158,11,0.12)', icon:'⚖️' },
    'Needs Improvement':{ color:'#EF4444', bg:'rgba(239,68,68,0.12)', icon:'📈' },
  };
  const s=map[recommendation]||map['Borderline'];
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:'0.6rem',
      padding:'0.6rem 1.25rem', borderRadius:50,
      background:s.bg, border:`2px solid ${s.color}`,
      fontSize:'0.92rem', fontWeight:800, color:s.color }}>
      {s.icon} {recommendation}
    </div>
  );
}

// ── Speech hooks ──────────────────────────────────────────────────────────────

function useSpeechRecognition() {
  const recRef       = useRef(null);
  const shouldRunRef = useRef(false);   // true while user wants recording on
  const callbackRef  = useRef(null);    // always points to latest onTranscript
  const [listening,  setListening]  = useState(false);
  const [supported,  setSupported]  = useState(false);
  const [interimText, setInterimText] = useState('');

  // Create the recognizer once
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const rec = new SR();
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.lang            = 'en-US';
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalChunk += t;
        else interimChunk += t;
      }
      // Show interim text live in the indicator
      setInterimText(interimChunk);
      // Append final chunks to the answer textarea via callback ref
      if (finalChunk.trim() && callbackRef.current) {
        callbackRef.current(finalChunk);
        setInterimText('');
      }
    };

    rec.onerror = (e) => {
      // 'no-speech' and 'aborted' are normal — don't stop the session
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        shouldRunRef.current = false;
        setListening(false);
      }
    };

    // Auto-restart on end if user still wants to record
    rec.onend = () => {
      if (shouldRunRef.current) {
        try { rec.start(); } catch (_) {}
      } else {
        setListening(false);
        setInterimText('');
      }
    };

    recRef.current = rec;
    return () => {
      shouldRunRef.current = false;
      rec.onend = null;
      try { rec.abort(); } catch (_) {}
    };
  }, []); // run once only

  const start = useCallback((onFinalTranscript) => {
    callbackRef.current  = onFinalTranscript;
    shouldRunRef.current = true;
    setListening(true);
    setInterimText('');
    try { recRef.current?.start(); } catch (_) {}
  }, []);

  const stop = useCallback(() => {
    shouldRunRef.current = false;
    setListening(false);
    setInterimText('');
    try { recRef.current?.stop(); } catch (_) {}
  }, []);

  return { listening, supported, interimText, start, stop };
}

function useSpeechSynthesis() {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const speak = useCallback((text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find(v => v.lang === 'en-US' && v.name.includes('Female'))
      || voices.find(v => v.lang === 'en-US') || voices[0];
    if (pref) utt.voice = pref;
    window.speechSynthesis.speak(utt);
  }, [voiceEnabled]);
  const cancel = useCallback(() => window.speechSynthesis?.cancel(), []);
  return { voiceEnabled, setVoiceEnabled, speak, cancel };
}

// ── Landing ───────────────────────────────────────────────────────────────────

function InterviewLanding({ firebaseUser, onStart, onViewHistory }) {
  const [role, setRole] = useState('');
  const [skills, setSkills] = useState('');
  const [missingSkills, setMissingSkills] = useState('');
  const [resumeSummary, setResumeSummary] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ctxLoading, setCtxLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!firebaseUser?.uid) { setCtxLoading(false); return; }
    getInterviewContext(firebaseUser.uid).then(ctx => {
      if (ctx.role) setRole(ctx.role);
      if (ctx.skills?.length) setSkills(ctx.skills.join(', '));
      if (ctx.missing_skills?.length) setMissingSkills(ctx.missing_skills.join(', '));
      if (ctx.experience_years) setExperienceYears(ctx.experience_years);
    }).catch(() => {}).finally(() => setCtxLoading(false));
  }, [firebaseUser]);

  const handleStart = async () => {
    if (!role.trim()) { setError('Please enter a target role.'); return; }
    setError('');
    setLoading(true);

    // Request microphone permission first (before entering fullscreen)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release the mic tracks immediately so the SpeechRecognition engine can lock the device later
        stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        setError('Microphone permission is required to proceed with the mock interview. Please enable microphone access in your browser settings.');
        setLoading(false);
        return;
      }
    }

    try {
      const skillList    = skills.split(',').map(s => s.trim()).filter(Boolean);
      const missingList  = missingSkills.split(',').map(s => s.trim()).filter(Boolean);
      const result = await startInterview(
        firebaseUser.uid, role.trim(), skillList, missingList,
        resumeSummary.trim(), parseInt(experienceYears) || 0,
        TOTAL_QUESTIONS, true   // total_questions=5, force_scenario=true
      );
      onStart(result);
    } catch (e) {
      setError(e.message || 'Failed to start interview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.75rem' }}>
        <div>
          <h2 style={{ fontSize:'1.2rem', fontWeight:800, marginBottom:'0.2rem' }}>AI Mock Interview</h2>
          <p style={{ fontSize:'0.8rem', color:'var(--color-dash-text-muted)' }}>
            5 scenario-based questions · 10 minutes · Fullscreen · Voice input · Hiring report
          </p>
        </div>
        <button onClick={onViewHistory} className="edit-cancel-btn" style={{ fontSize:'0.78rem', padding:'0.5rem 1rem' }}>
          View History
        </button>
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom:'1.75rem' }}>
        {['🎙 Voice Input','🖥 Fullscreen Mode','⏱ 10 Min Timer','📊 Live Scoring','📝 Hiring Report'].map(f=>(
          <span key={f} style={{ fontSize:'0.75rem', fontWeight:700, padding:'0.3rem 0.85rem', borderRadius:50,
            background:'var(--color-dash-pale-purple)', color:'var(--color-dash-purple)' }}>{f}</span>
        ))}
      </div>

      <div style={{ maxWidth:600, display:'flex', flexDirection:'column', gap:'1rem' }}>
        {ctxLoading && <p style={{ fontSize:'0.78rem', color:'var(--color-dash-text-muted)' }}>Loading your profile context...</p>}

        <div className="edit-field-group">
          <label className="edit-field-label">Target Role *</label>
          <input className="edit-field-input" placeholder="e.g. AI Engineer, Full Stack Developer..."
            value={role} onChange={e => setRole(e.target.value)} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <div className="edit-field-group">
            <label className="edit-field-label">Your Skills (comma separated)</label>
            <input className="edit-field-input" placeholder="Python, React, SQL..."
              value={skills} onChange={e => setSkills(e.target.value)} />
          </div>
          <div className="edit-field-group">
            <label className="edit-field-label">Skill Gaps (comma separated)</label>
            <input className="edit-field-input" placeholder="Docker, AWS, Kubernetes..."
              value={missingSkills} onChange={e => setMissingSkills(e.target.value)} />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'1rem' }}>
          <div className="edit-field-group">
            <label className="edit-field-label">Resume Summary (optional)</label>
            <input className="edit-field-input" placeholder="Brief background..."
              value={resumeSummary} onChange={e => setResumeSummary(e.target.value)} />
          </div>
          <div className="edit-field-group">
            <label className="edit-field-label">Experience (years)</label>
            <input className="edit-field-input" type="number" min={0} max={30}
              value={experienceYears} onChange={e => setExperienceYears(e.target.value)} />
          </div>
        </div>

        {/* Format info card */}
        <div className="dash-section-card" style={{ padding:'1rem 1.25rem', gap:'0.6rem' }}>
          <span style={{ fontSize:'0.82rem', fontWeight:800 }}>Interview Format</span>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
            {[
              { label:'5 Questions', color:'#8A55FF' },
              { label:'10 Minutes', color:'#3B82F6' },
              { label:'Scenario Based', color:'#F59E0B' },
              { label:'Fullscreen', color:'#10B981' },
            ].map(({ label, color }) => (
              <span key={label} style={{ fontSize:'0.72rem', fontWeight:700, padding:'0.2rem 0.7rem',
                borderRadius:50, background:`${color}1A`, color }}>{label}</span>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'flex-start', gap:'0.6rem', marginTop:'0.25rem',
            padding:'0.65rem 0.85rem', borderRadius:10, background:'rgba(239,68,68,0.06)',
            border:'1px solid rgba(239,68,68,0.15)' }}>
            <span style={{ fontSize:'1rem', flexShrink:0 }}>⚠️</span>
            <span style={{ fontSize:'0.75rem', color:'var(--color-dash-text-muted)', lineHeight:1.5 }}>
              The interview runs in <strong style={{ color:'var(--color-dash-text)' }}>fullscreen mode</strong>.
              Exiting fullscreen <strong style={{ color:'var(--color-dash-red)' }}>once</strong> will
              automatically end and submit the interview.
            </span>
          </div>
        </div>

        {error && <p className="edit-error-msg">{error}</p>}

        <button className="edit-save-btn" onClick={handleStart} disabled={loading}
          style={{ alignSelf:'flex-start', padding:'0.7rem 2rem' }}>
          {loading ? (
            <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <span className="spinner" /> Starting Interview...
            </span>
          ) : '🎯 Start Mock Interview'}
        </button>
      </div>
    </div>
  );
}

// ── Session ───────────────────────────────────────────────────────────────────

function InterviewSession({ sessionData, firebaseUser, onComplete }) {
  const containerRef   = useRef(null);
  const timerRef        = useRef(null);
  const fsExitsRef      = useRef(0);
  const fsActiveRef     = useRef(false); // true once fullscreen is established
  const submittingRef   = useRef(false);
  const answerRef       = useRef('');

  const [phase, setPhase]              = useState('question');
  const [currentQuestion, setCurrentQ] = useState(sessionData.question);
  const [questionNumber, setQNum]      = useState(sessionData.question_number);
  const [answer, setAnswer]            = useState('');
  const [lastEval, setLastEval]        = useState(null);
  const [submitting, setSubmitting]    = useState(false);
  const [error, setError]              = useState('');
  const [timeLeft, setTimeLeft]        = useState(INTERVIEW_DURATION);
  const [fsExits, setFsExits]          = useState(0);
  const [forcedEnd, setForcedEnd]      = useState(false);
  const [history, setHistory]          = useState([]);

  const totalQ = sessionData.total_questions || TOTAL_QUESTIONS;

  // keep answerRef in sync so forceSubmit can read latest value without stale closure
  useEffect(() => { answerRef.current = answer; }, [answer]);

  const { voiceEnabled, setVoiceEnabled, speak, cancel } = useSpeechSynthesis();

  const { listening, supported, interimText, start: startRec, stop: stopRec } = useSpeechRecognition();

  // Callback passed to startRec so final transcript chunks append to answer
  const appendTranscript = useCallback((chunk) => {
    setAnswer(prev => (prev + ' ' + chunk).trimStart());
  }, []);

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // ── Force-submit: directly marks session completed in Firestore ───────────
  const forceSubmit = useCallback(async (reason) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    clearInterval(timerRef.current);
    stopRec();
    cancel();
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    setForcedEnd(true);
    setPhase('evaluating');

    // Submit current answer to backend (best-effort); backend will finalize
    const finalAnswer = answerRef.current.trim() || `[Session ended: ${reason}]`;
    try {
      const result = await submitInterviewAnswer(firebaseUser.uid, sessionData.session_id, finalAnswer);
      // If the backend happened to complete normally, go straight to report
      if (result?.is_complete) {
        onComplete(sessionData.session_id);
        return;
      }
    } catch (_) {}

    // Force-complete: tell backend via a sentinel empty answer until complete
    try {
      let attempts = 0;
      while (attempts < totalQ) {
        const r = await submitInterviewAnswer(firebaseUser.uid, sessionData.session_id, `[ended: ${reason}]`);
        attempts++;
        if (r?.is_complete) break;
      }
    } catch (_) {}

    onComplete(sessionData.session_id);
  }, [firebaseUser.uid, sessionData.session_id, totalQ, stopRec, cancel, onComplete]);

  // ── Enter fullscreen on mount ─────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current || document.documentElement;
    el.requestFullscreen?.().then(() => {
      fsActiveRef.current = true;
    }).catch(() => {
      // Fullscreen denied — still allow the interview to proceed
      fsActiveRef.current = true; // treat as active so exits are counted
    });
  }, []);

  // ── Fullscreen exit detection (only after fullscreen is established) ───────
  useEffect(() => {
    const onFsChange = () => {
      if (!fsActiveRef.current) return;       // ignore the initial entry event
      if (document.fullscreenElement) return; // entering FS, not exiting
      const next = fsExitsRef.current + 1;
      fsExitsRef.current = next;
      setFsExits(next);
      if (next >= MAX_FS_EXITS) {
        forceSubmit('fullscreen exited');
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [forceSubmit]);

  // ── Timer countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          forceSubmit('time expired');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [forceSubmit]);

  // ── Speak question on change ──────────────────────────────────────────────
  useEffect(() => {
    if (currentQuestion?.question) speak(currentQuestion.question);
    return () => cancel();
  }, [currentQuestion]);

  // ── Submit answer ─────────────────────────────────────────────────────────
  const handleSubmitAnswer = async () => {
    const finalAnswer = answer.trim();
    if (!finalAnswer) { setError('Please provide an answer before submitting.'); return; }
    setError('');
    setSubmitting(true);
    submittingRef.current = true;
    stopRec();
    cancel();
    setPhase('evaluating');

    try {
      const result = await submitInterviewAnswer(firebaseUser.uid, sessionData.session_id, finalAnswer);
      const evalEntry = result.evaluation || {};
      setLastEval(evalEntry);
      setHistory(prev => [...prev, { question: currentQuestion, answer: finalAnswer, eval: evalEntry }]);

      if (result.is_complete) {
        clearInterval(timerRef.current);
        if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
        onComplete(sessionData.session_id);
        return;
      }

      if (result.next_question?.followup) {
        setPhase('followup');
        speak(`Follow-up: ${result.next_question.followup}`);
        setTimeout(() => {
          setCurrentQ(result.next_question);
          setQNum(result.question_number);
          setAnswer('');
          setPhase('question');
        }, 3500);
      } else {
        setCurrentQ(result.next_question);
        setQNum(result.question_number);
        setAnswer('');
        setPhase('question');
      }
    } catch (e) {
      setError(e.message || 'Failed to evaluate answer.');
      setPhase('answering');
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const isTimeLow = timeLeft < 120;

  return (
    <div ref={containerRef} style={{
      minHeight:'100vh', background:'var(--color-dash-bg)', color:'var(--color-dash-text)',
      display:'flex', flexDirection:'column', padding:'1.5rem 2rem', gap:'1.25rem',
      boxSizing:'border-box',
    }}>

      {/* ── Header bar ── */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'var(--color-dash-card)', borderRadius:14, padding:'0.85rem 1.5rem',
        border:'1px solid var(--color-dash-border)', flexShrink:0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          {/* Logo / title */}
          <span style={{ fontWeight:800, fontSize:'0.95rem', color:'var(--color-dash-purple)' }}>
            VidyaGuide AI
          </span>
          <span style={{ width:1, height:18, background:'var(--color-dash-border)' }} />
          <span style={{ fontWeight:700, fontSize:'0.88rem' }}>
            Question {questionNumber}/{totalQ}
          </span>
          <span style={{ fontSize:'0.72rem', fontWeight:700, padding:'2px 10px', borderRadius:20,
            background:'rgba(245,158,11,0.12)', color:'#F59E0B' }}>
            Scenario Based
          </span>
          <span style={{ fontSize:'0.72rem', fontWeight:700, padding:'2px 10px', borderRadius:20,
            background:'var(--color-dash-pale-purple)', color:'var(--color-dash-purple)' }}>
            {currentQuestion?.difficulty || 'Intermediate'}
          </span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'1.25rem' }}>
          {/* Fullscreen exit warning */}
          {fsExits > 0 && (
            <span style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--color-dash-red)',
              background:'rgba(239,68,68,0.1)', padding:'3px 10px', borderRadius:20 }}>
              ⚠ Fullscreen exited — next exit ends interview
            </span>
          )}

          {/* Timer */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <svg width={14} height={14} fill="none" stroke={isTimeLow ? 'var(--color-dash-red)' : 'var(--color-dash-text-muted)'}
              strokeWidth={2} viewBox="0 0 24 24">
              <circle cx={12} cy={12} r={10}/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontSize:'1.1rem', fontWeight:800, fontVariantNumeric:'tabular-nums',
              color: isTimeLow ? 'var(--color-dash-red)' : 'var(--color-dash-text)',
              minWidth:54 }}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Voice toggle */}
          <button onClick={() => setVoiceEnabled(v => !v)} style={{
            background: voiceEnabled ? 'var(--color-dash-pale-purple)' : 'var(--color-dash-border)',
            border:'none', borderRadius:8, padding:'0.35rem 0.75rem',
            fontSize:'0.72rem', fontWeight:700, cursor:'pointer',
            color: voiceEnabled ? 'var(--color-dash-purple)' : 'var(--color-dash-text-muted)',
          }}>
            {voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
          </button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ display:'flex', gap:5, flexShrink:0 }}>
        {Array.from({ length: totalQ }).map((_, i) => (
          <div key={i} style={{
            flex:1, height:6, borderRadius:4,
            background: i < questionNumber - 1 ? 'var(--color-dash-green)'
              : i === questionNumber - 1 ? 'var(--color-dash-purple)'
              : 'var(--color-dash-border)',
            transition:'background 0.3s',
          }} />
        ))}
      </div>

      {/* ── Question card ── */}
      <div className="dash-section-card" style={{ gap:'1rem', flexShrink:0 }}>
        <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--color-dash-text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>
          Scenario Based Question #{questionNumber}
        </div>
        <h3 style={{ fontSize:'1.1rem', fontWeight:700, lineHeight:1.65, color:'var(--color-dash-text)' }}>
          {phase === 'followup'
            ? `Follow-up: ${currentQuestion?.followup || currentQuestion?.question}`
            : currentQuestion?.question}
        </h3>
        {phase === 'evaluating' && !forcedEnd && (
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--color-dash-purple)', fontSize:'0.82rem', fontWeight:700 }}>
            <span className="spinner" style={{ borderColor:'rgba(138,85,255,0.3)', borderTopColor:'var(--color-dash-purple)' }} />
            AI is evaluating your answer...
          </div>
        )}
        {forcedEnd && (
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--color-dash-red)', fontSize:'0.82rem', fontWeight:700 }}>
            Interview ended — generating your report...
          </div>
        )}
      </div>

      {/* ── Previous feedback ── */}
      {lastEval?.feedback && phase === 'question' && (
        <div style={{ background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.15)',
          borderRadius:12, padding:'0.85rem 1.1rem', fontSize:'0.8rem', lineHeight:1.5, flexShrink:0 }}>
          <span style={{ fontWeight:700, color:'var(--color-dash-green)' }}>Previous feedback: </span>
          <span style={{ color:'var(--color-dash-text-muted)' }}>{lastEval.feedback}</span>
        </div>
      )}

      {/* ── Answer area ── */}
      {(phase === 'question' || phase === 'answering') && (
        <div className="dash-section-card" style={{ gap:'1rem', flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:'0.8rem', fontWeight:700 }}>Your Answer</span>
            {supported && (
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.75rem' }}>
                <span style={{ width:8, height:8, borderRadius:'50%',
                  background: listening ? 'var(--color-dash-red)' : 'var(--color-dash-border)',
                  animation: listening ? 'pulse 1s infinite' : 'none', flexShrink:0 }} />
                <span style={{ color: listening ? 'var(--color-dash-red)' : 'var(--color-dash-text-muted)', fontWeight:700 }}>
                  {listening ? 'Recording...' : 'Microphone off'}
                </span>
                {interimText && (
                  <span style={{ color:'var(--color-dash-text-muted)', fontStyle:'italic', fontSize:'0.72rem', maxWidth:200,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {interimText}
                  </span>
                )}
              </div>
            )}
          </div>

          <textarea value={answer} onChange={e => setAnswer(e.target.value)}
            placeholder="Type your answer here, or use the microphone to speak..."
            rows={6}
            style={{ width:'100%', padding:'0.8rem 1rem', borderRadius:10,
              border:'1px solid var(--color-dash-border)',
              background:'var(--color-dash-bg)', color:'var(--color-dash-text)',
              fontSize:'0.88rem', lineHeight:1.6, resize:'vertical', outline:'none',
              fontFamily:'var(--font-family)' }} />

          {supported && (
            <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
              {!listening ? (
                <button onClick={() => { startRec(appendTranscript); setPhase('answering'); }} style={{
                  display:'flex', alignItems:'center', gap:'0.5rem',
                  padding:'0.55rem 1.1rem', borderRadius:10, border:'none',
                  background:'var(--color-dash-red)', color:'#fff',
                  fontSize:'0.82rem', fontWeight:700, cursor:'pointer' }}>
                  🎙 Start Recording
                </button>
              ) : (
                <button onClick={stopRec} style={{
                  display:'flex', alignItems:'center', gap:'0.5rem',
                  padding:'0.55rem 1.1rem', borderRadius:10,
                  border:'2px solid var(--color-dash-red)', background:'transparent',
                  color:'var(--color-dash-red)', fontSize:'0.82rem', fontWeight:700, cursor:'pointer' }}>
                  ⏹ Stop Recording
                </button>
              )}
            </div>
          )}

          {error && <p className="edit-error-msg">{error}</p>}

          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'auto' }}>
            <button className="edit-save-btn" onClick={handleSubmitAnswer}
              disabled={submitting || !answer.trim()}
              style={{ padding:'0.65rem 1.75rem' }}>
              {submitting ? (
                <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <span className="spinner" /> Submitting...
                </span>
              ) : questionNumber >= totalQ ? '✓ Finish Interview' : 'Submit & Next →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Running score rings ── */}
      {history.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.75rem', flexShrink:0 }}>
          {[
            { label:'Technical',    key:'technical',    color:'#8A55FF' },
            { label:'Communication',key:'communication', color:'#3B82F6' },
            { label:'Confidence',   key:'confidence',   color:'#10B981' },
            { label:'Completeness', key:'completeness', color:'#F59E0B' },
          ].map(({ label, key, color }) => {
            const vals = history.map(h => h.eval?.[key] || 0);
            const avg  = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : 0;
            return (
              <div key={label} className="dash-kpi-card"
                style={{ minHeight:'auto', padding:'0.85rem', alignItems:'center', gap:'0.35rem' }}>
                <span className="dash-kpi-title">{label}</span>
                <ScoreRing value={parseFloat(avg)} size={48} color={color} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Report ────────────────────────────────────────────────────────────────────

function InterviewReport({ sessionId, onBack, onNewInterview }) {
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const attempt = async () => {
      try {
        const data = await getInterviewReport(sessionId);
        if (!cancelled) { setReport(data); setLoading(false); }
      } catch (e) {
        // 400 means session not yet completed — retry up to 5 times
        if (!cancelled && retries < 5) {
          setTimeout(() => setRetries(r => r + 1), 2500);
        } else if (!cancelled) {
          setLoading(false);
        }
      }
    };
    attempt();
    return () => { cancelled = true; };
  }, [sessionId, retries]);

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem', padding:'4rem 0', color:'var(--color-dash-text-muted)' }}>
      <span className="spinner" style={{ borderColor:'rgba(138,85,255,0.3)', borderTopColor:'var(--color-dash-purple)', width:28, height:28, borderWidth:3 }} />
      <span style={{ fontWeight:700, fontSize:'0.9rem' }}>Generating your interview report...</span>
      {retries > 0 && <span style={{ fontSize:'0.75rem' }}>Attempt {retries + 1} of 6...</span>}
    </div>
  );
  if (!report) return <p style={{ color:'var(--color-dash-red)' }}>Failed to load report.</p>;

  return (
    <div style={{ maxWidth:800, display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      <div style={{ display:'flex', gap:'0.75rem' }}>
        <button className="edit-cancel-btn" onClick={onBack} style={{ fontSize:'0.78rem', padding:'0.45rem 1rem' }}>← Back</button>
        <button className="edit-save-btn" onClick={onNewInterview} style={{ fontSize:'0.78rem', padding:'0.45rem 1rem' }}>New Interview</button>
      </div>

      <div>
        <h2 style={{ fontSize:'1.2rem', fontWeight:800, marginBottom:'0.2rem' }}>Interview Report</h2>
        <p style={{ fontSize:'0.78rem', color:'var(--color-dash-text-muted)' }}>{report.role}</p>
      </div>

      {/* Overall + Hiring */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <div className="dash-section-card" style={{
          background:'linear-gradient(135deg,rgba(138,85,255,0.08) 0%,rgba(138,85,255,0.02) 100%)',
          border:'2px solid var(--color-dash-purple)', alignItems:'center', gap:'0.5rem', padding:'1.5rem' }}>
          <span className="dash-kpi-title">Overall Score</span>
          <ScoreRing value={parseFloat((report.overall_score||0).toFixed(1))} size={80} />
        </div>
        <div className="dash-section-card" style={{ alignItems:'center', justifyContent:'center', gap:'1rem', padding:'1.5rem' }}>
          <span className="dash-kpi-title">Hiring Recommendation</span>
          <HiringBadge recommendation={report.hiring_recommendation} />
        </div>
      </div>

      {/* Breakdown + Radar */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'1.5rem', alignItems:'start' }}>
        <div className="dash-section-card" style={{ gap:'1rem' }}>
          <span className="dash-kpi-title" style={{ marginBottom:'0.5rem' }}>Score Breakdown</span>
          {[
            { label:'Technical',     val:report.technical_average,     color:'#8A55FF' },
            { label:'Communication', val:report.communication_average, color:'#3B82F6' },
            { label:'Confidence',    val:report.confidence_average,    color:'#10B981' },
            { label:'Completeness',  val:report.completeness_average,  color:'#F59E0B' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', fontWeight:700 }}>
                <span>{label}</span>
                <span style={{ color }}>{(val||0).toFixed(1)}/10</span>
              </div>
              <div style={{ height:6, borderRadius:4, background:'var(--color-dash-border)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${((val||0)/10)*100}%`, background:color, borderRadius:4, transition:'width 0.8s ease' }} />
              </div>
            </div>
          ))}
        </div>
        <div className="dash-section-card" style={{ padding:'1.25rem', alignItems:'center' }}>
          <span className="dash-kpi-title" style={{ marginBottom:'0.5rem' }}>Radar Chart</span>
          <RadarChart scores={{
            technical:     report.technical_average     || 0,
            communication: report.communication_average || 0,
            confidence:    report.confidence_average    || 0,
            completeness:  report.completeness_average  || 0,
          }} />
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <div className="dash-section-card" style={{ gap:'0.75rem' }}>
          <span className="dash-kpi-title">Top Strengths</span>
          {(report.strengths||[]).map((s,i)=>(
            <div key={i} style={{ display:'flex', gap:'0.6rem', alignItems:'flex-start', fontSize:'0.82rem' }}>
              <span style={{ color:'var(--color-dash-green)', fontWeight:800, flexShrink:0, marginTop:2 }}>✓</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
        <div className="dash-section-card" style={{ gap:'0.75rem' }}>
          <span className="dash-kpi-title">Improvement Areas</span>
          {(report.weaknesses||[]).map((w,i)=>(
            <div key={i} style={{ display:'flex', gap:'0.6rem', alignItems:'flex-start', fontSize:'0.82rem' }}>
              <span style={{ color:'var(--color-dash-gold)', fontWeight:800, flexShrink:0, marginTop:2 }}>→</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="dash-section-card" style={{ gap:'0.75rem' }}>
        <span className="dash-kpi-title" style={{ marginBottom:'0.25rem' }}>Recommended Learning Resources</span>
        {(report.recommendations||[]).map((r,i)=>(
          <div key={i} className="recommendation-card-item" style={{ cursor:'default' }}>
            <div className="recommendation-card-icon-box">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="recommendation-card-content">
              <span className="recommendation-card-title">{r}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Q&A history */}
      {report.interview_history?.length > 0 && (
        <div className="dash-section-card" style={{ gap:'1rem' }}>
          <span className="dash-kpi-title" style={{ marginBottom:'0.25rem' }}>Question-by-Question Review</span>
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {report.interview_history.map((h,i)=>(
              <div key={i} style={{ padding:'1rem 1.25rem', borderRadius:12,
                borderLeft:`4px solid ${(h.overall_score||5)>=7?'var(--color-dash-green)':(h.overall_score||5)>=5?'var(--color-dash-gold)':'var(--color-dash-red)'}`,
                background:'var(--color-dash-bg)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem', flexWrap:'wrap', gap:'0.5rem' }}>
                  <span style={{ fontWeight:800, fontSize:'0.85rem' }}>Q{i+1}. {h.question}</span>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--color-dash-purple)' }}>
                    Score: {(h.overall_score||0).toFixed(1)}/10
                  </span>
                </div>
                <p style={{ fontSize:'0.78rem', color:'var(--color-dash-text-muted)', marginBottom:'0.4rem', lineHeight:1.5 }}>
                  <strong>Answer:</strong> {h.answer}
                </p>
                {h.feedback && (
                  <p style={{ fontSize:'0.75rem', color:'var(--color-dash-text-muted)', lineHeight:1.4 }}>
                    💡 {h.feedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────────────

function InterviewHistory({ firebaseUser, onBack, onViewReport }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getInterviewHistory(firebaseUser.uid)
      .then(data => setSessions(data.sessions||[]))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [firebaseUser]);

  const recColor = r => ({ 'Strong Hire':'#10B981','Hire':'#3B82F6','Borderline':'#F59E0B','Needs Improvement':'#EF4444' }[r]||'#9CA3AF');

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem' }}>
        <button className="edit-cancel-btn" onClick={onBack} style={{ fontSize:'0.78rem', padding:'0.45rem 1rem' }}>← Back</button>
        <h2 style={{ fontSize:'1.2rem', fontWeight:800 }}>Interview History</h2>
      </div>

      {loading && (
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', color:'var(--color-dash-text-muted)' }}>
          <span className="spinner" style={{ borderColor:'rgba(138,85,255,0.3)', borderTopColor:'var(--color-dash-purple)', width:18, height:18 }} />
          Loading history...
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div style={{ textAlign:'center', padding:'3rem 0', color:'var(--color-dash-text-muted)' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>🎤</div>
          <p style={{ fontWeight:700, fontSize:'0.9rem' }}>No interviews yet</p>
          <p style={{ fontSize:'0.78rem', marginTop:'0.25rem' }}>Start your first mock interview to see results here.</p>
          <button className="edit-save-btn" onClick={onBack} style={{ marginTop:'1.25rem', padding:'0.6rem 1.5rem' }}>
            Start Interview
          </button>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
        {sessions.map((s,i)=>(
          <div key={s.session_id||i} className="dash-section-card" style={{
            flexDirection:'row', alignItems:'center', justifyContent:'space-between',
            padding:'1rem 1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.2rem', flex:1 }}>
              <span style={{ fontWeight:800, fontSize:'0.9rem' }}>{s.role||'Interview'}</span>
              <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                <span style={{ fontSize:'0.72rem', color:'var(--color-dash-text-muted)' }}>
                  {s.started_at ? new Date(s.started_at.seconds*1000).toLocaleDateString() : '—'}
                </span>
                <span style={{ fontSize:'0.72rem', fontWeight:700, padding:'1px 8px', borderRadius:20,
                  background: s.status==='completed'?'rgba(16,185,129,0.1)':'rgba(245,158,11,0.1)',
                  color: s.status==='completed'?'var(--color-dash-green)':'var(--color-dash-gold)' }}>
                  {s.status}
                </span>
                <span style={{ fontSize:'0.72rem', color:'var(--color-dash-text-muted)' }}>
                  {s.total_questions||5} questions
                </span>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'1.25rem' }}>
              {s.overall_score != null && <ScoreRing value={parseFloat((s.overall_score||0).toFixed(1))} size={48} />}
              {s.hiring_recommendation && (
                <span style={{ fontSize:'0.72rem', fontWeight:700, color:recColor(s.hiring_recommendation),
                  background:`${recColor(s.hiring_recommendation)}1A`, padding:'3px 10px', borderRadius:50 }}>
                  {s.hiring_recommendation}
                </span>
              )}
              {s.status === 'completed' && (
                <button className="edit-save-btn" onClick={() => onViewReport(s.session_id)}
                  style={{ padding:'0.4rem 1rem', fontSize:'0.75rem' }}>
                  View Report
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function MockInterview({ user, firebaseUser }) {
  const [view, setView]                   = useState('landing');
  const [sessionData, setSessionData]     = useState(null);
  const [reportSessionId, setReportId]    = useState(null);

  return (
    <div>
      {view === 'landing' && (
        <InterviewLanding
          firebaseUser={firebaseUser}
          onStart={data => { setSessionData(data); setView('session'); }}
          onViewHistory={() => setView('history')}
        />
      )}
      {view === 'session' && sessionData && (
        <InterviewSession
          sessionData={sessionData}
          firebaseUser={firebaseUser}
          onComplete={id => { setReportId(id); setView('report'); }}
        />
      )}
      {view === 'report' && reportSessionId && (
        <InterviewReport
          sessionId={reportSessionId}
          onBack={() => setView('history')}
          onNewInterview={() => { setSessionData(null); setReportId(null); setView('landing'); }}
        />
      )}
      {view === 'history' && (
        <InterviewHistory
          firebaseUser={firebaseUser}
          onBack={() => setView('landing')}
          onViewReport={id => { setReportId(id); setView('report'); }}
        />
      )}
    </div>
  );
}
