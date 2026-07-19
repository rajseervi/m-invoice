#!/usr/bin/env node

/**
 * Layout Migration Script
 * 
 * This script automatically migrates pages from old layouts to VisuallyEnhancedDashboardLayout
 */

const fs = require('fs');
const path = require('path');

// Configuration
const APP_DIR = './src/app';
const BACKUP_SUFFIX = '.layout-backup';

// Page configurations
const pageConfigurations = {
  '/purchases': { pageType: 'orders', title: 'Purchases' },
  '/categories': { pageType: 'products', title: 'Categories' },
  '/profile': { pageType: 'dashboard', title: 'Profile' },
  '/inventory': { pageType: 'products', title: 'Inventory' },
  '/stock-management': { pageType: 'products', title: 'Stock Management' },
  '/ledger': { pageType: 'reports', title: 'Ledger' },
  '/accounting': { pageType: 'reports', title: 'Accounting' },
  '/help-desk': { pageType: 'dashboard', title: 'Help Desk' },
  '/quick-links': { pageType: 'dashboard', title: 'Quick Links' },
  '/pending-approval': { pageType: 'dashboard', title: 'Pending Approvals' },
};

// Old layout patterns to replace
const oldLayoutPatterns = [
  {
    import: /import\s+ModernDashboardLayout\s+from\s+['"][^'"]+['"];?/g,
    newImport: "import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';"
  },
  {
    import: /import\s+EnhancedModernDashboardLayout\s+from\s+['"][^'"]+['"];?/g,
    newImport: "import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';"
  },
  {
    import: /import\s+ImprovedDashboardLayout\s+from\s+['"][^'"]+['"];?/g,
    newImport: "import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';"
  }
];

// Layout usage patterns
const layoutUsagePatterns = [
  {
    old: /<ModernDashboardLayout([^>]*)>/g,
    new: '<VisuallyEnhancedDashboardLayout$1>'
  },
  {
    old: /<\/ModernDashboardLayout>/g,
    new: '</VisuallyEnhancedDashboardLayout>'
  },
  {
    old: /<EnhancedModernDashboardLayout([^>]*)>/g,
    new: '<VisuallyEnhancedDashboardLayout$1>'
  },
  {
    old: /<\/EnhancedModernDashboardLayout>/g,
    new: '</VisuallyEnhancedDashboardLayout>'
  }
];

/**
 * Get all page.tsx files recursively
 */
function getAllPageFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      getAllPageFiles(fullPath, files);
    } else if (item === 'page.tsx') {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Get page configuration based on file path
 */
function getPageConfig(filePath) {
  const relativePath = filePath.replace(APP_DIR, '').replace('/page.tsx', '');
  const route = relativePath || '/';
  
  if (pageConfigurations[route]) {
    return pageConfigurations[route];
  }
  
  // Try to infer from path
  const segments = route.split('/').filter(Boolean);
  if (segments.length > 0) {
    const baseSegment = segments[0];
    
    switch (baseSegment) {
      case 'products':
      case 'categories':
      case 'inventory':
      case 'stock-management':
        return { pageType: 'products', title: baseSegment.charAt(0).toUpperCase() + baseSegment.slice(1) };
      case 'invoices':
        return { pageType: 'invoices', title: 'Invoices' };
      case 'orders':
      case 'purchases':
        return { pageType: 'orders', title: baseSegment.charAt(0).toUpperCase() + baseSegment.slice(1) };
      case 'parties':
        return { pageType: 'parties', title: 'Parties' };
      case 'reports':
      case 'ledger':
      case 'accounting':
        return { pageType: 'reports', title: baseSegment.charAt(0).toUpperCase() + baseSegment.slice(1) };
      default:
        return { pageType: 'dashboard', title: baseSegment.charAt(0).toUpperCase() + baseSegment.slice(1) };
    }
  }
  
  return { pageType: 'dashboard', title: 'Dashboard' };
}

/**
 * Migrate a single file
 */
function migrateFile(filePath) {
  console.log(`Migrating: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if file needs migration
  const needsMigration = oldLayoutPatterns.some(pattern => 
    pattern.import.test(content)
  );
  
  if (!needsMigration) {
    console.log(`  ✓ Already using modern layout or no layout found`);
    return;
  }
  
  // Create backup
  const backupPath = filePath + BACKUP_SUFFIX;
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, content);
    console.log(`  📁 Backup created: ${backupPath}`);
  }
  
  // Replace imports
  oldLayoutPatterns.forEach(pattern => {
    if (pattern.import.test(content)) {
      content = content.replace(pattern.import, pattern.newImport);
      modified = true;
      console.log(`  🔄 Updated import`);
    }
  });
  
  // Replace layout usage
  layoutUsagePatterns.forEach(pattern => {
    if (pattern.old.test(content)) {
      content = content.replace(pattern.old, pattern.new);
      modified = true;
      console.log(`  🔄 Updated layout usage`);
    }
  });
  
  // Update props if needed
  const config = getPageConfig(filePath);
  
  // Look for layout props and update them
  const layoutPropsRegex = /<VisuallyEnhancedDashboardLayout([^>]*?)>/g;
  content = content.replace(layoutPropsRegex, (match, props) => {
    // Check if already has the new props
    if (props.includes('pageType=') && props.includes('enableVisualEffects=')) {
      return match;
    }
    
    // Extract existing title if present
    const titleMatch = props.match(/title=["']([^"']+)["']/);
    const title = titleMatch ? titleMatch[1] : config.title;
    
    // Build new props
    const newProps = `
      title="${title}"
      pageType="${config.pageType}"
      enableVisualEffects={true}
      enableParticles={false}
    `;
    
    console.log(`  🎨 Updated layout props`);
    modified = true;
    
    return `<VisuallyEnhancedDashboardLayout${newProps}>`;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Migration completed`);
  } else {
    console.log(`  ℹ️  No changes needed`);
  }
}

/**
 * Main migration function
 */
function main() {
  console.log('🚀 Starting layout migration...\n');
  
  if (!fs.existsSync(APP_DIR)) {
    console.error(`❌ App directory not found: ${APP_DIR}`);
    process.exit(1);
  }
  
  const pageFiles = getAllPageFiles(APP_DIR);
  console.log(`📄 Found ${pageFiles.length} page files\n`);
  
  let migratedCount = 0;
  
  pageFiles.forEach(filePath => {
    try {
      migrateFile(filePath);
      migratedCount++;
    } catch (error) {
      console.error(`❌ Error migrating ${filePath}:`, error.message);
    }
    console.log(''); // Empty line for readability
  });
  
  console.log(`🎉 Migration completed!`);
  console.log(`📊 Processed: ${migratedCount}/${pageFiles.length} files`);
  console.log(`💾 Backups created with suffix: ${BACKUP_SUFFIX}`);
  
  // Show summary of what was migrated
  console.log('\n📋 Summary of migrated pages:');
  pageFiles.forEach(filePath => {
    const config = getPageConfig(filePath);
    const route = filePath.replace(APP_DIR, '').replace('/page.tsx', '') || '/';
    console.log(`  ${route} → ${config.pageType} (${config.title})`);
  });
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { migrateFile, getPageConfig, getAllPageFiles };