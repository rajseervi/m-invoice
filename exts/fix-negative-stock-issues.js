#!/usr/bin/env node

/**
 * Script to fix existing negative stock issues and prevent future occurrences
 * This script will:
 * 1. Identify products with negative stock
 * 2. Reset negative stock to zero (with logging)
 * 3. Create stock adjustment records
 * 4. Generate a report of fixed issues
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixNegativeStockIssues() {
  try {
    console.log('🔍 Starting negative stock detection and fix...');
    
    // Get all products
    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();
    
    if (snapshot.empty) {
      console.log('📝 No products found.');
      return;
    }
    
    console.log(`📊 Scanning ${snapshot.size} products for negative stock...`);
    
    const negativeStockProducts = [];
    const batch = db.batch();
    let processedCount = 0;
    let fixedCount = 0;
    
    // Identify products with negative stock
    snapshot.forEach((doc) => {
      const data = doc.data();
      const stock = data.quantity || 0;
      processedCount++;
      
      if (stock < 0) {
        negativeStockProducts.push({
          id: doc.id,
          name: data.name,
          currentStock: stock,
          ...data
        });
        
        console.log(`❌ Found negative stock: ${data.name} (${stock} units)`);
        
        // Reset stock to zero
        batch.update(doc.ref, {
          quantity: 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          stockCorrectionApplied: true,
          previousNegativeStock: stock
        });
        
        fixedCount++;
      }
    });
    
    if (negativeStockProducts.length === 0) {
      console.log('✅ No negative stock found. All products have valid stock levels.');
      return;
    }
    
    console.log(`\n🔧 Fixing ${negativeStockProducts.length} products with negative stock...`);
    
    // Apply fixes
    await batch.commit();
    console.log('✅ Stock corrections applied successfully!');
    
    // Create stock movement records for the corrections
    console.log('📝 Creating stock adjustment records...');
    const movementBatch = db.batch();
    
    for (const product of negativeStockProducts) {
      const movementRef = db.collection('stock_movements').doc();
      movementBatch.set(movementRef, {
        productId: product.id,
        productName: product.name,
        movementType: 'adjustment',
        quantity: Math.abs(product.currentStock), // Positive adjustment amount
        previousQuantity: product.currentStock,
        newQuantity: 0,
        reason: 'Negative stock correction - System fix',
        referenceType: 'adjustment',
        referenceId: 'negative-stock-fix',
        notes: `Corrected negative stock from ${product.currentStock} to 0`,
        createdAt: new Date().toISOString(),
        createdBy: 'system-fix'
      });
    }
    
    await movementBatch.commit();
    console.log('✅ Stock movement records created successfully!');
    
    // Generate detailed report
    console.log('\n📈 NEGATIVE STOCK FIX REPORT');
    console.log('=' .repeat(50));
    console.log(`Total products scanned: ${processedCount}`);
    console.log(`Products with negative stock: ${negativeStockProducts.length}`);
    console.log(`Products fixed: ${fixedCount}`);
    console.log(`Products with valid stock: ${processedCount - negativeStockProducts.length}`);
    
    if (negativeStockProducts.length > 0) {
      console.log('\n📋 FIXED PRODUCTS DETAILS:');
      console.log('-'.repeat(80));
      console.log('Product Name'.padEnd(30) + 'Previous Stock'.padEnd(15) + 'New Stock'.padEnd(12) + 'Correction');
      console.log('-'.repeat(80));
      
      negativeStockProducts.forEach(product => {
        const correction = Math.abs(product.currentStock);
        console.log(
          product.name.substring(0, 29).padEnd(30) +
          product.currentStock.toString().padEnd(15) +
          '0'.padEnd(12) +
          `+${correction}`
        );
      });
    }
    
    // Save report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalScanned: processedCount,
        negativeStockFound: negativeStockProducts.length,
        productsFixed: fixedCount,
        validProducts: processedCount - negativeStockProducts.length
      },
      fixedProducts: negativeStockProducts.map(p => ({
        id: p.id,
        name: p.name,
        previousStock: p.currentStock,
        newStock: 0,
        correction: Math.abs(p.currentStock)
      }))
    };
    
    // Save report to Firestore
    await db.collection('system_reports').add({
      type: 'negative_stock_fix',
      ...reportData
    });
    
    console.log('\n✅ Report saved to system_reports collection');
    console.log('\n🎉 Negative stock fix completed successfully!');
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. Review invoice creation processes to ensure stock validation');
    console.log('2. Implement strict stock validation in all sales flows');
    console.log('3. Monitor stock levels regularly to prevent future issues');
    console.log('4. Consider setting up automated stock alerts');
    console.log('5. Train staff on proper inventory management procedures');
    
  } catch (error) {
    console.error('❌ Error during negative stock fix:', error);
    throw error;
  }
}

// Additional function to validate current stock validation setup
async function validateStockValidationSetup() {
  console.log('\n🔍 Validating stock validation setup...');
  
  try {
    // Check if stock validation services exist
    const fs = require('fs');
    const path = require('path');
    
    const filesToCheck = [
      'src/services/stockValidationService.ts',
      'src/hooks/useStockValidation.ts',
      'src/components/invoices/StockValidatedInvoiceForm.tsx'
    ];
    
    let allFilesExist = true;
    
    filesToCheck.forEach(file => {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file} - Found`);
      } else {
        console.log(`❌ ${file} - Missing`);
        allFilesExist = false;
      }
    });
    
    if (allFilesExist) {
      console.log('✅ All stock validation files are in place');
    } else {
      console.log('⚠️ Some stock validation files are missing');
    }
    
    return allFilesExist;
    
  } catch (error) {
    console.error('Error validating setup:', error);
    return false;
  }
}

// Run the fix
fixNegativeStockIssues()
  .then(() => validateStockValidationSetup())
  .then(() => {
    console.log('\n✨ All operations completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Operation failed:', error);
    process.exit(1);
  });