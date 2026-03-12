import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAnu5kR7MFZQeVGLs5AuxqDts5yyKuCzWo",
  authDomain: "dawarsiyana.firebaseapp.com",
  projectId: "dawarsiyana",
  storageBucket: "dawarsiyana.firebasestorage.app",
  messagingSenderId: "128940429267",
  appId: "1:128940429267:web:5670369e87dd30fa25e926"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
