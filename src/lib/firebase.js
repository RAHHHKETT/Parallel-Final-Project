import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyCUcSB1NdkmKL4n_5QnoP-zeX4N-oc9XBc",
  authDomain: "austria-saguilayan-palgan-oga.firebaseapp.com",
  databaseURL: "https://austria-saguilayan-palgan-oga-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "austria-saguilayan-palgan-oga",
  storageBucket: "austria-saguilayan-palgan-oga.firebasestorage.app",
  messagingSenderId: "474201758869",
  appId: "1:474201758869:web:ddc0283ce53d357bc50f9c",
  measurementId: "G-9M942E56W8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db          = getDatabase(app)
export const auth        = getAuth(app)           // Authentication
export const firestore   = getFirestore(app)      // Firestore — word lists, stats
export const functions   = getFunctions(app)