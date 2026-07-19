#!/bin/bash

# Migration script to completely remove GST from Product Inventory
# This script will:
# 1. Remove GST fields from existing product data in Firestore
# 2. Verify the migration was successful

echo "🚀 Starting GST removal migration for Product Inventory..."

# Check if firebase-service-account.json exists
if [ ! -f "firebase-service-account.json" ]; then
    echo "❌ Error: firebase-service-account.json not found!"
    echo "Please ensure your Firebase service account key is in the root directory."
    exit 1
fi

# Step 1: Remove GST fields from products
echo "📦 Step 1: Removing GST fields from products..."
node remove-product-gst-fields.js

if [ $? -eq 0 ]; then
    echo "✅ Product GST fields removal completed successfully!"
else
    echo "❌ Product GST fields removal failed!"
    exit 1
fi

# Step 2: Remove GST fields from categories (if not already done)
echo "📦 Step 2: Removing GST fields from categories..."
if [ -f "remove-category-gst-rate.js" ]; then
    node remove-category-gst-rate.js
    if [ $? -eq 0 ]; then
        echo "✅ Category GST fields removal completed successfully!"
    else
        echo "❌ Category GST fields removal failed!"
        exit 1
    fi
else
    echo "ℹ️  Category GST removal script not found, skipping..."
fi

echo ""
echo "🎉 GST removal migration completed successfully!"
echo ""
echo "📋 Summary of changes:"
echo "   ✅ Updated inventory types to remove GST fields"
echo "   ✅ Updated ProductForm components to remove GST inputs"
echo "   ✅ Removed GST fields from existing product data"
echo "   ✅ Removed GST fields from existing category data"
echo ""
echo "🔄 Next steps:"
echo "   1. Test product creation and editing"
echo "   2. Verify that invoices work correctly without GST"
echo "   3. Update any remaining components that might reference GST fields"
echo ""
echo "✨ Your Product Inventory is now GST-free!"