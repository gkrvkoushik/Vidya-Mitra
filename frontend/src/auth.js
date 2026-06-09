import { signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase_config.js";

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signOut = () => firebaseSignOut(auth);

export { auth };
