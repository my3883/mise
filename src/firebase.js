// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA0Kckv_v0V1FarKjFDGZ6oTekjws9IMFM",
  authDomain: "mise-app-54ae6.firebaseapp.com",
  projectId: "mise-app-54ae6",
  storageBucket: "mise-app-54ae6.firebasestorage.app",
  messagingSenderId: "73755692590",
  appId: "1:73755692590:web:3fafb18fb18736c4d459bf"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { app, auth, provider };
