import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
apiKey: "AIzaSyDSu1ErMkJneofYcnDZsewCOI076YPtaaQ",
authDomain: "hanuman-marketing-kothur.firebaseapp.com",
projectId: "hanuman-marketing-kothur",
 storageBucket: "hanuman-marketing-kothur.firebasestorage.app",
 messagingSenderId: "979647959745",
 appId: "1:979647959745:web:64960d0af04bcc2e95ba40"

};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
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