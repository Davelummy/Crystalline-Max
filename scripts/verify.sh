#!/usr/bin/env bash
# verify.sh — Crystalline Max full verification suite
# Usage:
#   ./scripts/verify.sh           — run all checks
#   ./scripts/verify.sh lint      — lint only
#   ./scripts/verify.sh build     — type-check + build only
#   ./scripts/verify.sh test      — unit tests only
#   ./scripts/verify.sh rules     — Firestore rules tests only
#   ./scripts/verify.sh functions — functions tests only (if configured)
#   ./scripts/verify.sh e2e       — Playwright E2E only

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0
FAIL=0
SKIP=0

log()  { echo -e "\n${CYAN}${BOLD}[$1]${NC} $2"; }
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}  ✗ $1${NC}"; FAIL=$((FAIL+1)); }
skip() { echo -e "${YELLOW}  — $1 (skipped)${NC}"; SKIP=$((SKIP+1)); }

run_step() {
  local name="$1"
  shift
  if "$@"; then
    ok "$name"
  else
    fail "$name"
  fi
}

summary() {
  echo ""
  echo -e "${BOLD}── Verification Summary ──────────────────────${NC}"
  echo -e "${GREEN}  Passed: $PASS${NC}"
  if [[ $FAIL -gt 0 ]]; then
    echo -e "${RED}  Failed: $FAIL${NC}"
  fi
  if [[ $SKIP -gt 0 ]]; then
    echo -e "${YELLOW}  Skipped: $SKIP${NC}"
  fi
  echo -e "${BOLD}──────────────────────────────────────────────${NC}"
  [[ $FAIL -eq 0 ]]
}

do_lint() {
  log "LINT" "Running ESLint..."
  run_step "ESLint" npm run lint -- --max-warnings 0 2>/dev/null || \
  run_step "ESLint (with warnings)" npm run lint
}

do_build() {
  log "BUILD" "Type-checking and building frontend..."
  run_step "TypeScript + Vite build" npm run build
}

do_test() {
  log "UNIT TESTS" "Running Vitest..."
  if grep -q '"test"' package.json 2>/dev/null; then
    run_step "Vitest unit tests" npm test -- --run
  else
    skip "No test script in package.json"
  fi
}

do_rules() {
  log "RULES TESTS" "Running Firestore emulator rules tests..."
  if grep -q '"test:emulator"' package.json 2>/dev/null; then
    run_step "Firestore rules tests" npm run test:emulator
  else
    skip "test:emulator not configured"
  fi
}

do_functions() {
  log "FUNCTIONS TESTS" "Running Cloud Functions unit tests..."
  if grep -q '"test"' functions/package.json 2>/dev/null; then
    run_step "Functions unit tests" (cd functions && npm test -- --run)
  else
    skip "Functions test script not configured"
  fi
}

do_e2e() {
  log "E2E" "Running Playwright E2E tests..."
  if command -v npx &>/dev/null && npx playwright --version &>/dev/null 2>&1; then
    run_step "Playwright E2E" npx playwright test
  else
    skip "Playwright not installed"
  fi
}

TARGETS=("${@:-all}")

if [[ " ${TARGETS[*]} " =~ " all " ]] || [[ "${TARGETS[0]}" == "all" ]]; then
  TARGETS=("lint" "build" "test" "rules" "functions")
fi

for TARGET in "${TARGETS[@]}"; do
  case "$TARGET" in
    lint)      do_lint ;;
    build)     do_build ;;
    test)      do_test ;;
    rules)     do_rules ;;
    functions) do_functions ;;
    e2e)       do_e2e ;;
    all)       ;; # already expanded
    *) echo -e "${RED}Unknown target: $TARGET${NC}"; exit 1 ;;
  esac
done

summary
