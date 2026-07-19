#!/usr/bin/env bash
# Deploy Firestore indexes non-interactively using Firebase CLI token
# NOTE: The firebaseConfig.apiKey (web SDK key) CANNOT deploy indexes.
# Use a Firebase CLI CI token instead.
#
# Usage:
#   FIREBASE_TOKEN="<cli-token>" PROJECT_ID="<your-project-id>" ./deploy-indexes-ci.sh
# Optional:
#   INDEXES_FILE="firestore.indexes.json" ./deploy-indexes-ci.sh
#
# Get a token:
#   1) Login locally: firebase login
#   2) Create CI token: firebase login:ci
#   3) Use that token in your CI as FIREBASE_TOKEN

set -euo pipefail

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
NC="\033[0m"

INDEXES_FILE=${INDEXES_FILE:-firestore.indexes.json}

echo -e "🚀 ${YELLOW}Deploying Firestore Indexes (CI)${NC}"
echo "====================================="

# Clear message if user mistakenly tries to use the web API key
if [[ -n "${FIREBASE_API_KEY:-}" ]]; then
  echo -e "${RED}The Web API key (firebaseConfig.apiKey) cannot deploy indexes.${NC}"
  echo "Please provide a Firebase CLI token via FIREBASE_TOKEN."
  exit 1
fi

# Check Firebase CLI
if ! command -v firebase >/dev/null 2>&1; then
  echo -e "${RED}❌ Firebase CLI is not installed!${NC}"
  echo "Install: npm install -g firebase-tools"
  exit 1
fi

# Required env vars
if [[ -z "${FIREBASE_TOKEN:-}" ]]; then
  echo -e "${RED}❌ FIREBASE_TOKEN is not set.${NC}"
  echo "Set it and re-run. Example: FIREBASE_TOKEN=... PROJECT_ID=... ./deploy-indexes-ci.sh"
  exit 1
fi

if [[ -z "${PROJECT_ID:-}" ]]; then
  echo -e "${RED}❌ PROJECT_ID is not set.${NC}"
  echo "Set it to your Firebase project ID."
  exit 1
fi

# Check required files
if [[ ! -f "firebase.json" ]]; then
  echo -e "${RED}❌ firebase.json not found in project root.${NC}"
  exit 1
fi

if [[ ! -f "$INDEXES_FILE" ]]; then
  echo -e "${RED}❌ $INDEXES_FILE not found.${NC}"
  echo "Make sure your Firestore indexes file exists."
  exit 1
fi

echo "📋 Target Firebase project: $PROJECT_ID"

echo "🔍 Validating $INDEXES_FILE..."
if python3 -m json.tool "$INDEXES_FILE" >/dev/null 2>&1; then
  echo -e "${GREEN}✅ JSON file is valid${NC}"
elif node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$INDEXES_FILE" >/dev/null 2>&1; then
  echo -e "${GREEN}✅ JSON file is valid${NC}"
else
  echo -e "${RED}❌ Invalid JSON in $INDEXES_FILE${NC}"
  exit 1
fi

# Count indexes (simple heuristic)
INDEX_COUNT=$(grep -c '"collectionGroup"' "$INDEXES_FILE" || true)
echo -e "${GREEN}✅ Found $INDEX_COUNT indexes to deploy${NC}"

echo "🚀 Deploying Firestore indexes to $PROJECT_ID ..."
# Use --token and --project to avoid interactive login/selection
if firebase deploy --only firestore:indexes --project "$PROJECT_ID" --token "$FIREBASE_TOKEN"; then
  echo -e "${GREEN}\n✅ Firestore indexes deploy initiated successfully!${NC}"
  echo "📝 Next steps:"
  echo "1) Wait for indexes to build (10–30 minutes typically)."
  echo "2) Check status: https://console.firebase.google.com/project/$PROJECT_ID/firestore/indexes"
  echo "3) You can list indexes with: firebase firestore:indexes --project $PROJECT_ID --token \"$FIREBASE_TOKEN\""
else
  echo -e "${RED}\n❌ Failed to deploy indexes.${NC}"
  exit 1
fi

echo -e "${GREEN}🎉 Done.${NC}"