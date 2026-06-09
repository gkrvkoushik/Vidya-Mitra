import { useState, useEffect, useRef } from 'react';
import { uploadResumeToCloudinary } from '../resumeUpload.js';
import { downloadResume } from '../resumeDownload.js';
import ResumeAnalysis from './ResumeAnalysis.jsx';
import { getDashboardData, sendChatMessage } from '../api.js';
import CareerPaths from './CareerPaths.jsx';
import Roadmap from './Roadmap.jsx';
import Quiz from './Quiz.jsx';
import Progress from './Progress.jsx';
import Achievements from './Achievements.jsx';
import MockInterview from './MockInterview.jsx';

// Custom SVG Icons for Dashboard
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="dash-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '2px' }}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '4px' }}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function DynamicBadge({ level }) {
  const colors = {
    Bronze: { primary: '#CD7F32', secondary: '#8B4513' },
    Silver: { primary: '#C0C0C0', secondary: '#808080' },
    Gold: { primary: '#FFD700', secondary: '#DAA520' },
    Platinum: { primary: '#E5E4E2', secondary: '#71706E' }
  };
  
  const color = colors[level] || colors.Gold;
  
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }}>
      <path
        d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z"
        fill={color.primary}
        stroke={color.secondary}
        strokeWidth="1.5"
      />
      <polygon points="12 7.5 13.5 10.5 17 11 14.5 13.5 15 17 12 15 9 17 9.5 13.5 7 11 10.5 10.5" fill="#FFFFFF" />
    </svg>
  );
}

// 3D Isometric Stepped Block with Flag Graphic
function IsometricBlockSVG() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
      {/* 3D Box Face Left */}
      <path d="M50 80L20 65V35L50 50V80Z" fill="url(#isoFaceLeft)" />
      {/* 3D Box Face Right */}
      <path d="M50 80L80 65V35L50 50V80Z" fill="url(#isoFaceRight)" />
      {/* 3D Box Face Top */}
      <path d="M50 50L20 35L50 20L80 35L50 50Z" fill="url(#isoFaceTop)" />

      {/* Small floating step cube on top */}
      <path d="M50 35L35 27V17L50 25V35Z" fill="url(#isoFaceLeftMini)" />
      <path d="M50 35L65 27V17L50 25V35Z" fill="url(#isoFaceRightMini)" />
      <path d="M50 25L35 17L50 10L65 17L50 25Z" fill="url(#isoFaceTopMini)" />

      {/* Flag Pole */}
      <line x1="50" y1="10" x2="50" y2="-15" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
      {/* Flag Fabric */}
      <path d="M50 -15L68 -10L50 -5V-15Z" fill="#7E46F0" />
      <path d="M50 -15L68 -10L50 -5V-15Z" fill="url(#flagGlow)" />

      <defs>
        <linearGradient id="isoFaceLeft" x1="20" y1="35" x2="50" y2="80">
          <stop offset="0%" stopColor="#7E46F0" />
          <stop offset="100%" stopColor="#4F27A3" />
        </linearGradient>
        <linearGradient id="isoFaceRight" x1="80" y1="35" x2="50" y2="80">
          <stop offset="0%" stopColor="#B0A3F7" />
          <stop offset="100%" stopColor="#7E46F0" />
        </linearGradient>
        <linearGradient id="isoFaceTop" x1="20" y1="35" x2="80" y2="35">
          <stop offset="0%" stopColor="#ECE9FD" />
          <stop offset="100%" stopColor="#B0A3F7" />
        </linearGradient>
        {/* Mini Cube gradients */}
        <linearGradient id="isoFaceLeftMini" x1="35" y1="17" x2="50" y2="35">
          <stop offset="0%" stopColor="#9672FF" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="isoFaceRightMini" x1="65" y1="17" x2="50" y2="35">
          <stop offset="0%" stopColor="#C3B5FD" />
          <stop offset="100%" stopColor="#9672FF" />
        </linearGradient>
        <linearGradient id="isoFaceTopMini" x1="35" y1="17" x2="65" y2="17">
          <stop offset="0%" stopColor="#F5F3FF" />
          <stop offset="100%" stopColor="#C3B5FD" />
        </linearGradient>
        <linearGradient id="flagGlow" x1="50" y1="-15" x2="68" y2="-5">
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#7E46F0" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Digital Agent/Robot Icon for Row 3 Console
function AgentAvatarSVG() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="15" x2="8.01" y2="15" />
      <line x1="16" y1="15" x2="16.01" y2="15" />
      <path d="M9 18h6" />
    </svg>
  );
}

