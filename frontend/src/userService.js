import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase_config.js';

export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function createUser(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    uid,
    email: data.email,
    name: data.name,
    photo_url: data.photo_url,
    college: data.college,
    place: data.place,
    graduation_year: data.graduation_year,
    resume_url: data.resume_url || null,
    profile_completed: true,
    created_at: serverTimestamp(),
  });
}
