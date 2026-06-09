import { useState, useEffect } from 'react';

// SVG Icons
function GoogleIcon() {
  return (
    <svg className="google-icon-svg" viewBox="0 0 24 24" width="18" height="18" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.77-.07-1.54-.2-2.27H12v4.51h6.6c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.69-5.17 3.69-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.37 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.18 7.18 0 0 1 0-4.58V6.62H1.29a11.94 11.94 0 0 0 0 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="star-icon" viewBox="0 0 24 24" width="14" height="14" style={{ fill: '#FBBF24' }}>
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function ShieldBadge() {
  return (
    <svg width="22" height="26" viewBox="0 0 24 28" fill="none">
      <path
        d="M12 2c6 0 10 4 10 9.5c0 6.5-6.5 11.5-10 13.5c-3.5-2-10-7-10-13.5C2 6 6 2 12 2z"
        fill="url(#shieldGoldHero)"
        stroke="#D97706"
        strokeWidth="1.5"
      />
      <polygon points="12 6.5 13.8 10.3 18 10.8 14.9 13.8 15.8 18 12 15.8 8.2 18 9.1 13.8 6 10.8 10.2 10.3" fill="#FFFFFF" />
      <defs>
        <linearGradient id="shieldGoldHero" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SidebarIcon({ name }) {
  const icons = {
    Dashboard: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
    ResumeAnalysis: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    CareerPaths: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    Roadmaps: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 15 9 18 3 15" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
    Quizzes: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    Progress: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    MockInterview: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <circle cx="12" cy="11" r="3" />
      </svg>
    ),
    Settings: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    )
  };
  return icons[name] || null;
}

function CharacterDeskSVG() {
  return (
    <svg className="fc-character-svg" viewBox="0 0 400 400" fill="none">
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7B3FFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#9672FF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="laptopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#080e24" />
        </linearGradient>
        <linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7B3FFF" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="100%" stopColor="#fed7aa" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="180" fill="url(#glow)" />
      <path d="M60 320h280v15H60z" fill="#E2E8F0" rx="4" />
      <path d="M50 335h300v8H50z" fill="#CBD5E1" />
      <rect x="140" y="160" width="120" height="130" rx="20" fill="#1e293b" />
      <rect x="185" y="270" width="30" height="60" fill="#334155" />
      <path d="M130 320c0-60 30-80 70-80s70 20 70 80H130z" fill="url(#hoodieGrad)" />
      <path d="M190 250v25M210 250v20" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <circle cx="200" cy="180" r="45" fill="url(#skinGrad)" />
      <path d="M158 175c5-35 30-45 42-45s37 10 42 45c-8-15-22-18-42-18s-34 3-42 18z" fill="#0f172a" />
      <path d="M175 140c10-15 25-15 35-5 5-15 20-12 25 2" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
      <circle cx="182" cy="182" r="14" stroke="#0f172a" strokeWidth="3" fill="none" />
      <circle cx="218" cy="182" r="14" stroke="#0f172a" strokeWidth="3" fill="none" />
      <path d="M196 182h8" stroke="#0f172a" strokeWidth="3" />
      <path d="M168 182h5M227 182h5" stroke="#0f172a" strokeWidth="3" />
      <circle cx="182" cy="182" r="2.5" fill="#0f172a" />
      <circle cx="218" cy="182" r="2.5" fill="#0f172a" />
      <path d="M194 202c3 4 9 4 12 0" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M220 270l60 20c4 1.5 6 5 4.5 9l-5 15c-1.5 4-5 6-9 4.5l-60-20c-4-1.5-6-5-4.5-9l5-15c1.5-4 5-6 9-4.5z" fill="url(#laptopGrad)" />
      <path d="M225 314l55 18" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
      <path d="M220 270l15-25c2-3 6-4 9-2l40 24c3 2 4 6 2 9l-15 25" fill="#C3B5FD" opacity="0.3" />
      <path d="M246 288l6 10 10-13" stroke="#7B3FFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="105" y="295" width="16" height="25" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
      <path d="M101 292h24v4h-24z" fill="#78350F" rx="1" />
      <path d="M121 300c3 0 5 2 5 5s-2 5-5 5" stroke="#CBD5E1" strokeWidth="2" fill="none" />
      <rect x="295" y="295" width="22" height="25" rx="3" fill="#D1FAE5" />
      <path d="M290 295h32v3H290z" fill="#059669" />
      <path d="M306 295c-10-15-5-25-5-25s10 10 5 25zm0 0c10-15 5-25 5-25s-10 10-5 25zm-6-3c0-18-10-22-10-22s12 8 10 22z" fill="#10B981" />
    </svg>
  );
}

function FeatureIcon({ name }) {
  const icons = {
    Resume: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    Guidance: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    Map: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 15 9 18 3 15" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
    Quizzes: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 9h6M9 13h6M9 17h4" />
      </svg>
    ),
    Tracking: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    Mock: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
        <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8" />
      </svg>
    )
  };
  return icons[name] || null;
}

export default function LandingPage({ theme, setTheme, onOpenLogin }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [resumeStatus, setResumeStatus] = useState('idle');
  const [resumeProgress, setResumeProgress] = useState(0);
  const [atsScore, setAtsScore] = useState(82);

  // Roadmap list interactive checklist
  const [roadmapNodes, setRoadmapNodes] = useState([
    { id: 1, title: 'Python Fundamentals', desc: 'Syntax, variables, lists & loops', completed: true },
    { id: 2, title: 'Data Analysis with Pandas', desc: 'Clean, filter & aggregate datasets', completed: true },
    { id: 3, title: 'Machine Learning Basics', desc: 'Supervised vs Unsupervised models', completed: false },
    { id: 4, title: 'Deep Learning Foundations', desc: 'Neural networks & backpropagation', completed: false }
  ]);

  // Sync scroll positioning on click of features
  const handleFeatureClick = (tabName) => {
    setActiveTab(tabName);
    if (theme === 'light') {
      setTheme('dark');
    }
    const heroSection = document.getElementById('hero-section-id');
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Run ATS Resume Scan Simulation
  const startResumeScan = () => {
    if (resumeStatus !== 'idle') return;
    setResumeStatus('scanning');
    setResumeProgress(0);
  };

  useEffect(() => {
    let interval;
    if (resumeStatus === 'scanning') {
      interval = setInterval(() => {
        setResumeProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setResumeStatus('done');
            setAtsScore(Math.floor(Math.random() * 15) + 80); // generate random high score 80-95
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [resumeStatus]);

  const toggleRoadmapNode = (id) => {
    const updated = roadmapNodes.map((node) => {
      if (node.id === id) {
        return { ...node, completed: !node.completed };
      }
      return node;
    });
    setRoadmapNodes(updated);
  };

  const completedCount = roadmapNodes.filter(n => n.completed).length;
  const roadmapPct = Math.round((completedCount / roadmapNodes.length) * 100);

  return (
    <div>
      {/* Header */}
      <header className="main-header">
        <div className="container header-container">
          <a href="#" className="logo-container">
            <div className="logo-icon">V</div>
            <div>
              VidyaGuide <span style={{ color: 'var(--color-brand-blue)' }}>AI</span>
              <span className="logo-subtext">Your AI Career Mentor</span>
            </div>
          </a>

          <nav>
            <ul className="nav-menu">
              <li><a href="#" className="nav-link active">Home</a></li>
              <li><a href="#features" className="nav-link">Features</a></li>
              <li><a href="#how-it-works" className="nav-link">How It Works</a></li>
              <li><a href="#roadmap" className="nav-link">Roadmap</a></li>
              <li><a href="#about" className="nav-link">About Us</a></li>
            </ul>
          </nav>

          <div className="header-actions">
            <button 
              className="theme-toggle-btn" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <button className="btn btn-primary" onClick={onOpenLogin}>
              <GoogleIcon />
              Sign in with Google
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" id="hero-section-id">
        <div className="container">
          <div className="hero-grid">
            
            {/* Left Column: Hero Text */}
            <div className="hero-text-content">
              <div className="badge-tag">Your AI Career Mentor</div>
              <h1 className="hero-title">
                Plan Smarter. Learn Better.<br />
                <span className="purple-gradient-text">Achieve More.</span>
              </h1>
              <p className="hero-subtitle">
                Get personalized career guidance, skill gap analysis, custom roadmaps, quizzes and track your progress with the power of AI.
              </p>
              
              <div className="hero-actions">
                <button className="btn btn-primary btn-lg" onClick={onOpenLogin}>
                  <GoogleIcon />
                  Get Started with Google
                </button>
                <button className="btn btn-secondary btn-lg" onClick={onOpenLogin}>
                  Watch Demo
                </button>
              </div>

              <div className="social-proof">
                <div className="avatar-group">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80" alt="Student" className="social-avatar" />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80" alt="Student" className="social-avatar" />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop&q=80" alt="Student" className="social-avatar" />
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&fit=crop&q=80" alt="Student" className="social-avatar" />
                  <div className="social-avatar avatar-plus">1K+</div>
                </div>
                <div className="social-details">
                  <div className="stars-container">
                    <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
                  </div>
                  <span className="social-text">
                    Trusted by <strong>1,000+ students</strong> <span className="social-rating">4.9/5</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Mockup Layout (Theme dependent) */}
            <div className="hero-visual-wrapper">
              {theme === 'dark' ? (
                /* Interactive Dashboard Mockup - Dark Theme Spec */
                <div className="dashboard-panel-outer">
                  <div className="dashboard-panel-inner">
                    
                    {/* Left Sidebar Mockup */}
                    <div className="dash-sidebar">
                      <div className="dash-sidebar-logo">VidyaGuide AI</div>
                      <ul className="dash-sidebar-menu">
                        {['Dashboard', 'Resume Analysis', 'Career Paths', 'Roadmaps', 'Quizzes', 'Progress', 'Settings'].map((tab) => (
                          <li key={tab}>
                            <button 
                              className={`dash-menu-item-btn ${activeTab === tab ? 'active' : ''}`}
                              onClick={() => setActiveTab(tab)}
                            >
                              <SidebarIcon name={tab.replace(/\s+/g, '')} />
                              {tab}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Main Area Mockup */}
                    <div className="dash-main-area">
                      <div className="dash-header">
                        <div>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Welcome back, Koushik 👋</h3>
                          <span style={{ fontSize: '0.65rem', color: '#64748B' }}>Let's continue your journey...</span>
                        </div>
                      </div>

                      {activeTab === 'Dashboard' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                            <div className="dash-card" style={{ background: 'white', borderRadius: '8px', padding: '0.65rem', border: '1px solid #F1F5F9' }}>
                              <span className="dash-card-title" style={{ fontSize: '0.6rem', color: '#64748B' }}>ATS Score</span>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                                <strong style={{ fontSize: '1.1rem' }}>{atsScore}/100</strong>
                                <span style={{ fontSize: '0.6rem', background: '#ECFDF5', color: '#059669', padding: '1px 4px', borderRadius: '4px' }}>Good Score</span>
                              </div>
                            </div>
                            <div className="dash-card" style={{ background: 'white', borderRadius: '8px', padding: '0.65rem', border: '1px solid #F1F5F9' }}>
                              <span className="dash-card-title" style={{ fontSize: '0.6rem', color: '#64748B' }}>Current Badge</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                                <ShieldBadge />
                                <strong style={{ fontSize: '0.75rem' }}>Gold</strong>
                              </div>
                            </div>
                          </div>

                          <div style={{ background: 'white', borderRadius: '8px', padding: '0.75rem', border: '1px solid #F1F5F9', position: 'relative' }}>
                            <span className="rec-step-sublabel" style={{ fontSize: '0.6rem', color: 'var(--color-brand-purple)', fontWeight: 800 }}>Recommended Next Step</span>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, marginTop: '2px' }}>Machine Learning Basics</h4>
                            <div style={{ height: '5px', background: '#F1F5F9', borderRadius: '4px', marginTop: '6px', overflow: 'hidden' }}>
                              <div style={{ width: `${roadmapPct}%`, background: 'var(--color-brand-purple)', height: '100%' }}></div>
                            </div>
                            <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.68rem', borderRadius: '4px', marginTop: '8px' }} onClick={() => setActiveTab('Roadmaps')}>
                              Continue Roadmap
                            </button>
                          </div>
                        </div>
                      )}

                      {activeTab === 'Resume Analysis' && (
                        <div style={{ background: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid #F1F5F9', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '0.5rem' }}>ATS Resume Scanner</span>
                          {resumeStatus === 'idle' && (
                            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px' }} onClick={startResumeScan}>
                              Scan Resume
                            </button>
                          )}
                          {resumeStatus === 'scanning' && (
                            <div>
                              <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', margin: '0.5rem 0' }}>
                                <div style={{ width: `${resumeProgress}%`, background: 'var(--color-brand-purple)', height: '100%' }}></div>
                              </div>
                              <span style={{ fontSize: '0.65rem' }}>Analyzing: {resumeProgress}%</span>
                            </div>
                          )}
                          {resumeStatus === 'done' && (
                            <div>
                              <strong style={{ fontSize: '1.2rem', color: 'var(--color-brand-purple)', display: 'block' }}>{atsScore}/100</strong>
                              <span style={{ fontSize: '0.65rem', color: '#64748B' }}>Scan completed! Check details by logging in.</span>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'Career Paths' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                          <div style={{ background: 'white', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #F1F5F9', fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between' }}>
                            <strong>Machine Learning Engineer</strong>
                            <span style={{ color: 'var(--color-green)' }}>94% Match</span>
                          </div>
                          <div style={{ background: 'white', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #F1F5F9', fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between' }}>
                            <strong>Data Scientist</strong>
                            <span style={{ color: 'var(--color-green)' }}>87% Match</span>
                          </div>
                        </div>
                      )}

                      {activeTab === 'Roadmaps' && (
                        <div style={{ background: 'white', borderRadius: '8px', padding: '0.75rem', border: '1px solid #F1F5F9' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {roadmapNodes.map((node) => (
                              <div 
                                key={node.id} 
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                onClick={() => toggleRoadmapNode(node.id)}
                              >
                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #CBD5E1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: node.completed ? 'var(--color-brand-purple)' : 'transparent', borderColor: node.completed ? 'var(--color-brand-purple)' : '#CBD5E1' }}></span>
                                <span style={{ fontSize: '0.72rem', textDecoration: node.completed ? 'line-through' : 'none', color: node.completed ? '#64748B' : '#0F172A' }}>{node.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeTab !== 'Dashboard' && activeTab !== 'Resume Analysis' && activeTab !== 'Career Paths' && activeTab !== 'Roadmaps' && (
                        <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', border: '1px solid #F1F5F9', textAlign: 'center', fontSize: '0.75rem', color: '#64748B' }}>
                          Login with Google to unlock full mentoring metrics.
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              ) : (
                /* Light Theme Spec - Coder desk illustration and floating cards */
                <div className="floating-cards-layout">
                  <div className="floating-card-item fc-ats">
                    <div className="dash-card" style={{ width: '150px', padding: '0.75rem', background: 'white', border: '1px solid rgba(123, 63, 255, 0.15)', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.03)' }}>
                      <span className="dash-card-title" style={{ fontSize: '0.6rem', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>ATS Score</span>
                      <strong style={{ fontSize: '1.15rem', display: 'block', margin: '2px 0' }}>82/100</strong>
                      <span style={{ fontSize: '0.6rem', color: 'var(--color-green)', fontWeight: 700 }}>↑ 18% Better</span>
                    </div>
                  </div>
                  <div className="floating-card-item fc-skills">
                    <div className="dash-card" style={{ width: '135px', padding: '0.75rem', background: 'white', border: '1px solid rgba(123, 63, 255, 0.15)', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.03)' }}>
                      <span className="dash-card-title" style={{ fontSize: '0.6rem', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>Skills Match</span>
                      <strong style={{ fontSize: '1.15rem', display: 'block', margin: '2px 0' }}>78%</strong>
                    </div>
                  </div>
                  <div className="fc-character-wrapper">
                    <CharacterDeskSVG />
                  </div>
                  <div className="floating-card-item fc-mentor">
                    <div className="dash-card" style={{ width: '175px', padding: '0.65rem', background: 'white', border: '1px solid rgba(123, 63, 255, 0.15)', borderRadius: '12px', display: 'flex', gap: '0.45rem', alignItems: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.03)' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#F0EBFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>🤖</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--color-brand-purple)' }}>AI Mentor</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#0F172A' }}>Let's build your career!</span>
                      </div>
                    </div>
                  </div>
                  <div className="floating-card-item fc-badge">
                    <div className="dash-card" style={{ width: '140px', padding: '0.75rem', background: 'white', border: '1px solid rgba(123, 63, 255, 0.15)', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.03)' }}>
                      <span className="dash-card-title" style={{ fontSize: '0.6rem', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>Current Badge</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                        <ShieldBadge />
                        <strong style={{ fontSize: '0.8rem' }}>Gold</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Stats Ribbon */}
          <div className="stats-ribbon">
            <div className="stat-item">
              <div className="stat-icon-wrapper">✓</div>
              <div className="stat-text">
                <span className="stat-value">1K+</span>
                <span className="stat-label">Active Students</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon-wrapper">✓</div>
              <div className="stat-text">
                <span className="stat-value">50+</span>
                <span className="stat-label">Skills Covered</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon-wrapper">✓</div>
              <div className="stat-text">
                <span className="stat-value">95%</span>
                <span className="stat-label">Accuracy Rate</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon-wrapper">✓</div>
              <div className="stat-text">
                <span className="stat-value">24/7</span>
                <span className="stat-label">AI Support</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Features Grid */}
      <section className="feature-section" id="features">
        <div className="container">
          <div className="section-header-wrapper">
            <span className="section-tag">Features</span>
            <h2 className="section-title">Everything You Need to Build Your Dream Career</h2>
            <p className="section-subtitle">AI-powered tools to guide you at every step of your professional journey</p>
          </div>

          <div className="features-grid">
            <div className="feature-card" onClick={() => handleFeatureClick('Resume Analysis')}>
              <div className="feature-icon-box"><FeatureIcon name="Resume" /></div>
              <h3 className="feature-card-title">Resume Analysis</h3>
              <p className="feature-card-desc">Get an ATS score, skill match and personalized suggestions.</p>
            </div>
            <div className="feature-card" onClick={() => handleFeatureClick('Career Paths')}>
              <div className="feature-icon-box"><FeatureIcon name="Guidance" /></div>
              <h3 className="feature-card-title">Career Guidance</h3>
              <p className="feature-card-desc">Discover the best career paths tailored to your profile.</p>
            </div>
            <div className="feature-card" onClick={() => handleFeatureClick('Roadmaps')}>
              <div className="feature-icon-box"><FeatureIcon name="Map" /></div>
              <h3 className="feature-card-title">Personalized Roadmaps</h3>
              <p className="feature-card-desc">Get a custom learning roadmap based on your goals and pace.</p>
            </div>
            <div className="feature-card" onClick={() => handleFeatureClick('Quizzes')}>
              <div className="feature-icon-box"><FeatureIcon name="Quizzes" /></div>
              <h3 className="feature-card-title">AI Quizzes</h3>
              <p className="feature-card-desc">Test your knowledge with AI generated quizzes.</p>
            </div>
            <div className="feature-card" onClick={() => handleFeatureClick('Progress')}>
              <div className="feature-icon-box"><FeatureIcon name="Tracking" /></div>
              <h3 className="feature-card-title">Progress Tracking</h3>
              <p className="feature-card-desc">Track your learning progress and earn badges.</p>
            </div>
            <div className="feature-card" onClick={() => handleFeatureClick('Mock Interview')}>
              <div className="feature-icon-box"><FeatureIcon name="Mock" /></div>
              <h3 className="feature-card-title">AI Mock Interview</h3>
              <p className="feature-card-desc">Practice interviews with AI and improve your confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="container">
          <div className="section-header-wrapper">
            <span className="section-tag">How It Works</span>
            <h2 className="section-title">Your 4-Step Career Acceleration Path</h2>
            <p className="section-subtitle">A simplified approach to landing your target tech jobs.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>
              <h3 className="step-title">Upload Resume</h3>
              <p className="step-desc">Our parser reads your experience, evaluates ATS layouts, and grades formatting instantly.</p>
            </div>
            <div className="step-card">
              <span className="step-number">02</span>
              <h3 className="step-title">Identify Gaps</h3>
              <p className="step-desc">AI agents compare your skills against real job listings to map what skills you need next.</p>
            </div>
            <div className="step-card">
              <span className="step-number">03</span>
              <h3 className="step-title">Custom Roadmaps</h3>
              <p className="step-desc">Receive a personalized curriculum with milestones, concepts, and quizzes matching your goals.</p>
            </div>
            <div className="step-card">
              <span className="step-number">04</span>
              <h3 className="step-title">AI Mock Practice</h3>
              <p className="step-desc">Run mock panels with an AI interview coach to perfect your communication before going live.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Preview Section */}
      <section className="roadmap-section" id="roadmap">
        <div className="container">
          <div className="section-header-wrapper">
            <span className="section-tag">Roadmaps</span>
            <h2 className="section-title">Tailored Career Roadmap Tracks</h2>
            <p className="section-subtitle">Preview typical milestones for popular tech engineering careers.</p>
          </div>

          <div className="roadmap-preview-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, textAlign: 'center', marginBottom: '1.5rem' }}>AI Engineer Learning Track</h3>
            <div className="roadmap-timeline-horizontal">
              <div className="roadmap-timeline-step done">
                <span className="roadmap-step-dot">1</span>
                <span className="roadmap-step-title">Python Basics</span>
                <span className="roadmap-step-desc">Syntax, OOP, and data structures.</span>
              </div>
              <div className="roadmap-timeline-step done">
                <span className="roadmap-step-dot">2</span>
                <span className="roadmap-step-title">Statistics</span>
                <span className="roadmap-step-desc">Probability and data cleaning.</span>
              </div>
              <div className="roadmap-timeline-step">
                <span className="roadmap-step-dot">3</span>
                <span className="roadmap-step-title">Machine Learning</span>
                <span className="roadmap-step-desc">Supervised models and regressions.</span>
              </div>
              <div className="roadmap-timeline-step">
                <span className="roadmap-step-dot">4</span>
                <span className="roadmap-step-title">Deep Learning</span>
                <span className="roadmap-step-desc">Neural nets and transformers.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="about-section" id="about">
        <div className="container">
          <div className="about-grid">
            
            <div className="about-text-column">
              <span className="section-tag" style={{ alignSelf: 'flex-start' }}>About Us</span>
              <h2 className="section-title" style={{ textAlign: 'left' }}>Empowering Students to Lead the Tech Industry</h2>
              <p className="section-subtitle" style={{ textAlign: 'left', marginBottom: '1rem' }}>
                At VidyaGuide AI, we believe premium career mentorship should be accessible to every student, everywhere. Our automated AI career coach analyzes student portfolios and outlines immediate roadmaps to close skill gaps.
              </p>
              <ul className="about-bullets">
                <li className="about-bullet-item">
                  <div className="about-bullet-icon">✓</div>
                  <span><strong>AI Mentorship</strong>: Real-time guidance and instant concept feedback.</span>
                </li>
                <li className="about-bullet-item">
                  <div className="about-bullet-icon">✓</div>
                  <span><strong>ATS Compliance</strong>: Optimize layouts to bypass automatic screening filters.</span>
                </li>
                <li className="about-bullet-item">
                  <div className="about-bullet-icon">✓</div>
                  <span><strong>Interactive timeline</strong>: Complete checklist milestones to earn Gold XP levels.</span>
                </li>
              </ul>
            </div>

            <div className="about-pillars-grid">
              <div className="about-pillar-card">
                <h3 className="about-pillar-title">🚀 Innovation First</h3>
                <p className="about-pillar-desc">We continuously update our roadmap catalogs with modern frameworks and algorithms.</p>
              </div>
              <div className="about-pillar-card">
                <h3 className="about-pillar-title">🎓 Student-Centric</h3>
                <p className="about-pillar-desc">Every suggestion is personalized, adapting to your specific learning pace and background.</p>
              </div>
              <div className="about-pillar-card">
                <h3 className="about-pillar-title">🌍 True Accessibility</h3>
                <p className="about-pillar-desc">High-quality career coaching available 24/7 without expensive counseling fees.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="main-footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <span className="logo-container" style={{ fontSize: '1.25rem' }}>
                <div className="logo-icon" style={{ width: '28px', height: '28px', borderRadius: '6px' }}>V</div>
                VidyaGuide AI
              </span>
              <p className="footer-brand-desc">Empowering the next generation of engineers with automated AI career guidance.</p>
            </div>
            
            <div className="footer-col">
              <span className="footer-col-title">Platform</span>
              <ul className="footer-links">
                <li><a href="#" className="footer-link">Resume Analyzer</a></li>
                <li><a href="#" className="footer-link">AI Roadmap Creator</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <span className="footer-col-title">Resources</span>
              <ul className="footer-links">
                <li><a href="#" className="footer-link">Student Blog</a></li>
                <li><a href="#" className="footer-link">Developer Docs</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <span className="footer-col-title">Company</span>
              <ul className="footer-links">
                <li><a href="#" className="footer-link">About Us</a></li>
                <li><a href="#" className="footer-link">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 VidyaGuide AI. All rights reserved. Created for student acceleration.</span>
            <div className="footer-legal-links">
              <a href="#" className="footer-link" style={{ marginRight: '1rem' }}>Privacy Policy</a>
              <a href="#" className="footer-link">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
