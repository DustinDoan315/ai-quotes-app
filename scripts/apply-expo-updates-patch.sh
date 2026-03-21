#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PATCH="$ROOT/patches/expo-updates+0.26.19.patch"
TARGET="$ROOT/node_modules/expo-updates"
if [[ ! -f "$PATCH" ]] || [[ ! -d "$TARGET" ]]; then
  exit 0
fi
patch -d "$TARGET" -p1 -N --silent <"$PATCH" || true
