const fs = require('fs');
const path = require('path');

// List of files to migrate
const filesToMigrate = [
  '/Users/prakashseervi/Desktop/hanuam-kothur/src/app/accounting/journal/page.tsx',
  '/Users/prakashseervi/Desktop/hanuam-kothur/src/app/accounting/ledger/page.tsx',
  '/Users/prakashseervi/Desktop/hanuam-kothur/src/app/purchases/suppliers/new/page.tsx',
  '/Users/prakashseervi/Desktop/hanuam-kothur/src/app/invoices/create/page.tsx',
  '/Users/prakashseervi/Desktop/hanuam-kothur/src/app/reports/some-report/page.tsx',
  '/Users/prakashseervi/Desktop/hanuam-kothur/src/app/reports/data-quality/page.tsx'
];

function migrateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Create backup
    fs.writeFileSync(`${filePath}.migration-backup`, content);
    
    // Check if already has VisuallyEnhancedDashboardLayout wrapper
    const hasModernWrapper = content.includes('VisuallyEnhancedDashboardLayout') && 
                             content.includes('export default function Modern');
    
    if (hasModernWrapper) {
      // Just remove ImprovedDashboardLayout usage
      content = content.replace(/import.*ImprovedDashboardLayout.*;\n/g, '');
      content = content.replace(/<ImprovedDashboardLayout>/g, '<Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>');
      content = content.replace(/<\/ImprovedDashboardLayout>/g, '</Container>');
      
      // Add Container import if needed
      if (content.includes('<Container') && !content.includes('Container,')) {
        content = content.replace(
          'from \'@mui/material\';',
          ', Container} from \'@mui/material\';'
        );
        content = content.replace(
          '} from \'@mui/material\';',
          ', Container} from \'@mui/material\';'
        );
      }
      
    } else {
      // Add modern layout wrapper
      const filename = path.basename(filePath, '.tsx');
      const pageName = filename.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('');
      
      // Determine page type from path
      let pageType = 'dashboard';
      if (filePath.includes('accounting')) pageType = 'accounting';
      else if (filePath.includes('invoices')) pageType = 'invoice';
      else if (filePath.includes('purchases')) pageType = 'purchase';
      else if (filePath.includes('reports')) pageType = 'reports';
      else if (filePath.includes('products')) pageType = 'products';
      else if (filePath.includes('parties')) pageType = 'parties';
      
      // Get the original component name
      const componentMatch = content.match(/export default function (\w+)/);
      const originalComponentName = componentMatch ? componentMatch[1] : `${pageName}Page`;
      
      // Add imports at the beginning if not present
      if (!content.includes('VisuallyEnhancedDashboardLayout')) {
        const importInsert = `import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
`;
        // Insert after the "use client" directive or at the beginning
        if (content.includes('"use client"')) {
          content = content.replace('"use client";\n', `"use client";\n${importInsert}`);
        } else {
          content = importInsert + content;
        }
      }
      
      // Remove ImprovedDashboardLayout import
      content = content.replace(/import.*ImprovedDashboardLayout.*;\n/g, '');
      
      // Replace ImprovedDashboardLayout usage with Container
      content = content.replace(/<ImprovedDashboardLayout>/g, '<Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>');
      content = content.replace(/<\/ImprovedDashboardLayout>/g, '</Container>');
      
      // Add Container import if needed
      if (content.includes('<Container') && !content.includes('Container')) {
        if (content.includes('} from \'@mui/material\';')) {
          content = content.replace(
            '} from \'@mui/material\';',
            ', Container} from \'@mui/material\';'
          );
        } else {
          content = content.replace(
            'from \'@mui/material\';',
            ', Container} from \'@mui/material\';'
          );
        }
      }
      
      // Rename the export function and add wrapper
      content = content.replace(
        new RegExp(`export default function ${originalComponentName}`),
        `function ${originalComponentName}`
      );
      
      // Add the modern wrapper at the end
      content += `

export default function Modern${pageName}Page() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="${pageName.replace(/([A-Z])/g, ' $1').trim()}"
        pageType="${pageType}"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <${originalComponentName} />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}`;
    }
    
    // Write the updated content
    fs.writeFileSync(filePath, content);
    console.log(`✅ Migrated: ${filePath}`);
    return true;
    
  } catch (error) {
    console.log(`❌ Error migrating ${filePath}:`, error.message);
    return false;
  }
}

// Migrate all files
console.log('🚀 Starting Quick Layout Migration...\n');

let successCount = 0;
let totalCount = filesToMigrate.length;

filesToMigrate.forEach(filePath => {
  if (migrateFile(filePath)) {
    successCount++;
  }
});

console.log(`\n🎉 Migration Complete!`);
console.log(`📊 Success: ${successCount}/${totalCount} files migrated`);
console.log(`💾 Backup files created with .migration-backup extension`);
console.log(`\n🧪 Test your application and remove backup files when satisfied.`);