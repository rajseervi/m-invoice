#!/usr/bin/env node

/**
 * Migration script to remove GST-related fields from all categories
 * This script will remove gstRate and other GST-related fields from category documents
 */

const admin = require('firebase-admin');

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  let serviceAccount;
  try {
    serviceAccount = require('./firebase-service-account.json');
  } catch (error) {
    console.error('❌ Error: firebase-service-account.json not found!');
    console.error('Please ensure your Firebase service account key is in the root directory.');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function removeCategoryGstFields() {
  try {
    console.log('🚀 Starting migration to remove GST fields from categories...');
    
    // Get all categories
    const categoriesRef = db.collection('categories');
    const snapshot = await categoriesRef.get();
    
    if (snapshot.empty) {
      console.log('📝 No categories found.');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} categories to process.`);
    
    const batch = db.batch();
    let processedCount = 0;
    let updatedCount = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      processedCount++;
      
      // Check if the category has any GST-related fields
      const hasGstFields = data.hasOwnProperty('gstRate') || 
                          data.hasOwnProperty('defaultGstRate') || 
                          data.hasOwnProperty('gstExempt');
      
      if (hasGstFields) {
        console.log(`🔄 Removing GST fields from category: ${data.name}`);
        
        // Remove the GST-related fields
        const updateData = {
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Add field deletions
        if (data.hasOwnProperty('gstRate')) {
          updateData.gstRate = admin.firestore.FieldValue.delete();
        }
        if (data.hasOwnProperty('defaultGstRate')) {
          updateData.defaultGstRate = admin.firestore.FieldValue.delete();
        }
        if (data.hasOwnProperty('gstExempt')) {
          updateData.gstExempt = admin.firestore.FieldValue.delete();
        }
        
        batch.update(doc.ref, updateData);
        updatedCount++;
      } else {
        console.log(`✅ Category "${data.name}" already has no GST fields.`);
      }
    });
    
    if (updatedCount > 0) {
      console.log(`💾 Committing batch update for ${updatedCount} categories...`);
      await batch.commit();
      console.log('✅ Batch update completed successfully!');
    } else {
      console.log('ℹ️  No categories needed updating.');
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`   Total categories processed: ${processedCount}`);
    console.log(`   Categories updated: ${updatedCount}`);
    console.log(`   Categories unchanged: ${processedCount - updatedCount}`);
    
    console.log('\n🎉 Category GST fields migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Run the migration
removeCategoryGstFields()
  .then(() => {
    console.log('✨ Category migration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Category migration failed:', error);
    process.exit(1);
  });