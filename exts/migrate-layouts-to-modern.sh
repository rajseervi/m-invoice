#!/bin/bash

# Script to migrate all ImprovedDashboardLayout to VisuallyEnhancedDashboardLayout

echo "🚀 Starting Layout Migration to VisuallyEnhancedDashboardLayout..."

# Find all TypeScript/TSX files that contain ImprovedDashboardLayout
files=$(find /Users/prakashseervi/Desktop/hanuam-kothur/src/app -name "*.tsx" -o -name "*.ts" | xargs grep -l "ImprovedDashboardLayout" 2>/dev/null | grep -v "backup" | grep -v "original")

count=0
for file in $files; do
    echo "📄 Processing: $file"
    
    # Skip if file doesn't exist
    if [[ ! -f "$file" ]]; then
        continue
    fi
    
    # Create backup
    cp "$file" "${file}.migration-backup"
    
    # Check if file already has VisuallyEnhancedDashboardLayout wrapper
    if grep -q "VisuallyEnhancedDashboardLayout" "$file"; then
        echo "  ✨ File already has modern layout wrapper"
        
        # Just remove ImprovedDashboardLayout import and usage
        sed -i '' 's/import ImprovedDashboardLayout.*;//g' "$file"
        sed -i '' 's/<ImprovedDashboardLayout>//g' "$file"
        sed -i '' 's/<\/ImprovedDashboardLayout>//g' "$file"
        
        # Clean up any double spaces or empty lines left by removals
        sed -i '' '/^[[:space:]]*$/d' "$file"
        
    else
        echo "  🔄 Adding VisuallyEnhancedDashboardLayout wrapper"
        
        # Add imports at the top
        sed -i '' '1i\
import { VisuallyEnhancedDashboardLayout } from '\''@/components/ModernLayout'\'';
import ModernThemeProvider from '\''@/contexts/ModernThemeContext'\'';
' "$file"
        
        # Remove ImprovedDashboardLayout import
        sed -i '' 's/import ImprovedDashboardLayout.*;//g' "$file"
        
        # Replace ImprovedDashboardLayout usage with Container
        sed -i '' 's/<ImprovedDashboardLayout>/<Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>/g' "$file"
        sed -i '' 's/<\/ImprovedDashboardLayout>/<\/Container>/g' "$file"
        
        # Determine page type based on file path
        pageType="dashboard"
        if [[ "$file" =~ products ]]; then
            pageType="product"
        elif [[ "$file" =~ invoices ]]; then
            pageType="invoice"
        elif [[ "$file" =~ orders ]]; then
            pageType="order"
        elif [[ "$file" =~ parties ]]; then
            pageType="party"
        elif [[ "$file" =~ purchases ]]; then
            pageType="purchase"
        elif [[ "$file" =~ reports ]]; then
            pageType="reports"
        elif [[ "$file" =~ settings ]]; then
            pageType="settings"
        elif [[ "$file" =~ inventory ]]; then
            pageType="inventory"
        elif [[ "$file" =~ accounting ]]; then
            pageType="accounting"
        fi
        
        # Get filename for title
        filename=$(basename "$file" .tsx)
        title=$(echo "$filename" | sed 's/-/ /g' | sed 's/\b\w/\U&/g')
        
        # Create the wrapper export function
        cat >> "$file" << EOF

export default function Modern${title}Page() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="$title"
        pageType="$pageType"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <$(grep -o 'function [A-Za-z]*' "$file" | head -1 | cut -d' ' -f2) />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}
EOF
    fi
    
    count=$((count + 1))
    echo "  ✅ Processed successfully"
done

echo ""
echo "🎉 Migration Complete!"
echo "📊 Total files processed: $count"
echo "💾 Backup files created with .migration-backup extension"
echo ""
echo "🧪 Test the application and run:"
echo "   find . -name '*.migration-backup' -delete"
echo "   to remove backup files when satisfied."