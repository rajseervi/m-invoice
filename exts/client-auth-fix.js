// Client-side authentication fix
// Run this in your browser console while logged into the app

async function fixAuthenticationIssue() {
  try {
    console.log('🔍 Checking current authentication state...');
    
    // Check Firebase Auth
    const auth = window.firebase?.auth?.() || window.auth;
    if (!auth) {
      console.error('❌ Firebase Auth not found. Make sure you are on the app page.');
      return;
    }
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ No authenticated user found. Please log in first.');
      return;
    }
    
    console.log('✅ Authenticated user found:');
    console.log('  - UID:', currentUser.uid);
    console.log('  - Email:', currentUser.email);
    
    // Check Firestore
    const db = window.firebase?.firestore?.() || window.db;
    if (!db) {
      console.error('❌ Firestore not found. Make sure you are on the app page.');
      return;
    }
    
    // Check if user document exists
    console.log('🔍 Checking user document in Firestore...');
    const userDocRef = db.collection('users').doc(currentUser.uid);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      console.log('❌ User document does not exist. Creating it...');
      
      const userData = {
        email: currentUser.email,
        displayName: currentUser.displayName || 'Admin User',
        role: 'admin',
        status: 'active',
        isActive: true,
        createdAt: new Date().toISOString(),
        permissions: {
          pages: {
            dashboard: true,
            invoices: true,
            products: true,
            parties: true,
            reports: true
          },
          features: {
            create: true,
            edit: true,
            delete: true,
            export: true
          }
        }
      };
      
      await userDocRef.set(userData);
      console.log('✅ User document created successfully');
    } else {
      const userData = userDoc.data();
      console.log('✅ User document exists:');
      console.log('  - Role:', userData.role);
      console.log('  - Status:', userData.status);
      console.log('  - Active:', userData.isActive);
      
      // Update user document to ensure it has the correct fields
      const updates = {};
      let needsUpdate = false;
      
      if (userData.role !== 'admin') {
        updates.role = 'admin';
        needsUpdate = true;
      }
      
      if (userData.status !== 'active') {
        updates.status = 'active';
        needsUpdate = true;
      }
      
      if (userData.isActive !== true) {
        updates.isActive = true;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log('🔧 Updating user document...');
        await userDocRef.update(updates);
        console.log('✅ User document updated');
      }
    }
    
    // Update localStorage to match Firebase Auth
    console.log('🔧 Updating localStorage...');
    localStorage.setItem('authUser', JSON.stringify({
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName
    }));
    localStorage.setItem('userRole', 'admin');
    localStorage.setItem('userStatus', 'active');
    
    // Test invoice access
    console.log('🧪 Testing invoice access...');
    try {
      const invoicesRef = db.collection('invoices').limit(1);
      const snapshot = await invoicesRef.get();
      console.log('✅ Successfully accessed invoices collection');
      console.log('📊 Found', snapshot.size, 'invoices (limited to 1 for test)');
    } catch (error) {
      console.error('❌ Still cannot access invoices:', error);
      return false;
    }
    
    console.log('\n🎉 Authentication issue fixed!');
    console.log('🔄 Please refresh the page to see the changes.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error fixing authentication:', error);
    return false;
  }
}

// Run the fix
fixAuthenticationIssue();