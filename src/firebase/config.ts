import { getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, Firestore, connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
 apiKey: "AIzaSyA4FdwLkgOoVnPAKD-Pz9alICw072Mt4a8",
  authDomain: "studio-164378229-17630.firebaseapp.com",
  projectId: "studio-164378229-17630",
  storageBucket: "studio-164378229-17630.firebasestorage.app",
  messagingSenderId: "214575347397",
  appId: "1:214575347397:web:c01eb41c353d409d78e2ac"
};

let app: FirebaseApp;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  // Initialize Firestore with settings to reduce warnings
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  });
} else {
  app = getApps()[0];
  db = getFirestore(app);
}

export { db };
export const auth: Auth = getAuth(app);

// Enhanced persistence handling for better multi-tab support
if (typeof window !== 'undefined') {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Disable persistence in development to avoid multi-tab issues
  if (!isDevelopment && process.env.NEXT_PUBLIC_ENABLE_FIREBASE_PERSISTENCE !== 'false') {
    // Use a more robust persistence key
    const persistenceKey = `firestore_persistence_${window.location.origin}`;
    const isPersistenceAttempted = sessionStorage.getItem(persistenceKey);

    if (!isPersistenceAttempted) {
      // Mark that we're attempting offline persistence to avoid multiple attempts
      sessionStorage.setItem(persistenceKey, 'attempting');

      enableIndexedDbPersistence(db, {
        synchronizeTabs: true
      })
        .then(() => {
          console.log('✅ Firestore offline persistence enabled successfully');
          sessionStorage.setItem(persistenceKey, 'enabled');
        })
        .catch((err: any) => {
          // Suppress the error in development to avoid console spam
          if (isDevelopment) {
            console.warn('⚠️ Firestore persistence disabled (multi-tab detected)');
          }

          switch (err.code) {
            case 'failed-precondition':
              // Multiple tabs open - this is normal in development
              sessionStorage.setItem(persistenceKey, 'multi-tab');
              break;
            case 'unimplemented':
              console.warn('Browser does not support offline persistence');
              sessionStorage.setItem(persistenceKey, 'unsupported');
              break;
            default:
              if (!isDevelopment) {
                console.warn('Firestore persistence could not be enabled:', err.message);
              }
              sessionStorage.setItem(persistenceKey, 'failed');
          }
        });
    }
  } else {
    console.log('🔧 Firebase persistence disabled in development mode to avoid multi-tab conflicts');
  }
}

export default app;