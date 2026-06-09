import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase_config.js';

export default function GoogleSignInModal({ onClose }) {
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged in App.jsx will handle the rest
      onClose();
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        console.error(e);
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="google-login-modal">
        <div className="google-modal-logo">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path fill="#4285F4" d="M23.745 12.27c0-.77-.07-1.54-.2-2.27H12v4.51h6.6c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.69-5.17 3.69-8.82z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.37 24 12 24z" />
            <path fill="#FBBC05" d="M5.27 14.29a7.18 7.18 0 0 1 0-4.58V6.62H1.29a11.94 11.94 0 0 0 0 10.76l3.98-3.09z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
          </svg>
          <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#1E293B' }}>Google Sign-In</span>
        </div>

        <h3 className="google-modal-headline">Sign in to VidyaGuide AI</h3>
        <p className="google-modal-subtext">Use your real Google account to continue</p>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handleGoogleSignIn}>
          <svg viewBox="0 0 24 24" width="18" height="18" style={{ marginRight: '8px' }}>
            <path fill="#fff" d="M23.745 12.27c0-.77-.07-1.54-.2-2.27H12v4.51h6.6c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.69-5.17 3.69-8.82z" />
            <path fill="#fff" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.37 24 12 24z" />
            <path fill="#fff" d="M5.27 14.29a7.18 7.18 0 0 1 0-4.58V6.62H1.29a11.94 11.94 0 0 0 0 10.76l3.98-3.09z" />
            <path fill="#fff" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
          </svg>
          Continue with Google
        </button>

        <button className="google-modal-close-btn" onClick={onClose} style={{ marginTop: '0.75rem' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
