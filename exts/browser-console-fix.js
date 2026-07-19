// Copy and paste this into your browser console while on the dashboard page
// This will help fix the authentication issue

(async function fixAuth() {
  console.log('🔧 Starting authentication fix...');
  
  try {
    // Get Firebase instances from window
    const auth = firebase?.auth?.() || window.auth;
    const db = firebase?.firestore?.() || window.db;
    
    if (!auth || !db) {
      console.error('❌ Firebase not found. Make sure you are on the app page.');
      return;
    }
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ No authenticated user. Please log in first.');
      return;
    }
    
    console.log('✅ Found authenticated user:', currentUser.uid);
    
    // Check if user document exists
    const userDocRef = db.collection('users').doc(currentUser.uid);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      console.log('📝 Creating user document...');
      await userDocRef.set({
        email: currentUser.email,
        displayName: currentUser.displayName || 'Admin User',
        role: 'admin',
        status: 'active',
        isActive: true,
        createdAt: new Date().toISOString()
      });
      console.log('✅ User document created');
    } else {
      console.log('📝 Updating user document...');
      await userDocRef.update({
        role: 'admin',
        status: 'active',
        isActive: true,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ User document updated');
    }
    
    // Update localStorage
    localStorage.setItem('authUser', JSON.stringify({
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName
    }));
    localStorage.setItem('userRole', 'admin');
    localStorage.setItem('userStatus', 'active');
    
    console.log('✅ localStorage updated');
    
    // Test invoice access
    console.log('🧪 Testing invoice access...');
    const invoicesSnapshot = await db.collection('invoices').limit(1).get();
    console.log('✅ Invoice access test successful!');
    
    console.log('🎉 Authentication fix complete! Please refresh the page.');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
    
    if (error.code === 'permission-denied') {
      console.log('💡 Permission denied error detected. This might be due to:');
      console.log('   1. User document missing in Firestore');
      console.log('   2. User not marked as active');
      console.log('   3. Firestore security rules issue');
      console.log('');
      console.log('🔧 Try running this in the console:');
      console.log('   localStorage.setItem("authUser", JSON.stringify({uid: "admin-user-default"}));');
      console.log('   localStorage.setItem("userRole", "admin");');
      console.log('   localStorage.setItem("userStatus", "active");');
      console.log('   Then refresh the page.');
    }
  }
})();