export default function Dashboard({ user, firebaseUser, theme, setTheme, onLogout, onEditProfile, onMyProfile, onUserUpdate }) {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [notifications, setNotifications] = useState([]);

  const getFileName = (url) => {
    if (!url) return 'Koushik_Resume.pdf';
    try {
      const decoded = decodeURIComponent(url);
      const parts = decoded.split('/');
      const filenameWithParams = parts[parts.length - 1];
      return filenameWithParams.split('?')[0];
    } catch {
      return 'Koushik_Resume.pdf';
    }
  };

  // Resume Analysis States
  const [analysisData, setAnalysisData] = useState({
    fileName: user.resume_url ? getFileName(user.resume_url) : 'Koushik_Resume.pdf',
    fileSize: '245 KB',
    totalPages: 2,
    totalWords: 612,
    atsScore: 82,
    lastUpdated: '08 Jun 2025',
    analyzedOn: '08 Jun 2025, 10:30 AM',
    matchedSkillsCount: 14,
    missingSkillsCount: 8,
    keywordMatchPct: 78,
    keywordFound: 28,
    keywordTotal: 36,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      let secureUrl = '';
      if (firebaseUser) {
        secureUrl = await uploadResumeToCloudinary(firebaseUser.uid, file);
        if (onUserUpdate) {
          onUserUpdate({ ...user, resume_url: secureUrl });
        }
      }

      const randomScore = Math.floor(Math.random() * 11) + 80; // 80 to 90
      const randomWords = Math.floor(Math.random() * 200) + 550; // 550 to 750
      const randomPages = Math.floor(Math.random() * 2) + 1; // 1 to 2
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const formattedDateTime = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      setAnalysisData({
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(0) + ' KB',
        totalPages: randomPages,
        totalWords: randomWords,
        atsScore: randomScore,
        lastUpdated: formattedDate,
        analyzedOn: formattedDateTime,
        matchedSkillsCount: Math.floor(Math.random() * 4) + 12,
        missingSkillsCount: Math.floor(Math.random() * 3) + 7,
        keywordMatchPct: Math.floor(Math.random() * 15) + 75,
        keywordFound: Math.floor(Math.random() * 8) + 24,
        keywordTotal: 36,
      });

      alert('Resume uploaded and analyzed successfully!');
    } catch (err) {
      console.error(err);
      setUploadError(err.message || 'Failed to upload resume. Using mock simulation.');
      
      const randomScore = Math.floor(Math.random() * 11) + 80;
      const randomWords = Math.floor(Math.random() * 200) + 550;
      const randomPages = Math.floor(Math.random() * 2) + 1;
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const formattedDateTime = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      setAnalysisData({
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(0) + ' KB',
        totalPages: randomPages,
        totalWords: randomWords,
        atsScore: randomScore,
        lastUpdated: formattedDate,
        analyzedOn: formattedDateTime,
        matchedSkillsCount: Math.floor(Math.random() * 4) + 12,
        missingSkillsCount: Math.floor(Math.random() * 3) + 7,
        keywordMatchPct: Math.floor(Math.random() * 15) + 75,
        keywordFound: Math.floor(Math.random() * 8) + 24,
        keywordTotal: 36,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (user.resume_url && firebaseUser) {
        await downloadResume(firebaseUser.uid, analysisData.fileName);
      } else {
        alert('No uploaded resume found. Initiating report summary download.');
        const element = document.createElement('a');
        const fileContent = `VidyaGuide AI Career Mentor - Resume Analysis Report\n\n` +
          `User: ${user.name}\n` +
          `Email: ${user.email}\n` +
          `File: ${analysisData.fileName}\n` +
          `Size: ${analysisData.fileSize}\n` +
          `ATS Score: ${analysisData.atsScore}/100\n` +
          `Keyword Match: ${analysisData.keywordMatchPct}%\n` +
          `Analyzed On: ${analysisData.analyzedOn}\n`;
        const fileBlob = new Blob([fileContent], { type: 'text/plain' });
        element.href = URL.createObjectURL(fileBlob);
        element.download = `${analysisData.fileName.replace(/\.[^/.]+$/, "")}_Report.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to download resume.');
    }
  };

  // Live dashboard data from Firestore
  const [dashData, setDashData] = useState({
    ats_score: 0,
    match_percentage: 0,
    profile_completion: 0,
    total_points: 0,
    badge_level: 'Bronze',
    roadmap_progress: 0,
    active_roadmap: null,
    recent_activities: [],
    skills_overview: [],
    has_analysis: false,
    has_roadmaps: false
  });
  const [dashDataLoading, setDashDataLoading] = useState(true);

  const refreshDashboardData = async () => {
    if (firebaseUser?.uid) {
      setDashDataLoading(true);
      try {
        const data = await getDashboardData(firebaseUser.uid);
        setDashData(data);
      } catch (error) {
        console.error('Failed to refresh dashboard data:', error);
      } finally {
        setDashDataLoading(false);
      }
    }
  };

  useEffect(() => {
    const uid = firebaseUser?.uid;
    if (!uid) { setDashDataLoading(false); return; }
    getDashboardData(uid).then((data) => {
      setDashData(data);
      setDashDataLoading(false);
    }).catch(() => {
      setDashDataLoading(false);
    });
  }, [firebaseUser]);

  // Sync notifications from dashboard activities
  useEffect(() => {
    if (!dashData.recent_activities?.length) return;
    setNotifications(prev => {
      const readSet = new Set(prev.filter(n => n.read).map(n => n.text));
      return dashData.recent_activities.map(a => ({
        icon: a.icon,
        text: a.text,
        time: a.time,
        read: readSet.has(a.text),
      }));
    });
  }, [dashData.recent_activities]);

  const markRead = (i) => setNotifications(prev => prev.map((n, idx) => idx === i ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Live roadmap state from dashboard data
  const [dashRoadmap, setDashRoadmap] = useState({ weeks: [], completed: [], progress: 0, role: '' });
  
  useEffect(() => {
    if (dashData.active_roadmap) {
      setDashRoadmap({
        weeks: dashData.active_roadmap.roadmap || [],
        completed: [],
        progress: dashData.active_roadmap.progress || 0,
        role: dashData.active_roadmap.role || ''
      });
    }
  }, [dashData]);

  // Floating chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLogs, setChatLogs] = useState([
    { role: 'assistant', content: `Hi ${user.name}! I'm Vidya, your AI career mentor. I know your skills and progress — ask me anything!` }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLogs, chatOpen]);

  const getSkillsContext = () => ({
    skills: (dashData.skills_overview || []).map(s => s.name),
    ats_score: dashData.ats_score,
    badge_level: dashData.badge_level,
    total_points: dashData.total_points,
    active_role: dashRoadmap.role,
    roadmap_progress: dashRoadmap.progress,
    missing_skills: dashData.active_roadmap ? [] : [],
  });

  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatLogs(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);
    try {
      const history = chatLogs.map(m => ({ role: m.role, content: m.content }));
      const data = await sendChatMessage(firebaseUser?.uid || '', userMsg, history, getSkillsContext());
      setChatLogs(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setChatLogs(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Dynamic skills data from dashboard API
  const skillsData = dashData.skills_overview || [];

  // Filtering skills list via search input
  const filteredSkills = skillsData.filter((skill) =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-layout-container">
      
      {/* SIDEBAR (Fixed Left) */}
      <aside className="dash-sidebar-fixed">
        <div>
          {/* Logo Brand */}
          <div className="dash-logo-section">
            <div className="dash-logo-icon" style={{ background: 'none', boxShadow: 'none', width: 'auto', height: 'auto', display: 'flex', alignItems: 'center', padding: 0 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M3 4l9 16 9-16" stroke="var(--color-dash-purple)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 4l5 9 5-9" stroke="var(--color-dash-link-purple)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
              </svg>
            </div>
            <div>
              VidyaGuide <span style={{ color: 'var(--color-dash-purple)' }}>AI</span>
              <span className="dash-tagline" style={{ fontSize: '0.65rem', color: 'var(--color-dash-text-muted)' }}>Your AI Career Mentor</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <ul className="dash-navigation-menu">
            {[
              { name: 'Dashboard', icon: 'Dashboard' },
              { name: 'Resume Analysis', icon: 'ResumeAnalysis' },
              { name: 'Career Paths', icon: 'CareerPaths' },
              { name: 'Roadmaps', icon: 'Roadmaps' },
              { name: 'Quizzes', icon: 'Quizzes' },
              { name: 'Progress', icon: 'Progress' },
              { name: 'Achievements', icon: 'Achievements' },
              { name: 'Mock Interview', icon: 'MockInterview' },
              { name: 'Settings', icon: 'Settings' }
            ].map((menuItem) => (
              <li key={menuItem.name}>
                <button
                  className={`dash-nav-btn ${activeMenu === menuItem.name ? 'active' : ''}`}
                  onClick={() => {
                    setActiveMenu(menuItem.name);
                    if (menuItem.name === 'Dashboard') refreshDashboardData();
                  }}
                >
                  <SidebarIcon name={menuItem.icon} />
                  {menuItem.name}
                  {menuItem.soon && <span className="dash-nav-soon-tag">Soon</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          {/* Upgrade to Pro CTA Panel */}
          <div className="dash-sidebar-upgrade-panel">
            <h4 className="upgrade-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-dash-gold)" strokeWidth="2.5" style={{ fill: 'var(--color-dash-gold)' }}>
                <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
                <path d="M3 20h18v2H3z" />
              </svg>
              Upgrade to Pro
            </h4>
            <p className="upgrade-desc">Unlock advanced insights, AI mock interviews and more.</p>
            <button className="upgrade-btn" onClick={() => alert('Mock Pro Checkout Activated!')}>
              Upgrade Now
            </button>
          </div>

          {/* User Info bottom panel */}
          <div className="dash-sidebar-user-panel">
            <img src={user.avatar} alt={user.name} className="dash-user-img" />
            <div className="dash-user-meta">
              <span className="dash-user-name">{user.name}</span>
              <span className="dash-user-email">{user.email}</span>
            </div>
            <div className="dash-user-dropdown-icon" onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {userDropdownOpen && (
              <ul className="user-dropdown-menu">
                <li className="user-dropdown-item" onClick={() => { setUserDropdownOpen(false); onMyProfile(); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  My Profile
                </li>
                <li className="user-dropdown-item" onClick={() => { setUserDropdownOpen(false); onEditProfile(); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit Profile
                </li>
                <li className="user-dropdown-item user-dropdown-item--danger" onClick={() => { setUserDropdownOpen(false); onLogout(); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Log Out
                </li>
              </ul>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="dash-content-container">
        
        {/* Top Bar (Header) */}
        <header className="dash-topbar-header">
          {activeMenu === 'Resume Analysis' ? (
            <>
              {/* Page Title */}
              <div className="dash-topbar-welcome">
                <h2 className="dash-welcome-title">Resume Analysis</h2>
                <span className="dash-welcome-desc">AI-powered insights to improve your resume and match better opportunities</span>
              </div>
              
              {/* Spacer */}
              <div></div>
            </>
          ) : (
            <>
              {/* Welcome Text */}
              <div className="dash-topbar-welcome">
                <h2 className="dash-welcome-title">Welcome back, {user.name}! 👋</h2>
                <span className="dash-welcome-desc">Track your progress and continue your journey...</span>
              </div>

              {/* Search Input */}
              <div className="dash-search-container">
                <SearchIcon />
                <input 
                  type="text" 
                  className="dash-search-input" 
                  placeholder="Search skills, metrics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Top level controls */}
          <div className="dash-topbar-controls">
            {activeMenu === 'Resume Analysis' && (
              <>
                {/* Re-upload Resume Button */}
                <button 
                  className="btn btn-secondary" 
                  style={{ 
                    borderRadius: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.45rem', 
                    padding: '0.5rem 1rem', 
                    fontSize: '0.82rem',
                    fontWeight: '700'
                  }}
                  onClick={() => document.getElementById('resume-uploader-header')?.click()}
                  disabled={isUploading}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {isUploading ? 'Analyzing...' : 'Re-upload Resume'}
                </button>
                <input
                  type="file"
                  id="resume-uploader-header"
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                />

                {/* Download Button */}
                <button 
                  className="dash-control-btn" 
                  style={{ borderRadius: '8px' }} 
                  onClick={handleDownload} 
                  title="Download Resume"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </>
            )}

            {/* Theme Toggle Button */}
            <button 
              className="dash-control-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle Dashboard Theme"
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="8" r="3" />
                  <line x1="8" y1="1" x2="8" y2="2" /><line x1="8" y1="14" x2="8" y2="15" />
                  <line x1="3" y1="3" x2="4" y2="4" /><line x1="12" y1="12" x2="13" y2="13" />
                  <line x1="1" y1="8" x2="2" y2="8" /><line x1="14" y1="8" x2="15" y2="8" />
                  <line x1="3" y1="13" x2="4" y2="12" /><line x1="12" y1="4" x2="13" y2="3" />
                </svg>
              ) : (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 9.79A9 9 0 1 1 7.21 2 7 7 0 0 0 15 9.79z" />
                </svg>
              )}
            </button>

            {/* Notifications Bell */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                className="dash-control-btn"
                onClick={() => setNotifOpen(o => !o)}
                style={{ position: 'relative' }}
              >
                <BellIcon />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="notification-badge-red">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 200,
                  width: 300, background: 'var(--color-dash-card)',
                  border: '1px solid var(--color-dash-border)', borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.18)', overflow: 'hidden',
                }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-dash-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Notifications</span>
                    {notifications.some(n => !n.read) && (
                      <button onClick={markAllRead} style={{ fontSize: '0.7rem', color: 'var(--color-dash-purple)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-dash-text-muted)', fontSize: '0.82rem' }}>No notifications</div>
                    ) : notifications.map((n, i) => (
                      <div key={i} onClick={() => markRead(i)} style={{
                        padding: '0.7rem 1rem', display: 'flex', gap: '0.65rem', alignItems: 'flex-start',
                        background: n.read ? 'transparent' : 'rgba(138,85,255,0.06)',
                        borderBottom: '1px solid var(--color-dash-border)', cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}>
                        <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: 1 }}>{n.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-dash-text)', fontWeight: n.read ? 400 : 600, lineHeight: 1.35 }}>{n.text}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--color-dash-text-muted)', marginTop: 2 }}>{n.time}</div>
                        </div>
                        {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-dash-purple)', flexShrink: 0, marginTop: 5 }} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile image with dropdown */}
            <div className="topbar-avatar-wrapper">
              <img
                src={user.avatar}
                alt={user.name}
                className="topbar-avatar-img"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              />
              {userDropdownOpen && (
                <ul className="topbar-profile-dropdown">
                  <li className="user-dropdown-item" onClick={() => { setUserDropdownOpen(false); onMyProfile(); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    My Profile
                  </li>
                  <li className="user-dropdown-item" onClick={() => { setUserDropdownOpen(false); onEditProfile(); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit Profile
                  </li>
                  <li className="user-dropdown-item user-dropdown-item--danger" onClick={() => { setUserDropdownOpen(false); onLogout(); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Log Out
                  </li>
                </ul>
              )}
            </div>
          </div>
        </header>

        {/* CONDITIONAL PAGES RENDERING */}
        {activeMenu === 'Dashboard' && (
          <div className="dashboard-widgets-layout-grid">
            
            {/* Row 1: KPIs */}
            <div className="dash-row-kpis">
              
              {/* Card 1: ATS Score */}
              <div className="dash-kpi-card">
                <span className="dash-kpi-title">ATS Score</span>
                <div className="dash-kpi-content-row">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {dashDataLoading ? (
                      <span className="dash-kpi-value-huge" style={{ color: 'var(--color-dash-text-muted)' }}>—</span>
                    ) : (
                      <span className="dash-kpi-value-huge">{dashData.ats_score}/100</span>
                    )}
                    <span className="dash-kpi-indicator-trend">
                      <ArrowUpIcon />
                      {dashDataLoading ? 'Loading...' : dashData.has_analysis ? `${dashData.match_percentage}% match` : 'No analysis yet'}
                    </span>
                  </div>
                  {/* Circular ring chart */}
                  <div style={{ width: '48px', height: '48px', position: 'relative' }}>
                    <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '48px', height: '48px' }}>
                      <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-dash-border)" strokeWidth="4.5" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-dash-purple)" strokeWidth="4.5" strokeDasharray="94.2" strokeDashoffset={94.2 - (dashData.ats_score / 100) * 94.2} strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 2: Current Badge */}
              <div className="dash-kpi-card">
                <span className="dash-kpi-title">Current Badge</span>
                <div className="dash-kpi-content-row" style={{ marginTop: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <DynamicBadge level={dashData.badge_level} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="dash-kpi-value-huge" style={{ fontSize: '1.25rem' }}>
                        {dashDataLoading ? '—' : dashData.badge_level}
                      </span>
                      <span className="dash-kpi-indicator-muted" style={{ fontSize: '0.7rem' }}>
                        {dashDataLoading ? '' : `${dashData.total_points} pts`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="skills-progressbar-base" style={{ marginTop: '0.5rem', height: '5px' }}>
                  <div className="skills-progressbar-fill" style={{ width: `${Math.min((dashData.total_points / 2500) * 100, 100)}%`, backgroundColor: 'var(--color-dash-purple)' }}></div>
                </div>
              </div>

              {/* Card 3: Profile Completion */}
              <div className="dash-kpi-card">
                <span className="dash-kpi-title">Profile Completion</span>
                <div className="dash-kpi-content-row" style={{ alignItems: 'flex-start' }}>
                  <span className="dash-kpi-value-huge">
                    {dashDataLoading ? '—' : `${dashData.profile_completion}%`}
                  </span>
                </div>
                <div className="skills-progressbar-base" style={{ height: '5px', marginTop: '0.2rem' }}>
                  <div className="skills-progressbar-fill" style={{ width: `${dashData.profile_completion}%`, backgroundColor: 'var(--color-dash-blue)' }}></div>
                </div>
                <a href="#complete-profile" className="dash-link-action" style={{ fontSize: '0.72rem', marginTop: '0.5rem' }}>
                  Complete your profile <ArrowRightIcon />
                </a>
              </div>

              {/* Card 4: Total Points */}
              <div className="dash-kpi-card" style={{ overflow: 'hidden' }}>
                <span className="dash-kpi-title">Total Points</span>
                <div className="dash-kpi-content-row" style={{ zIndex: 2 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="dash-kpi-value-huge">
                      {dashDataLoading ? '—' : dashData.total_points}
                    </span>
                    <span className="dash-kpi-indicator-muted" style={{ fontSize: '0.68rem', marginTop: '2px' }}>
                      {dashDataLoading ? '' : dashData.total_points === 0 ? 'Take a quiz to earn points!' : 'Keep learning to level up!'}
                    </span>
                  </div>
                </div>
                <div className="points-chart-wrapper">
                  <svg width="100%" height="100%" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <path d="M0 45 C15 42, 30 35, 45 32 C60 28, 75 15, 100 8 L100 50 L0 50 Z" className="points-area-path" />
                  </svg>
                </div>
              </div>

            </div>

            {/* Row 2: Main Progress */}
            <div className="dash-row-progress">
              
                            {/* Roadmap Progress Card */}
              <div className="dash-section-card">
                <span className="dash-kpi-title">Roadmap Progress</span>
                <h3 className="dash-section-card-title">{dashRoadmap.role || 'AI Engineer'} Roadmap</h3>
                <span className="dash-section-card-subtitle">{dashRoadmap.progress}% Completed ({dashRoadmap.completed.length} of {dashRoadmap.weeks.length} milestones)</span>

                {dashDataLoading ? (
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
                        {dashDataLoading ? 'Loading...' : '🎉 All steps complete! Go to Roadmaps to generate more.'}
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>

            {/* Row 3: Activity & Skills */}
            <div className="dash-row-details">
              
              {/* Recent Activity Card */}
              <div className="dash-section-card">
                <span className="dash-kpi-title">Recent Activity</span>
                <div className="activity-list-container" style={{ marginTop: '1rem' }}>
                  {dashData.recent_activities.map((act, index) => (
                    <div className="activity-list-node" key={index}>
                      <div className="activity-node-icon-wrapper">
                        {act.icon}
                      </div>
                      <div className="activity-node-meta">
                        <span className="activity-node-text">{act.text}</span>
                        <span className="activity-node-time">{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <a href="#activities" className="dash-link-action" style={{ marginTop: '1.25rem', fontSize: '0.8rem' }}>
                  View all activity <ArrowRightIcon />
                </a>
              </div>

              {/* Skills Overview Card */}
              <div className="dash-section-card">
                <span className="dash-kpi-title">Skills Overview</span>
                
                <div className="skills-overview-container" style={{ marginTop: '1rem' }}>
                  {filteredSkills.length > 0 ? (
                    filteredSkills.map((skill, index) => (
                      <div className="skills-progress-item" key={index}>
                        <div className="skills-item-header">
                          <span>{skill.name}</span>
                          <span>{skill.percent}%</span>
                        </div>
                        <div className="skills-progressbar-base">
                          <div 
                            className="skills-progressbar-fill" 
                            style={{ width: `${skill.percent}%`, backgroundColor: skill.color }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-dash-text-muted)', padding: '2rem 0' }}>
                      No matching skills found.
                    </div>
                  )}
                </div>

                <a href="#skills" className="dash-link-action" style={{ marginTop: 'auto', paddingTop: '1.25rem', fontSize: '0.8rem' }}>
                  View all skills <ArrowRightIcon />
                </a>
              </div>

              {/* Quick Tips Card (replaces Agent Activity) */}
              <div className="dash-section-card">
                <span className="dash-kpi-title">Quick Tips</span>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { icon: '🎯', text: `ATS Score ${dashData.ats_score}/100 — ${dashData.ats_score >= 80 ? 'Great job! Keep it up.' : 'Upload your resume for analysis.'}` },
                    { icon: '📍', text: dashRoadmap.role ? `${dashRoadmap.progress}% done on ${dashRoadmap.role} roadmap.` : 'Start a career roadmap to track progress.' },
                    { icon: '🏅', text: `${dashData.badge_level} badge · ${dashData.total_points} pts earned so far.` },
                  ].map((tip, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.65rem 0.75rem', borderRadius: '10px', background: 'var(--color-dash-bg)', fontSize: '0.8rem', color: 'var(--color-dash-text)' }}>
                      <span style={{ fontSize: '1rem' }}>{tip.icon}</span>
                      <span>{tip.text}</span>
                    </div>
                  ))}
                  <button
                    onClick={() => setChatOpen(true)}
                    style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-dash-purple)', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.6rem 1rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', width: '100%', justifyContent: 'center' }}
                  >
                    <AgentAvatarSVG /> Chat with Vidya AI
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {activeMenu === 'Resume Analysis' && (
          <div className="resume-analysis-container">
            <ResumeAnalysis user={user} firebaseUser={firebaseUser} />
          </div>
        )}

        {false && activeMenu === 'Resume Analysis' && (
          <div className="resume-analysis-container">
            {uploadError && (
              <div className="resume-card" style={{ padding: '0.75rem 1.25rem', borderColor: 'var(--color-dash-red)', color: 'var(--color-dash-red)', fontWeight: '600', fontSize: '0.82rem', marginBottom: '0.5rem', backgroundColor: 'var(--color-tag-danger-bg)' }}>
                ⚠️ {uploadError}
              </div>
            )}
            
            {/* Grid layout of 6 Widgets */}
            <div className="resume-analysis-grid">
              
              {/* Left Column (spans 2/3 width) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Widget 1: ATS Score */}
                <div className="resume-card">
                  <div className="resume-card-title-row">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      ATS Score
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ cursor: 'help' }} title="ATS score estimates match rate for jobs">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </span>
                  </div>
                  <div className="ats-score-layout">
                    
                    <div className="ats-score-left">
                      <div className="ats-score-numerical">
                        {analysisData.atsScore}<span> /100</span>
                      </div>
                      <div className="ats-score-status-dot-wrapper">
                        <span className="ats-status-dot"></span>
                        Good Score
                      </div>
                    </div>

                    <div className="ats-score-center">
                      <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-dash-border)" strokeWidth="8" className="ats-donut-circle-bg" />
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="40" 
                          fill="none" 
                          stroke="var(--color-dash-purple)" 
                          strokeWidth="8" 
                          strokeDasharray="251.3" 
                          strokeDashoffset={251.3 - (analysisData.atsScore / 100) * 251.3} 
                          transform="rotate(-90 50 50)" 
                          className="ats-donut-circle-val" 
                        />
                      </svg>
                      <div className="ats-donut-text">
                        {analysisData.atsScore}
                        <span>/100</span>
                      </div>
                    </div>

                    <div className="ats-score-right">
                      <div className="ats-score-feedback-text">
                        Great! Your resume is well-structured. But a few improvements can increase your chances of getting shortlisted.
                      </div>
                      <div className="ats-trending-box">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                          <polyline points="17 6 23 6 23 12" />
                        </svg>
                        Top 15% of resumes get 80+ ATS Score
                      </div>
                    </div>

                  </div>
                </div>

                {/* Widget 3: Skills Analysis */}
                <div className="resume-card">
                  <div className="resume-card-title-row">
                    <span>Skills Analysis</span>
                  </div>
                  <div className="skills-analysis-layout">
                    
                    {/* Matched Skills */}
                    <div className="skills-analysis-column">
                      <div className="skills-column-header">
                        <span className="skills-column-title">Matched Skills</span>
                        <span className="skills-badge-count success">{analysisData.matchedSkillsCount}</span>
                      </div>
                      <div className="skills-tag-cloud">
                        {['Python', 'SQL', 'Java', 'C++', 'Data Structures', 'Machine Learning', 'Deep Learning', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'Git', 'Excel', 'Problem Solving'].map((skill) => (
                          <span key={skill} className="skill-pill-tag matched">{skill}</span>
                        ))}
                      </div>
                    </div>

                    {/* Missing / Weak Skills */}
                    <div className="skills-analysis-column">
                      <div className="skills-column-header">
                        <span className="skills-column-title">Missing / Weak Skills</span>
                        <span className="skills-badge-count danger">{analysisData.missingSkillsCount}</span>
                      </div>
                      <div className="skills-tag-cloud">
                        {['System Design', 'Docker', 'Kubernetes', 'AWS', 'REST APIs', 'FastAPI', 'CI/CD', 'Deployment'].map((skill) => (
                          <span key={skill} className="skill-pill-tag missing">{skill}</span>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Widget 4: Section-wise Analysis */}
                <div className="resume-card">
                  <div className="resume-card-title-row">
                    <span>Section-wise Analysis</span>
                  </div>
                  <div className="section-analysis-list">
                    {[
                      { name: 'Contact Information', status: 'success', text: 'Well formatted', score: 100 },
                      { name: 'Summary', status: 'warning', text: 'Good, but can be improved', score: 70 },
                      { name: 'Skills', status: 'success', text: 'Well presented', score: 90 },
                      { name: 'Work Experience', status: 'success', text: 'Well detailed', score: 85 },
                      { name: 'Projects', status: 'warning', text: 'Good, add more details', score: 65 },
                      { name: 'Education', status: 'success', text: 'Well formatted', score: 90 },
                    ].map((row) => (
                      <div key={row.name} className="section-analysis-row">
                        <span className="section-row-name">{row.name}</span>
                        
                        <div className={`section-row-status-wrapper ${row.status}`}>
                          <span className="section-row-status-icon">
                            {row.status === 'success' ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                            )}
                          </span>
                          {row.text}
                        </div>

                        <div className="section-row-progress-track">
                          <div className={`section-row-progress-fill ${row.status}`} style={{ width: `${row.score}%` }}></div>
                        </div>

                        <span className="section-row-score">{row.score}%</span>
                      </div>
                    ))}
                  </div>
                  <button className="full-width-outlined-btn" onClick={() => alert('Detailed Section Feedback loaded!')}>
                    View Detailed Feedback
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>

              </div>

              {/* Right Column (spans 1/3 width) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Widget 2: Resume Overview */}
                <div className="resume-card">
                  <div className="resume-card-title-row">
                    <span>Resume Overview</span>
                  </div>
                  <div className="overview-grid-layout">
                    
                    <div className="overview-info-block">
                      <div className="overview-icon-container">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="overview-info-meta">
                        <span className="overview-info-label">Resume Name</span>
                        <span className="overview-info-value" title={analysisData.fileName}>{analysisData.fileName}</span>
                      </div>
                    </div>

                    <div className="overview-info-block">
                      <div className="overview-icon-container">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      </div>
                      <div className="overview-info-meta">
                        <span className="overview-info-label">Total Pages</span>
                        <span className="overview-info-value">{analysisData.totalPages}</span>
                      </div>
                    </div>

                    <div className="overview-info-block">
                      <div className="overview-icon-container">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="17" y1="10" x2="3" y2="10" />
                          <line x1="21" y1="6" x2="3" y2="6" />
                          <line x1="21" y1="14" x2="3" y2="14" />
                          <line x1="17" y1="18" x2="3" y2="18" />
                        </svg>
                      </div>
                      <div className="overview-info-meta">
                        <span className="overview-info-label">Total Words</span>
                        <span className="overview-info-value">{analysisData.totalWords}</span>
                      </div>
                    </div>

                    <div className="overview-info-block">
                      <div className="overview-icon-container">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div className="overview-info-meta">
                        <span className="overview-info-label">Last Updated</span>
                        <span className="overview-info-value">{analysisData.lastUpdated}</span>
                      </div>
                    </div>

                    <div className="overview-info-block">
                      <div className="overview-icon-container">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                      </div>
                      <div className="overview-info-meta">
                        <span className="overview-info-label">File Size</span>
                        <span className="overview-info-value">{analysisData.fileSize}</span>
                      </div>
                    </div>

                    <div className="overview-info-block">
                      <div className="overview-icon-container">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div className="overview-info-meta">
                        <span className="overview-info-label">Analyzed On</span>
                        <span className="overview-info-value" style={{ fontSize: '0.74rem' }}>{analysisData.analyzedOn}</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Widget 5: Recommendations */}
                <div className="resume-card">
                  <div className="resume-card-title-row">
                    <span>Recommendations</span>
                  </div>
                  <div className="recommendations-stack">
                    {[
                      { 
                        title: 'Add a strong professional summary', 
                        desc: 'A concise summary at the top can increase your chances of getting noticed.',
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        )
                      },
                      { 
                        title: 'Include more quantifiable achievements', 
                        desc: 'Add numbers and metrics to showcase impact in your experience.',
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                          </svg>
                        )
                      },
                      { 
                        title: 'Highlight missing skills', 
                        desc: 'Including relevant skills like System Design, Docker, AWS can improve your ATS score.',
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 18 22 12 16 6" />
                            <polyline points="8 6 2 12 8 18" />
                          </svg>
                        )
                      },
                      { 
                        title: 'Add more projects', 
                        desc: 'Showcase 1-2 more projects that demonstrate your technical skills.',
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                        )
                      },
                    ].map((card, idx) => (
                      <div key={idx} className="recommendation-card-item" onClick={() => alert(`Action Recommendation triggered: ${card.title}`)}>
                        <div className="recommendation-card-icon-box">
                          {card.icon}
                        </div>
                        <div className="recommendation-card-content">
                          <span className="recommendation-card-title">{card.title}</span>
                          <span className="recommendation-card-description">{card.desc}</span>
                        </div>
                        <div className="recommendation-card-arrow">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Widget 6: Keyword Match */}
                <div className="resume-card">
                  <div className="keyword-match-top-row">
                    <div className="resume-card-title-row" style={{ marginBottom: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        Keyword Match
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ cursor: 'help' }} title="Target keyword density evaluation">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </span>
                    </div>
                    <span className="keyword-match-status">Good match</span>
                  </div>

                  <div className="keyword-progress-track">
                    <div className="keyword-progress-fill" style={{ width: `${analysisData.keywordMatchPct}%` }}></div>
                  </div>

                  <p className="keyword-subtext">
                    Found {analysisData.keywordFound} out of {analysisData.keywordTotal} important keywords in the job description.
                  </p>

                  <button className="full-width-outlined-btn" onClick={() => alert('Keyword match details loaded!')}>
                    View Matched Keywords
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>

              </div>

            </div>

            {/* Bottom Banner CTA */}
            <div className="bottom-banner-cta">
              <div className="bottom-banner-left">
                <div className="bottom-banner-icon-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div className="bottom-banner-text-wrapper">
                  <span className="bottom-banner-bold-title">Want to make your resume even better?</span>
                  <span className="bottom-banner-subtitle">Get AI-powered suggestions to optimize your resume for maximum impact.</span>
                </div>
              </div>
              <button className="bottom-banner-btn" onClick={() => alert('Improving resume with AI...')}>
                Improve with AI ✨
              </button>
            </div>

          </div>
        )}

        {activeMenu === 'Career Paths' && (
          <div className="resume-analysis-container">
            <CareerPaths user={user} firebaseUser={firebaseUser}
              onRoleSelected={(role) => {
                // optionally update user context
              }} />
          </div>
        )}

        {activeMenu === 'Roadmaps' && (
          <div className="resume-analysis-container">
            <Roadmap user={user} firebaseUser={firebaseUser} />
          </div>
        )}

        {activeMenu === 'Quizzes' && (
          <div className="resume-analysis-container">
            <Quiz user={user} firebaseUser={firebaseUser} />
          </div>
        )}

        {activeMenu === 'Progress' && (
          <div className="resume-analysis-container">
            <Progress user={user} firebaseUser={firebaseUser} />
          </div>
        )}

        {activeMenu === 'Achievements' && (
          <div className="resume-analysis-container">
            <Achievements user={user} firebaseUser={firebaseUser} />
          </div>
        )}

        {activeMenu === 'Mock Interview' && (
          <div className="resume-analysis-container">
            <MockInterview user={user} firebaseUser={firebaseUser} />
          </div>
        )}

        {activeMenu === 'Settings' && (
          <div className="resume-analysis-container">
            <Settings user={user} firebaseUser={firebaseUser} theme={theme} setTheme={setTheme} onEditProfile={onEditProfile} onLogout={onLogout} onUserUpdate={onUserUpdate} />
          </div>
        )}

        {activeMenu !== 'Dashboard' && activeMenu !== 'Resume Analysis' &&
         activeMenu !== 'Career Paths' && activeMenu !== 'Roadmaps' &&
         activeMenu !== 'Quizzes' && activeMenu !== 'Progress' && activeMenu !== 'Achievements' &&
         activeMenu !== 'Mock Interview' && activeMenu !== 'Settings' && (
          <div className="resume-card" style={{ padding: '4rem 2rem', textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
            <div className="overview-icon-container" style={{ width: '60px', height: '60px', borderRadius: '15px', marginBottom: '1.5rem', fontSize: '1.8rem' }}>🛠️</div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>{activeMenu}</h3>
            <p style={{ color: 'var(--color-dash-text-muted)', fontSize: '0.88rem', maxWidth: '380px', lineHeight: 1.5 }}>
              Coming soon! Our team is building this module.
            </p>
          </div>
        )}

      </main>

      {/* Floating Chat Button */}
      <button
        onClick={() => setChatOpen(o => !o)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000,
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'var(--color-dash-purple)', color: '#fff',
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(126,70,240,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s',
        }}
        title="Chat with Vidya AI"
      >
        {chatOpen ? (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat Popup */}
      {chatOpen && (
        <div style={{
          position: 'fixed', bottom: '5.5rem', right: '2rem', zIndex: 1000,
          width: '340px', maxHeight: '480px',
          background: 'var(--color-dash-card)', borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column',
          border: '1px solid var(--color-dash-border)', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '0.85rem 1rem', background: 'var(--color-dash-purple)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '5px', display: 'flex' }}>
              <AgentAvatarSVG />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>Vidya AI Mentor</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem' }}>● Personalised to your profile</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px' }}>
            {chatLogs.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? 'var(--color-dash-purple)' : 'var(--color-dash-bg)',
                color: msg.role === 'user' ? '#fff' : 'var(--color-dash-text)',
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                padding: '0.5rem 0.75rem', fontSize: '0.8rem', maxWidth: '85%', lineHeight: 1.4,
              }}>
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div style={{ alignSelf: 'flex-start', color: 'var(--color-dash-text-muted)', fontSize: '0.78rem', padding: '0.4rem 0.6rem' }}>
                Vidya is typing...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleChatSend} style={{ padding: '0.6rem', borderTop: '1px solid var(--color-dash-border)', display: 'flex', gap: '0.4rem' }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask Vidya anything..."
              disabled={chatLoading}
              style={{
                flex: 1, background: 'var(--color-dash-bg)', border: '1px solid var(--color-dash-border)',
                borderRadius: '8px', padding: '0.45rem 0.75rem', fontSize: '0.8rem',
                color: 'var(--color-dash-text)', outline: 'none',
              }}
            />
            <button type="submit" disabled={chatLoading}
              style={{ background: 'var(--color-dash-purple)', border: 'none', borderRadius: '8px', padding: '0 0.75rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

    </div>
  );
}

// Settings Component
function Settings({ user, firebaseUser, theme, setTheme, onEditProfile, onLogout, onUserUpdate }) {
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({ quizReminders: true, roadmapUpdates: true, achievements: true, weeklyDigest: false });
  const [privacy, setPrivacy] = useState({ showProfile: true, showProgress: false });
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleSaveNotifications = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Section = ({ title, children }) => (
    <div style={{ background: 'var(--color-dash-card)', border: '1px solid var(--color-dash-border)', borderRadius: 14, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-dash-text)', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-dash-border)' }}>{title}</div>
      {children}
    </div>
  );

  const Toggle = ({ label, desc, checked, onChange }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-dash-text)' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.72rem', color: 'var(--color-dash-text-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0,
          background: checked ? 'var(--color-dash-purple)' : 'var(--color-dash-border)',
          position: 'relative', transition: 'background 0.2s',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 720 }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Settings</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-dash-text-muted)' }}>Manage your account preferences and app settings</p>
      </div>

      {/* Profile Settings */}
      <Section title="👤 Profile">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={user.avatar} alt={user.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-dash-border)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-dash-text-muted)' }}>{user.email}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-dash-text-muted)', marginTop: 2 }}>{user.college}{user.graduation_year ? ` · Class of ${user.graduation_year}` : ''}</div>
          </div>
          <button className="edit-save-btn" onClick={onEditProfile} style={{ padding: '0.45rem 1.1rem', fontSize: '0.8rem' }}>Edit Profile</button>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="🎨 Appearance">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Theme</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-dash-text-muted)', marginTop: 2 }}>Choose your preferred colour scheme</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['dark', 'light'].map(t => (
              <button key={t} onClick={() => setTheme(t)} style={{
                padding: '0.4rem 1rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
                border: `2px solid ${theme === t ? 'var(--color-dash-purple)' : 'var(--color-dash-border)'}`,
                background: theme === t ? 'var(--color-dash-purple)' : 'transparent',
                color: theme === t ? '#fff' : 'var(--color-dash-text-muted)',
                cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'inherit',
              }}>
                {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="🔔 Notifications">
        <Toggle label="Quiz Reminders" desc="Get reminded to complete your daily quiz" checked={notifications.quizReminders} onChange={v => setNotifications(p => ({ ...p, quizReminders: v }))} />
        <Toggle label="Roadmap Updates" desc="Notifications when a new week becomes available" checked={notifications.roadmapUpdates} onChange={v => setNotifications(p => ({ ...p, roadmapUpdates: v }))} />
        <Toggle label="Achievement Unlocks" desc="Be notified when you earn a new badge" checked={notifications.achievements} onChange={v => setNotifications(p => ({ ...p, achievements: v }))} />
        <Toggle label="Weekly Digest" desc="A weekly summary of your progress" checked={notifications.weeklyDigest} onChange={v => setNotifications(p => ({ ...p, weeklyDigest: v }))} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="edit-save-btn" onClick={handleSaveNotifications} style={{ padding: '0.45rem 1.25rem', fontSize: '0.8rem' }}>
            {saved ? '✓ Saved' : 'Save Preferences'}
          </button>
        </div>
      </Section>

      {/* Privacy */}
      <Section title="🔒 Privacy">
        <Toggle label="Public Profile" desc="Allow others to view your profile and progress" checked={privacy.showProfile} onChange={v => setPrivacy(p => ({ ...p, showProfile: v }))} />
        <Toggle label="Show Progress on Leaderboard" desc="Display your quiz score on public leaderboards" checked={privacy.showProgress} onChange={v => setPrivacy(p => ({ ...p, showProgress: v }))} />
      </Section>

      {/* Account */}
      <Section title="⚙️ Account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sign Out</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-dash-text-muted)', marginTop: 2 }}>Sign out of your account on this device</div>
            </div>
            <button onClick={onLogout} style={{
              padding: '0.45rem 1.1rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
              border: '2px solid var(--color-dash-border)', background: 'transparent',
              color: 'var(--color-dash-text-muted)', cursor: 'pointer', fontFamily: 'inherit',
            }}>Sign Out</button>
          </div>
          <div style={{ borderTop: '1px solid var(--color-dash-border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-dash-red)' }}>Delete Account</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-dash-text-muted)', marginTop: 2 }}>Permanently delete your account and all data</div>
            </div>
            {!deleteConfirm ? (
              <button onClick={() => setDeleteConfirm(true)} style={{
                padding: '0.45rem 1.1rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
                border: '2px solid var(--color-dash-red)', background: 'transparent',
                color: 'var(--color-dash-red)', cursor: 'pointer', fontFamily: 'inherit',
              }}>Delete</button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setDeleteConfirm(false)} style={{ padding: '0.4rem 0.9rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, border: '1px solid var(--color-dash-border)', background: 'transparent', color: 'var(--color-dash-text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={() => { setDeleteConfirm(false); alert('Account deletion requires contacting support.'); }} style={{ padding: '0.4rem 0.9rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, border: 'none', background: 'var(--color-dash-red)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Confirm Delete</button>
              </div>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}

// Sidebar Icon mapping inside Dashboard
function SidebarIcon({ name }) {
  const icons = {
    Dashboard: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
    ResumeAnalysis: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    CareerPaths: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    Roadmaps: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 15 9 18 3 15" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
    Quizzes: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    Progress: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    Achievements: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    MockInterview: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <circle cx="12" cy="11" r="3" />
      </svg>
    ),
    Settings: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    )
  };
  return icons[name] || null;
}
