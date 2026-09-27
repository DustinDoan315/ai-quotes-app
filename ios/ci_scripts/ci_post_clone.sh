#!/bin/bash
set -euo pipefail

SCRIPT_DIRECTORY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIRECTORY="$(cd -- "$SCRIPT_DIRECTORY/.." && pwd)"
REPOSITORY_ROOT="$(cd -- "$IOS_DIRECTORY/.." && pwd)"
BUN_VERSION="1.3.6"

if ! command -v brew >/dev/null 2>&1; then
  for BREW_PATH in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    if [[ -x "$BREW_PATH" ]]; then
      eval "$("$BREW_PATH" shellenv)"
      break
    fi
  done
fi

NODE_BINARY="$(command -v node 2>/dev/null || true)"
NODE_VERSION_OK=0
if [[ -n "$NODE_BINARY" ]] && "$NODE_BINARY" -e 'const [major, minor, patch] = process.versions.node.split(".").map(Number); process.exit(major > 20 || (major === 20 && (minor > 19 || (minor === 19 && patch >= 4))) ? 0 : 1);'; then
  NODE_VERSION_OK=1
fi

if [[ "$NODE_VERSION_OK" -ne 1 ]]; then
  if ! command -v brew >/dev/null 2>&1; then
    echo "error: Homebrew is required to install a compatible Node.js runtime." >&2
    exit 1
  fi

  echo "Installing Node.js 20 for the Expo and React Native toolchain."
  brew install node@20
  NODE_BINARY="$(brew --prefix node@20)/bin/node"
fi

if [[ ! -x "$NODE_BINARY" ]]; then
  echo "error: Node.js was not found after installation at $NODE_BINARY." >&2
  exit 1
fi

export NODE_BINARY
export PATH="$(dirname "$NODE_BINARY"):$PATH"
echo "Using Node.js $($NODE_BINARY --version) from $NODE_BINARY."

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
