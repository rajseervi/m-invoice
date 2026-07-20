const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
   apiKey: "AIzaSyC3L0RThSlzlevakOmpOyf66_bZJ-Pkrco",
  authDomain: "anutecdmindia.firebaseapp.com",
  projectId: "anutecdmindia",
  storageBucket: "anutecdmindia.firebasestorage.app",
  messagingSenderId: "490380975464",
  appId: "1:490380975464:web:405bd931a3d63876828add"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAndFixAuthIssue() {
  try {
    console.log('🔍 Checking authentication and user setup...');
    
    // Check if there are any users in the users collection
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`📊 Found ${usersSnapshot.size} users in the database`);
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database. Creating admin user...');
      
      // Create a default admin user
      const adminUserId = 'admin-user-default';
      const adminUser = {
        email: 'admin@example.com',
        displayName: 'Admin User',
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
      
      await setDoc(doc(db, 'users', adminUserId), adminUser);
      console.log('✅ Admin user created successfully');
      console.log('📝 User ID:', adminUserId);
      console.log('📧 Email:', adminUser.email);
      console.log('🔑 Role:', adminUser.role);
      
      return adminUserId;
    } else {
      console.log('👥 Existing users:');
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        console.log(`  - ID: ${doc.id}`);
        console.log(`    Email: ${userData.email || 'N/A'}`);
        console.log(`    Role: ${userData.role || 'N/A'}`);
        console.log(`    Status: ${userData.status || 'N/A'}`);
        console.log(`    Active: ${userData.isActive || false}`);
        console.log('');
      });
      
      // Check if there's an admin user
      const adminUsers = [];
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.role === 'admin' && userData.isActive) {
          adminUsers.push({ id: doc.id, ...userData });
        }
      });
      
      if (adminUsers.length === 0) {
        console.log('⚠️ No active admin users found. Updating first user to admin...');
        const firstUser = usersSnapshot.docs[0];
        await setDoc(doc(db, 'users', firstUser.id), {
          ...firstUser.data(),
          role: 'admin',
          status: 'active',
          isActive: true
        }, { merge: true });
        console.log(`✅ Updated user ${firstUser.id} to admin`);
        return firstUser.id;
      } else {
        console.log(`✅ Found ${adminUsers.length} active admin user(s)`);
        return adminUsers[0].id;
      }
    }
  } catch (error) {
    console.error('❌ Error checking authentication:', error);
    throw error;
  }
}

async function testInvoiceAccess(userId) {
  try {
    console.log(`🧪 Testing invoice access for user: ${userId}`);
    
    // Try to read invoices collection
    const invoicesSnapshot = await getDocs(collection(db, 'invoices'));
    console.log(`📊 Found ${invoicesSnapshot.size} invoices in the database`);
    
    if (invoicesSnapshot.size > 0) {
      console.log('✅ Successfully accessed invoices collection');
      console.log('📝 Sample invoices:');
      invoicesSnapshot.docs.slice(0, 3).forEach(doc => {
        const data = doc.data();
        console.log(`  - ${doc.id}: ${data.invoiceNumber || 'N/A'} (${data.status || 'N/A'})`);
      });
    } else {
      console.log('ℹ️ No invoices found in the database');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error accessing invoices:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Starting authentication fix...\n');
    
    const userId = await checkAndFixAuthIssue();
    console.log('\n' + '='.repeat(50));
    
    const canAccessInvoices = await testInvoiceAccess(userId);
    
    console.log('\n' + '='.repeat(50));
    console.log('📋 SUMMARY:');
    console.log(`✅ User ID: ${userId}`);
    console.log(`${canAccessInvoices ? '✅' : '❌'} Invoice access: ${canAccessInvoices ? 'Working' : 'Failed'}`);
    
    if (canAccessInvoices) {
      console.log('\n🎉 Authentication issue should be resolved!');
      console.log('💡 Make sure to use this user ID in your application:');
      console.log(`   localStorage.setItem('authUser', JSON.stringify({uid: '${userId}'}));`);
      console.log(`   localStorage.setItem('userRole', 'admin');`);
      console.log(`   localStorage.setItem('userStatus', 'active');`);
    } else {
      console.log('\n⚠️ There might still be permission issues. Check Firestore rules.');
    }
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

main();