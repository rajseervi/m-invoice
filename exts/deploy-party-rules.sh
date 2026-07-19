#!/bin/bash

echo "🚀 Deploying Party Management Firestore Rules..."

# Deploy the updated Firestore rules
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Firestore rules deployed successfully!"
    echo "🎉 Party Management system is now fully configured!"
    echo ""
    echo "📍 Next steps:"
    echo "1. Navigate to http://localhost:3000/parties"
    echo "2. Test the party management functionality"
    echo "3. Create your first party"
    echo ""
    echo "🔗 Features available:"
    echo "   ✓ Add/Edit/Delete Parties"
    echo "   ✓ Search & Filter"
    echo "   ✓ Bulk Operations"
    echo "   ✓ Statistics Dashboard"
    echo "   ✓ Import/Export"
    echo "   ✓ Financial Tracking"
else
    echo "❌ Failed to deploy Firestore rules"
    echo "Please check your Firebase configuration and try again"
    exit 1
fi