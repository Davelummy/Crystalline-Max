#!/usr/bin/env bash
# deploy.sh — Crystalline Max deployment script
# Usage:
#   ./scripts/deploy.sh rules          — deploy Firestore + Storage rules only
#   ./scripts/deploy.sh functions      — build + deploy Cloud Functions only
#   ./scripts/deploy.sh hosting        — build frontend + deploy to Netlify
#   ./scripts/deploy.sh all            — rules + functions + hosting in sequence
#   ./scripts/deploy.sh rules functions — combine any targets

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[deploy]${NC} $1"; }
ok()   { echo -e "${GREEN}[done]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
fail() { echo -e "${RED}[error]${NC} $1"; exit 1; }

if [[ $# -eq 0 ]]; then
  echo "Usage: ./scripts/deploy.sh [rules|functions|hosting|all] ..."
  echo ""
  echo "  rules      Deploy firestore.rules and storage.rules"
  echo "  functions  Build and deploy Cloud Functions"
  echo "  hosting    Build frontend and deploy to Netlify (production)"
  echo "  all        Run rules + functions + hosting"
  exit 0
fi

deploy_rules() {
  log "Deploying Firestore and Storage rules..."
  firebase deploy --only firestore:rules,storage --project "$(cat .firebaserc | grep '"default"' | awk -F'"' '{print $4}')"
  ok "Rules deployed."
}

deploy_functions() {
  log "Building Cloud Functions..."
  (cd functions && npm run build)
  log "Deploying Cloud Functions..."
  firebase deploy --only functions --project "$(cat .firebaserc | grep '"default"' | awk -F'"' '{print $4}')"
  ok "Functions deployed."
}

deploy_hosting() {
  log "Building frontend..."
  npm run build
  log "Deploying to Netlify (production)..."

  SITE_ID=""
  if [[ -f ".netlify/state.json" ]]; then
    SITE_ID=$(cat .netlify/state.json | grep '"siteId"' | awk -F'"' '{print $4}')
  fi

  if [[ -n "$SITE_ID" ]]; then
    netlify deploy --prod --dir dist --site "$SITE_ID"
  else
    warn "No .netlify/state.json found. Running netlify deploy without --site flag."
    warn "If this fails, run: netlify link"
    netlify deploy --prod --dir dist
  fi
  ok "Hosting deployed."
}

TARGETS=("$@")
if [[ " ${TARGETS[*]} " =~ " all " ]]; then
  TARGETS=("rules" "functions" "hosting")
fi

for TARGET in "${TARGETS[@]}"; do
  case "$TARGET" in
    rules)    deploy_rules ;;
    functions) deploy_functions ;;
    hosting)  deploy_hosting ;;
    all)      ;; # already expanded above
    *) fail "Unknown target: $TARGET. Valid targets: rules, functions, hosting, all" ;;
  esac
done
