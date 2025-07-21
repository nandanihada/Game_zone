// firebase.js
// This file sets up your Firebase project configuration.

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ✅ Local Firebase Configuration (replace with yours if needed)
const firebaseConfig = {
  apiKey: "AIzaSyAXUluR3zaI5ha-bHBSB9ofqt6C6X3iLeg",
  authDomain: "webpage-86057.firebaseapp.com",
  projectId: "webpage-86057",
  storageBucket: "webpage-86057.appspot.com", // ✅ FIXED .app to .appspot.com
  messagingSenderId: "847045982521",
  appId: "1:847045982521:web:2353e8d8002e9d1cd2d0e8"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Setup Authentication and Firestore
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// ✅ Export for use in your components
export { auth, provider, db };
