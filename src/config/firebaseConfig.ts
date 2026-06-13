// src/config/firebaseConfig.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBa9fXCtKW7KdYCLEhoVxgjXapm9XU-NaU",
  authDomain: "staerk-app.firebaseapp.com",
  projectId: "staerk-app",
  storageBucket: "staerk-app.firebasestorage.app",
  messagingSenderId: "606858704144",
  appId: "1:606858704144:web:56a875448649ef5de2a195",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;