/**
 * resumeDownload.js
 * Fetches the resume_url stored in Firestore for a given uid,
 * then triggers a browser download of the PDF file.
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase_config.js';

/**
 * Downloads the resume for `uid` by fetching the Cloudinary URL
 * stored in Firestore and triggering a browser file download.
 *
 * @param {string} uid       - Firebase user UID
 * @param {string} filename  - Downloaded file name (default: "resume.pdf")
 * @returns {Promise<void>}
 */
export async function downloadResume(uid, filename = 'resume.pdf') {
  // 1. Get resume URL from Firestore
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) throw new Error('User not found in Firestore.');

  const { resume_url } = snap.data();
  if (!resume_url) throw new Error('No resume uploaded yet.');

  // 2. Fetch the file as a blob (needed to force download instead of browser preview)
  const response = await fetch(resume_url);
  if (!response.ok) throw new Error('Failed to fetch resume file.');

  const blob = await response.blob();

  // 3. Trigger browser download
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(blobUrl);
}

/**
 * Returns the raw Cloudinary URL from Firestore (for preview / linking).
 *
 * @param {string} uid
 * @returns {Promise<string|null>}
 */
export async function getResumeUrl(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data().resume_url || null) : null;
}
