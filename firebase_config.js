import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAl0fafUSPV4d_8_322qzsQ0gA3pzrCsC4",
  authDomain: "my-project-fade8.firebaseapp.com",
  projectId: "my-project-fade8",
  storageBucket: "my-project-fade8.firebasestorage.app",
  messagingSenderId: "810359149981",
  appId: "1:810359149981:web:c2d9704e4f4db00b7acb74",
  measurementId: "G-GGMV6J1RFC"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
