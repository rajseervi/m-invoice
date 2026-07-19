const { db } = require('./src/firebase/config');
const { collection, getDocs, query, limit } = require('firebase/firestore');

async function debugDashboard() {
  try {
    console.log('🔍 Debugging Dashboard Data...');
    
    // Check invoices
    console.log('\n📋 Checking Invoices...');
    const invoicesQuery = query(collection(db, 'invoices'), limit(10));
    const invoicesSnapshot = await getDocs(invoicesQuery);
    console.log(`Found ${invoicesSnapshot.size} invoices`);
    
    if (invoicesSnapshot.size > 0) {
      const sample = invoicesSnapshot.docs[0].data();
      console.log('Sample invoice:', {
        id: invoicesSnapshot.docs[0].id,
        total: sample.total,
        grandTotal: sample.grandTotal,
        subtotal: sample.subtotal,
        status: sample.status,
        createdAt: sample.createdAt,
        fields: Object.keys(sample)
      });
    }
    
    // Check parties
    console.log('\n👥 Checking Parties...');
    const partiesQuery = query(collection(db, 'parties'), limit(10));
    const partiesSnapshot = await getDocs(partiesQuery);
    console.log(`Found ${partiesSnapshot.size} parties`);
    
    if (partiesSnapshot.size > 0) {
      const sample = partiesSnapshot.docs[0].data();
      console.log('Sample party:', {
        id: partiesSnapshot.docs[0].id,
        name: sample.name,
        createdAt: sample.createdAt,
        fields: Object.keys(sample)
      });
    }
    
    // Check products
    console.log('\n📦 Checking Products...');
    const productsQuery = query(collection(db, 'products'), limit(10));
    const productsSnapshot = await getDocs(productsQuery);
    console.log(`Found ${productsSnapshot.size} products`);
    
    if (productsSnapshot.size > 0) {
      const sample = productsSnapshot.docs[0].data();
      console.log('Sample product:', {
        id: productsSnapshot.docs[0].id,
        name: sample.name,
        quantity: sample.quantity,
        price: sample.price,
        category: sample.category,
        fields: Object.keys(sample)
      });
    }
    
    console.log('\n✅ Debug complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
}

debugDashboard();