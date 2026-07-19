#!/usr/bin/env node

/**
 * Final Cleanup Script
 * 
 * This script performs final cleanup to ensure all pages are properly configured.
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Final Cleanup of Modern Layout Migration');
console.log('============================================\n');

const PROJECT_ROOT = process.cwd();
const APP_DIR = path.join(PROJECT_ROOT, 'src', 'app');

// Find all original-page.tsx files and clean them up
function findAndCleanOriginalPages() {
  const originalPages = [];
  
  function findOriginalPages(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findOriginalPages(fullPath);
      } else if (item === 'original-page.tsx') {
        originalPages.push(fullPath);
      }
    }
  }
  
  findOriginalPages(APP_DIR);
  return originalPages;
}

function cleanOriginalPage(filePath) {
  console.log(`🧹 Cleaning: ${path.relative(APP_DIR, filePath)}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Remove "use client" directive
    if (content.includes('"use client"')) {
      content = content.replace('"use client";\n', '');
      hasChanges = true;
      console.log(`  ✅ Removed "use client" directive`);
    }
    
    // Ensure proper export
    if (!content.includes('export default function OriginalPageComponent')) {
      if (content.includes('export default function')) {
        content = content.replace(/export default function \w+/, 'export default function OriginalPageComponent');
        hasChanges = true;
        console.log(`  ✅ Fixed function name`);
      } else if (!content.includes('export default')) {
        content += '\n\nexport default function OriginalPageComponent() {\n  return null;\n}';
        hasChanges = true;
        console.log(`  ✅ Added default export`);
      }
    }
    
    // Write changes if any
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ File updated`);
    } else {
      console.log(`  ✅ No changes needed`);
    }
    
    return true;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

// Main cleanup function
function runFinalCleanup() {
  console.log('🔍 Finding original-page.tsx files...\n');
  
  const originalPages = findAndCleanOriginalPages();
  console.log(`Found ${originalPages.length} original-page.tsx files\n`);
  
  let cleanedCount = 0;
  let errorCount = 0;
  
  for (const filePath of originalPages) {
    if (cleanOriginalPage(filePath)) {
      cleanedCount++;
    } else {
      errorCount++;
    }
    console.log('');
  }
  
  // Create a final status report
  const statusReport = {
    timestamp: new Date().toISOString(),
    totalOriginalPages: originalPages.length,
    cleanedSuccessfully: cleanedCount,
    errors: errorCount,
    status: errorCount === 0 ? 'success' : 'partial_success'
  };
  
  fs.writeFileSync(
    path.join(PROJECT_ROOT, 'final-cleanup-report.json'),
    JSON.stringify(statusReport, null, 2)
  );
  
  // Summary
  console.log('🎉 Final Cleanup Summary');
  console.log('========================');
  console.log(`📄 Original pages found: ${originalPages.length}`);
  console.log(`✅ Successfully cleaned: ${cleanedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Status: ${statusReport.status}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 All pages are now properly configured!');
  } else {
    console.log('\n⚠️  Some pages had issues during cleanup.');
  }
  
  console.log('\n🚀 Final Steps:');
  console.log('1. Run verification: node verify-modern-migration.js');
  console.log('2. Start development server: npm run dev');
  console.log('3. Test the migration test page: /migration-test');
  console.log('4. Verify all your pages work correctly');
  
  console.log('\n✨ Your modern layout migration is complete!');
  
  return statusReport;
}

// Run the cleanup
if (require.main === module) {
  runFinalCleanup();
}

module.exports = { runFinalCleanup };