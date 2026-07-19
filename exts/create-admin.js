// Script to create an admin user directly in Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

// Your Firebase config from src/firebase/config.js
const firebaseConfig = {
     apiKey: "AIzaSyA4FdwLkgOoVnPAKD-Pz9alICw072Mt4a8",
  authDomain: "studio-164378229-17630.firebaseapp.com",
  projectId: "studio-164378229-17630",
  storageBucket: "studio-164378229-17630.firebasestorage.app",
  messagingSenderId: "214575347397",
  appId: "1:214575347397:web:c01eb41c353d409d78e2ac"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin user details - CHANGE THESE VALUES
const adminEmail = "prc2199@gmail.com";
const adminPassword = "prc2199@gmail.com"; // Use a strong password
const adminFirstName = "prc2199@gmail.com";
const adminLastName = "prc2199@gmail.com";

async function createAdminUser() {
  try {
    console.log(`Creating admin user with email: ${adminEmail}`);
    
    // Create user with Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      adminEmail,
      adminPassword
    );
    
    const userId = userCredential.user.uid;
    console.log(`User created with ID: ${userId}`);
    
    // Create user document in Firestore with admin role and active status
    await setDoc(doc(db, 'users', userId), {
      firstName: adminFirstName,
      lastName: adminLastName,
      name: `${adminFirstName} ${adminLastName}`,
      email: adminEmail,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      approvalStatus: {
        isApproved: true,
        approvedBy: 'system',
        approvedAt: new Date().toISOString(),
        notes: 'Initial admin user'
      },
      subscription: {
        isActive: true,
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        plan: 'admin'
      }
    });
    
    console.log('Admin user created successfully!');
    console.log('You can now log in with these credentials.');
  } catch (error) {
    console.error('Error creating admin user:', error);
    if (error.code === 'auth/email-already-in-use') {
      console.log('An account with this email already exists. Try a different email or use the Firebase console to update an existing user to admin role.');
    }
  }
}

createAdminUser();