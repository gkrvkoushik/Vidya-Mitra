/**
 * resumeUpload.js
 * Uploads a resume PDF to Cloudinary (unsigned upload preset),
 * then stores the returned secure_url in Firestore users/{uid}.
 *
 * Cloudinary unsigned upload — no server needed.
 * Requires an "unsigned" upload preset created in:
 *   Cloudinary Dashboard → Settings → Upload → Upload Presets → Add preset → Signing mode: Unsigned
 *
 * Env vars needed in frontend/.env:
 *   VITE_CLOUDINARY_CLOUD_NAME=koushik-2005
 *   VITE_CLOUDINARY_UPLOAD_PRESET=<your_unsigned_preset_name>
 */

import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase_config.js';

const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Core upload: sends file to Cloudinary, returns the secure_url.
 * Does NOT write to Firestore — use this when Firestore write
 * is handled elsewhere (e.g. inside createUser).
 *
 * @param {string} uid
 * @param {File}   file
 * @returns {Promise<string>} secure_url
 */
export async function uploadResumeToCloudinaryOnly(uid, file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET in .env'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', `resumes/${uid}`);
  formData.append('resource_type', 'raw');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Cloudinary upload failed: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Full upload: uploads to Cloudinary AND updates Firestore resume_url.
 * Use this from EditProfile where the user document already exists.
 *
 * @param {string} uid
 * @param {File}   file
 * @returns {Promise<string>} secure_url
 */
export async function uploadResumeToCloudinary(uid, file) {
  const resumeUrl = await uploadResumeToCloudinaryOnly(uid, file);
  await updateDoc(doc(db, 'users', uid), { resume_url: resumeUrl });
  return resumeUrl;
}
