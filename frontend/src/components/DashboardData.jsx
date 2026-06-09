import { useState, useEffect, useRef } from 'react';
import { getDashboardData } from '../api.js';

// Dashboard component with real Firestore data
export default function DashboardWithData({ user, firebaseUser, onActiveRoadmapUpdate }) {
  const [dashData, setDashData] = useState({
    ats_score: 75,
    profile_completion: 80,
    total_points: 450,
    badge_level: 'Gold',
    roadmap_progress: 0,
    active_roadmap: null,
    recent_activities: [],
    skills_overview: [],
    has_analysis: false,
    has_roadmaps: false
  });
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !firebaseUser?.uid) return;
    initialized.current = true;
    
    getDashboardData(firebaseUser.uid)
      .then((data) => {
        setDashData(data);
        if (onActiveRoadmapUpdate && data.active_roadmap) {
          onActiveRoadmapUpdate(data.active_roadmap);
        }
      })
      .catch((error) => {
        console.error('Dashboard data fetch error:', error);
      })
      .finally(() => setLoading(false));
  }, [firebaseUser?.uid, onActiveRoadmapUpdate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
        <span className="spinner" style={{ borderColor: 'rgba(138,85,255,0.3)', borderTopColor: 'var(--color-dash-purple)', width: 32, height: 32, borderWidth: 3 }} />
        <span style={{ marginLeft: '1rem', color: 'var(--color-dash-text-muted)' }}>Loading dashboard...</span>
      </div>
    );
  }

  return {
    atsScore: dashData.ats_score,
    profileCompletion: dashData.profile_completion,
    totalPoints: dashData.total_points,
    badgeLevel: dashData.badge_level,
    roadmapProgress: dashData.roadmap_progress,
    activeRoadmap: dashData.active_roadmap,
    recentActivities: dashData.recent_activities,
    skillsOverview: dashData.skills_overview,
    hasAnalysis: dashData.has_analysis,
    hasRoadmaps: dashData.has_roadmaps
  };
}