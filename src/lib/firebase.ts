import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
 apiKey: "AIzaSyA4FdwLkgOoVnPAKD-Pz9alICw072Mt4a8",
  authDomain: "studio-164378229-17630.firebaseapp.com",
  projectId: "studio-164378229-17630",
  storageBucket: "studio-164378229-17630.firebasestorage.app",
  messagingSenderId: "214575347397",
  appId: "1:214575347397:web:c01eb41c353d409d78e2ac"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators in development environment
if (process.env.NODE_ENV === 'development') {
  try {
    // Use emulators if available
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectAuthEmulator(auth, 'http://localhost:9099');
      console.log('Connected to Firebase emulators');
    }
  } catch (error) {
    console.error('Failed to connect to Firebase emulators:', error);
  }
}

export { db, auth };