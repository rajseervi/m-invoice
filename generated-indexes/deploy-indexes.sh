#!/bin/bash
# Deploy all generated indexes to Firebase

echo "🚀 Deploying Firestore indexes..."

# Copy generated indexes to project root
cp /Users/prakashseervi/Desktop/Projecct for client/webinvoice/generated-indexes/firestore.indexes.json ../firestore.indexes.json

# Deploy indexes
firebase deploy --only firestore:indexes

echo "✅ Indexes deployed successfully!"

# Optional: Deploy rules as well
read -p "Do you want to deploy Firestore rules as well? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    firebase deploy --only firestore:rules
    echo "✅ Rules deployed successfully!"
fi
