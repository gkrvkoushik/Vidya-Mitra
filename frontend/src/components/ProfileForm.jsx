import { useState } from 'react';
import { createUser } from '../userService.js';
import { uploadResumeToCloudinaryOnly } from '../resumeUpload.js';

export default function ProfileForm({ firebaseUser, onComplete }) {
  const [form, setForm] = useState({
    name: firebaseUser.displayName || '',
    college: '',
    place: '',
    graduation_year: '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.college || !form.place || !form.graduation_year) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let resume_url = null;
      if (resumeFile) {
        resume_url = await uploadResumeToCloudinaryOnly(firebaseUser.uid, resumeFile);
      }

      await createUser(firebaseUser.uid, {
        email: firebaseUser.email,
        name: form.name,
        photo_url: firebaseUser.photoURL || null,
        college: form.college,
        place: form.place,
        graduation_year: Number(form.graduation_year),
        resume_url,
      });

      onComplete({
        name: form.name,
        email: firebaseUser.email,
        avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&background=7B3FFF&color=fff`,
      });
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="google-login-modal" style={{ maxWidth: '480px', width: '90%' }}>
        {/* Header */}
        <div className="google-modal-logo">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7B3FFF,#4F27A3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>V</div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1E293B' }}>Complete Your Profile</span>
        </div>

        {/* Avatar preview */}
        {firebaseUser.photoURL && (
          <img
            src={firebaseUser.photoURL}
            alt={form.name}
            style={{ width: 64, height: 64, borderRadius: '50%', margin: '0.5rem auto', display: 'block', border: '3px solid #7B3FFF' }}
          />
        )}
        <p className="google-modal-subtext" style={{ marginBottom: '1rem' }}>
          Signed in as <strong>{firebaseUser.email}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>

          <div className="google-custom-field">
            <label className="google-custom-label">Full Name *</label>
            <input
              className="google-custom-input-box"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="google-custom-field">
            <label className="google-custom-label">College / University *</label>
            <input
              className="google-custom-input-box"
              name="college"
              value={form.college}
              onChange={handleChange}
              placeholder="e.g. IIT Madras"
              required
            />
          </div>

          <div className="google-custom-field">
            <label className="google-custom-label">Place / City *</label>
            <input
              className="google-custom-input-box"
              name="place"
              value={form.place}
              onChange={handleChange}
              placeholder="e.g. Chennai"
              required
            />
          </div>

          <div className="google-custom-field">
            <label className="google-custom-label">Graduation Year *</label>
            <input
              className="google-custom-input-box"
              name="graduation_year"
              type="number"
              min="2000"
              max="2035"
              value={form.graduation_year}
              onChange={handleChange}
              placeholder="e.g. 2026"
              required
            />
          </div>

          <div className="google-custom-field">
            <label className="google-custom-label">Resume (Optional · PDF/DOC)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files[0] || null)}
              style={{ fontSize: '0.8rem', color: '#64748B' }}
            />
            {resumeFile && (
              <span style={{ fontSize: '0.7rem', color: '#7B3FFF' }}>✓ {resumeFile.name}</span>
            )}
          </div>

          {error && (
            <p style={{ fontSize: '0.75rem', color: '#EF4444', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.25rem' }}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save & Go to Dashboard →'}
          </button>
        </form>
      </div>
    </div>
  );
}
