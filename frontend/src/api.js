const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// Resume Analysis
export const analyzeResume = (uid, resumeUrl, resumeText, jobDescription) =>
  post('/api/resume/analyze', { uid, resume_url: resumeUrl, resume_text: resumeText, job_description: jobDescription });

export const getLatestAnalysis = (uid) => get(`/api/resume/latest/${uid}`);

// Career Paths
export const recommendCareers = (uid, skills, education, experience) =>
  post('/api/career/recommend', { uid, skills, education, experience });

export const customCareerPath = (uid, role, skills, education, experience) =>
  post('/api/career/custom', { uid, role, skills, education, experience });

export const selectRole = (uid, selectedRole) =>
  post('/api/career/select-role', { uid, selected_role: selectedRole });

export const getCareerPaths = (uid) => get(`/api/career/${uid}`);

export const getSkillsContext = (uid) => get(`/api/career/context/${uid}`);

// Roadmap
export const generateRoadmap = (uid, selectedRole, missingSkills, currentSkills, learningPace = 'Moderate') =>
  post('/api/roadmap/generate', { uid, selected_role: selectedRole, missing_skills: missingSkills, current_skills: currentSkills, learning_pace: learningPace });

export const getAllRoadmaps = (uid) => get(`/api/roadmap/all/${uid}`);

export const getRoadmap = (uid, role) =>
  get(role ? `/api/roadmap/${uid}?role=${encodeURIComponent(role)}` : `/api/roadmap/${uid}`);

export const completeTopic = (uid, topic, role) =>
  post('/api/roadmap/complete-topic', { uid, topic, role });

export const deleteRoadmap = (uid, role) =>
  fetch(`${BASE}/api/roadmap/delete?uid=${encodeURIComponent(uid)}&role=${encodeURIComponent(role)}`, {
    method: 'DELETE',
  }).then(res => {
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  });

// Quiz
export const generateQuiz = (uid, skill, difficulty) =>
  post('/api/quiz/generate', { uid, skill, difficulty });

export const submitQuiz = (uid, skill, difficulty, questions, answers) =>
  post('/api/quiz/submit', { uid, skill, difficulty, questions, answers });

export const getQuizHistory = (uid) => get(`/api/quiz/history/${uid}`);

// Progress
export const getProgress = (uid) => get(`/api/progress/${uid}`);

// Dashboard
export const getDashboardData = (uid) => get(`/api/dashboard/${uid}`);

// Chat
export const sendChatMessage = (uid, message, history, skillsContext) =>
  post('/api/chat/send', { uid, message, history, skills_context: skillsContext });

// Mock Interview
export const getInterviewContext = (uid) => get(`/api/interview/context/${uid}`);
export const startInterview = (uid, role, skills, missingSkills, resumeSummary, experienceYears, totalQuestions = 5, forceScenario = true) =>
  post('/api/interview/start', { uid, role, skills, missing_skills: missingSkills, resume_summary: resumeSummary, experience_years: experienceYears, total_questions: totalQuestions, force_scenario: forceScenario });
export const submitInterviewAnswer = (uid, sessionId, answer) =>
  post('/api/interview/answer', { uid, session_id: sessionId, answer });
export const getInterviewReport = (sessionId) => get(`/api/interview/report/${sessionId}`);
export const getInterviewHistory = (uid) => get(`/api/interview/history/${uid}`);
