import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase_config.js';
import { uploadResumeToCloudinary } from '../resumeUpload.js';

export default function EditProfile({ user, firebaseUser, onBack, onSave }) {
  const [form, setForm] = useState({
    name: user.name || '',
    college: user.college || '',
    place: user.place || '',
    graduation_year: user.graduation_year || '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      let resume_url = user.resume_url || null;
      if (resumeFile) {
        // uploadResumeToCloudinary uploads to Cloudinary AND updates Firestore resume_url
        resume_url = await uploadResumeToCloudinary(firebaseUser.uid, resumeFile);
      }

      // Update remaining profile fields in Firestore
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        name: form.name,
        college: form.college,
        place: form.place,
        graduation_year: Number(form.graduation_year),
        resume_url,
      });

      setSuccess(true);
      onSave({
        ...user,
        name: form.name,
        college: form.college,
        place: form.place,
        graduation_year: Number(form.graduation_year),
        resume_url,
      });

      setTimeout(() => onBack(), 1200);
    } catch (err) {
      setError('Failed to save. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-profile-page">
      {/* Back button */}
      <button className="edit-profile-back-btn" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Dashboard
      </button>

      <div className="edit-profile-container">
        {/* Header */}
        <div className="edit-profile-header">
          <div className="edit-profile-avatar-section">
            <img src={user.avatar} alt={user.name} className="edit-profile-avatar" />
            <div className="edit-profile-avatar-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="edit-profile-title">Edit Profile</h2>
            <p className="edit-profile-subtitle">{user.email}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="edit-profile-grid">

            <div className="edit-field-group">
              <label className="edit-field-label">Full Name *</label>
              <input
                className="edit-field-input"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="edit-field-group">
              <label className="edit-field-label">College / University *</label>
              <input
                className="edit-field-input"
                name="college"
                value={form.college}
                onChange={handleChange}
                placeholder="e.g. IIT Madras"
                required
              />
            </div>

            <div className="edit-field-group">
              <label className="edit-field-label">Place / City *</label>
              <input
                className="edit-field-input"
                name="place"
                value={form.place}
                onChange={handleChange}
                placeholder="e.g. Chennai"
                required
              />
            </div>

            <div className="edit-field-group">
              <label className="edit-field-label">Graduation Year *</label>
              <input
                className="edit-field-input"
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

          </div>

          {/* Resume upload full-width */}
          <div className="edit-field-group" style={{ marginTop: '0.5rem' }}>
            <label className="edit-field-label">
              Resume {user.resume_url ? '(Replace existing)' : '(Optional · PDF/DOC)'}
            </label>
            {user.resume_url && (
              <a href={user.resume_url} target="_blank" rel="noreferrer" className="edit-resume-current-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                View current resume
              </a>
            )}
            <div className="edit-file-upload-zone">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                id="resume-upload"
                style={{ display: 'none' }}
                onChange={(e) => setResumeFile(e.target.files[0] || null)}
              />
              <label htmlFor="resume-upload" className="edit-file-upload-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {resumeFile ? resumeFile.name : 'Click to upload resume'}
              </label>
            </div>
          </div>

          {error && <p className="edit-error-msg">{error}</p>}
          {success && <p className="edit-success-msg">✓ Profile updated successfully!</p>}

          <div className="edit-profile-actions">
            <button type="button" className="edit-cancel-btn" onClick={onBack} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="edit-save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
