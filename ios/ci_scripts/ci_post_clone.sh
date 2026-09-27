#!/bin/bash
set -euo pipefail

SCRIPT_DIRECTORY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIRECTORY="$(cd -- "$SCRIPT_DIRECTORY/.." && pwd)"
REPOSITORY_ROOT="$(cd -- "$IOS_DIRECTORY/.." && pwd)"
BUN_VERSION="1.3.6"

if ! command -v node >/dev/null 2>&1; then
  echo "error: Node.js is required to install the Expo and React Native dependencies." >&2
  exit 1
fi

export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
export PATH="$BUN_INSTALL/bin:$PATH"

if ! command -v bun >/dev/null 2>&1 || [[ "$(bun --version)" != "$BUN_VERSION" ]]; then
  curl -fsSL https://bun.com/install | bash -s "bun-v$BUN_VERSION"
fi

if ! command -v pod >/dev/null 2>&1; then
  echo "error: CocoaPods is required to generate the Xcode support files." >&2
  exit 1
fi

echo "Installing JavaScript dependencies with Bun $(bun --version)."
cd "$REPOSITORY_ROOT"
bun install --frozen-lockfile

echo "Installing iOS dependencies with CocoaPods $(pod --version)."
cd "$IOS_DIRECTORY"
pod install --deployment
