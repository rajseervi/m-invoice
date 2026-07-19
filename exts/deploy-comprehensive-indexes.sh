#!/bin/bash

# Deploy Comprehensive Firestore Indexes
# This script deploys all the indexes needed for the application

echo "🚀 Starting comprehensive Firestore indexes deployment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ You are not logged in to Firebase. Please login first:"
    echo "firebase login"
    exit 1
fi

# Get current project
PROJECT=$(firebase use --json | jq -r '.result.current // empty')
if [ -z "$PROJECT" ]; then
    echo "❌ No Firebase project selected. Please select a project first:"
    echo "firebase use <project-id>"
    exit 1
fi

echo "📋 Current Firebase project: $PROJECT"

# Validate firestore.indexes.json
if [ ! -f "firestore.indexes.json" ]; then
    echo "❌ firestore.indexes.json not found!"
    exit 1
fi

echo "✅ Found firestore.indexes.json"

# Check JSON syntax
if ! jq empty firestore.indexes.json 2>/dev/null; then
    echo "❌ Invalid JSON in firestore.indexes.json"
    exit 1
fi

echo "✅ JSON syntax is valid"

# Count indexes
TOTAL_INDEXES=$(jq '.indexes | length' firestore.indexes.json)
echo "📊 Total indexes to deploy: $TOTAL_INDEXES"

# Show collections that will have indexes
echo "📚 Collections with indexes:"
jq -r '.indexes[].collectionGroup' firestore.indexes.json | sort | uniq -c | sort -nr

echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "   • Index deployment can take several minutes"
echo "   • Some indexes may already exist and will be skipped"
echo "   • Failed indexes will be reported at the end"
echo "   • You can monitor progress in Firebase Console"
echo ""

read -p "🤔 Do you want to proceed with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo "🚀 Deploying Firestore indexes..."

# Deploy indexes
if firebase deploy --only firestore:indexes; then
    echo ""
    echo "✅ Index deployment completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Monitor index build progress in Firebase Console"
    echo "   2. Check for any failed indexes in the console"
    echo "   3. Test your application queries"
    echo ""
    echo "🔗 Firebase Console: https://console.firebase.google.com/project/$PROJECT/firestore/indexes"
else
    echo ""
    echo "❌ Index deployment failed!"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Check your Firebase project permissions"
    echo "   2. Verify firestore.indexes.json syntax"
    echo "   3. Check Firebase Console for error details"
    echo "   4. Try deploying individual indexes if needed"
    exit 1
fi

echo ""
echo "🎉 Comprehensive index deployment process completed!"
echo "📈 Your application should now have improved query performance."