#!/bin/bash

# Fix layout imports across all TypeScript files
echo "Fixing layout imports..."

# Find all .tsx files and fix the imports
find src/app -name "*.tsx" -type f | while read file; do
    echo "Processing: $file"
    
    # Fix the import statements
    sed -i.bak 's|import.*DashboardLayout.*from.*@/components/DashboardLayout/ImprovedDashboardLayout.*|import Layout from '\''../components/Layout/Layout'\'';|g' "$file"
    sed -i.bak 's|import.*ModernDashboardLayout.*from.*@/components/ModernLayout/ModernDashboardLayout.*||g' "$file"
    
    # Fix the component usage
    sed -i.bak 's|<ImprovedDashboardLayout>|<Layout>|g' "$file"
    sed -i.bak 's|</ImprovedDashboardLayout>|</Layout>|g' "$file"
    sed -i.bak 's|<ModernDashboardLayout[^>]*>|<Layout>|g' "$file"
    sed -i.bak 's|</ModernDashboardLayout>|</Layout>|g' "$file"
    
    # Remove backup files
    rm -f "$file.bak"
done

echo "Layout imports fixed!"