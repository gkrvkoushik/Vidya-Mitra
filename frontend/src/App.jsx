import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase_config.js';
import { getUser } from './userService.js';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ProfileForm from './components/ProfileForm';
import EditProfile from './components/EditProfile';
import GoogleSignInModal from './components/GoogleSignInModal';
import './App.css';

// states: 'loading' | 'landing' | 'profile_form' | 'dashboard' | 'edit_profile'
export default function App() {
  const [theme, setTheme] = useState('dark');
  const [appState, setAppState] = useState('loading');
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setAppState('landing');
        setFirebaseUser(null);
        setUser(null);
        return;
      }
      setFirebaseUser(fbUser);
      setLoginModalOpen(false);

      const existing = await getUser(fbUser.uid);
      if (existing && existing.profile_completed) {
        setUser({
          name: existing.name,
          email: existing.email,
          avatar: existing.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(existing.name)}&background=7B3FFF&color=fff`,
          college: existing.college,
          place: existing.place,
          graduation_year: existing.graduation_year,
          resume_url: existing.resume_url,
        });
        setAppState('dashboard');
      } else {
        setAppState('profile_form');
      }
    });
    return unsubscribe;
  }, []);

  const handleProfileComplete = (mappedUser) => {
    setUser(mappedUser);
    setAppState('dashboard');
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAppState('landing');
  };

  if (appState === 'loading') return null;

  return (
    <div className={`app-wrapper ${theme}`}>

      {appState === 'landing' && (
        <LandingPage theme={theme} setTheme={setTheme} onOpenLogin={() => setLoginModalOpen(true)} />
      )}

      {appState === 'profile_form' && firebaseUser && (
        <ProfileForm firebaseUser={firebaseUser} onComplete={handleProfileComplete} />
      )}

      {appState === 'dashboard' && user && (
        <Dashboard
          user={user}
          firebaseUser={firebaseUser}
          theme={theme}
          setTheme={setTheme}
          onLogout={handleLogout}
          onEditProfile={() => setAppState('edit_profile')}
          onMyProfile={() => setAppState('my_profile')}
          onUserUpdate={handleUserUpdate}
        />
      )}

      {appState === 'edit_profile' && user && firebaseUser && (
        <EditProfile
          user={user}
          firebaseUser={firebaseUser}
          onBack={() => setAppState('dashboard')}
          onSave={(updatedUser) => { handleUserUpdate(updatedUser); }}
        />
      )}

      {appState === 'my_profile' && user && (
        <MyProfile user={user} theme={theme} onBack={() => setAppState('dashboard')} onEditProfile={() => setAppState('edit_profile')} />
      )}

      {loginModalOpen && (
        <GoogleSignInModal onClose={() => setLoginModalOpen(false)} />
      )}
    </div>
  );
}

// Inline MyProfile view (read-only)
function MyProfile({ user, onBack, onEditProfile }) {
  return (
    <div className="edit-profile-page">
      <button className="edit-profile-back-btn" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Dashboard
      </button>

      <div className="edit-profile-container">
        <div className="edit-profile-header">
          <div className="edit-profile-avatar-section">
            <img src={user.avatar} alt={user.name} className="edit-profile-avatar" />
          </div>
          <div>
            <h2 className="edit-profile-title">{user.name}</h2>
            <p className="edit-profile-subtitle">{user.email}</p>
          </div>
        </div>

        <div className="my-profile-details">
          {[
            { label: 'College / University', value: user.college },
            { label: 'Place / City', value: user.place },
            { label: 'Graduation Year', value: user.graduation_year },
          ].map(({ label, value }) => (
            <div className="my-profile-field" key={label}>
              <span className="edit-field-label">{label}</span>
              <span className="my-profile-value">{value || '—'}</span>
            </div>
          ))}

          {user.resume_url && (
            <div className="my-profile-field">
              <span className="edit-field-label">Resume</span>
              <a href={user.resume_url} target="_blank" rel="noreferrer" className="edit-resume-current-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                View Resume
              </a>
            </div>
          )}
        </div>

        <div className="edit-profile-actions" style={{ marginTop: '2rem' }}>
          <button className="edit-cancel-btn" onClick={onBack}>Back</button>
          <button className="edit-save-btn" onClick={onEditProfile}>Edit Profile</button>
        </div>
      </div>
    </div>
  );
}
