#!/usr/bin/env bash
# emulator.sh — Start Firebase emulators for local development
# Usage:
#   ./scripts/emulator.sh           — start all emulators
#   ./scripts/emulator.sh firestore — start Firestore emulator only
#   ./scripts/emulator.sh functions — start Functions + Firestore emulators

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

TARGET="${1:-all}"

case "$TARGET" in
  firestore)
    echo "[emulator] Starting Firestore emulator..."
    firebase emulators:start --only firestore
    ;;
  functions)
    echo "[emulator] Starting Functions + Firestore emulators..."
    firebase emulators:start --only functions,firestore
    ;;
  all)
    echo "[emulator] Starting all emulators..."
    firebase emulators:start
    ;;
  *)
    echo "Usage: ./scripts/emulator.sh [all|firestore|functions]"
    exit 1
    ;;
esac
