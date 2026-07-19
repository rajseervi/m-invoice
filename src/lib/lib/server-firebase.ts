import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Server-side Firebase configuration
const firebaseConfig = {
 apiKey: "AIzaSyA4FdwLkgOoVnPAKD-Pz9alICw072Mt4a8",
  authDomain: "studio-164378229-17630.firebaseapp.com",
  projectId: "studio-164378229-17630",
  storageBucket: "studio-164378229-17630.firebasestorage.app",
  messagingSenderId: "214575347397",
  appId: "1:214575347397:web:c01eb41c353d409d78e2ac"
};

// Initialize Firebase app for server-side use
let serverApp;
let serverDb;

try {
  // Check if app is already initialized
  const existingApps = getApps();
  if (existingApps.length === 0) {
    serverApp = initializeApp(firebaseConfig, 'server-app');
  } else {
    serverApp = existingApps.find(app => app.name === 'server-app') || existingApps[0];
  }

  serverDb = getFirestore(serverApp);

  // Connect to emulator in development if needed
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    try {
      connectFirestoreEmulator(serverDb, 'localhost', 8080);
      console.log('Server Firebase connected to emulator');
    } catch (error) {
      // Emulator might already be connected
      console.log('Server Firebase emulator connection skipped (already connected)');
    }
  }
} catch (error) {
  console.error('Failed to initialize server Firebase:', error);
  // Fallback to default app
  if (getApps().length > 0) {
    serverApp = getApps()[0];
    serverDb = getFirestore(serverApp);
  }
}

export { serverDb };
export default serverApp;