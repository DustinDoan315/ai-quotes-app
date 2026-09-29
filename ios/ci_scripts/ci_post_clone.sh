#!/bin/bash
set -euo pipefail

SCRIPT_DIRECTORY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIRECTORY="$(cd -- "$SCRIPT_DIRECTORY/.." && pwd)"
REPOSITORY_ROOT="$(cd -- "$IOS_DIRECTORY/.." && pwd)"
BUN_VERSION="1.3.6"
NODE_TARBALL_SERIES="latest-v22.x"

# An Xcode Cloud workflow can track "Latest Release" or "Latest Beta", which moves
# the archive onto a newer toolchain without any commit to review. Xcode 27 beta
# broke this workflow twice: the iOS deployment target floor moved to 15.0, and
# RevenueCat 5.56.0 then failed to compile (PaywallColor.swift: "Invalid
# redeclaration of synthesized memberwise init(stringRepresentation:)"). Nothing in
# this dependency graph (Expo SDK 54 / React Native 0.81.5) supports it, so the
# workflow is pinned to a stable Xcode 26.x release. Raise this only once the
# dependencies are known to build on the newer toolchain.
MAX_SUPPORTED_XCODE_MAJOR=26

# Report the toolchain up front, and name the likely cause when the archive is
# running on something newer than this graph supports, rather than leaving the
# next failure to be diagnosed from a dependency's source file.
report_xcode_version() {
  local version build major

  version="$(xcodebuild -version 2>/dev/null | awk '/^Xcode/ { print $2; exit }' || true)"
  build="$(xcodebuild -version 2>/dev/null | awk '/^Build version/ { print $3; exit }' || true)"

  if [[ -z "$version" ]]; then
    echo "warning: could not determine the Xcode version." >&2
    return 0
  fi

  echo "Building with Xcode $version (${build:-unknown build})."

  major="${version%%.*}"
  if [[ "$major" =~ ^[0-9]+$ ]] && (( major > MAX_SUPPORTED_XCODE_MAJOR )); then
    echo "warning: Xcode $version is newer than the Xcode ${MAX_SUPPORTED_XCODE_MAJOR}.x this" >&2
    echo "warning: dependency graph is known to build with. A beta toolchain has already" >&2
    echo "warning: broken this workflow, and may again. If the archive fails below, pin the" >&2
    echo "warning: workflow to a stable Xcode ${MAX_SUPPORTED_XCODE_MAJOR}.x in App Store Connect:" >&2
    echo "warning: Xcode Cloud > Manage Workflows > Environment > Xcode Version." >&2
  fi
}

report_xcode_version

if ! command -v brew >/dev/null 2>&1; then
  for BREW_PATH in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    if [[ -x "$BREW_PATH" ]]; then
      eval "$("$BREW_PATH" shellenv)"
      break
    fi
  done
fi

# The Xcode Cloud images do not ship Node.js, and Homebrew cannot be relied on to
# provide it: `brew install node@20` has been observed ending in "No such keg" and
# leaving no `node` on PATH at all. The official tarball needs nothing from the
# image, only curl and tar.
install_node_from_tarball() {
  local arch tarball target

  case "$(uname -m)" in
    arm64) arch="arm64" ;;
    *) arch="x64" ;;
  esac

  tarball="$(curl -fsSL "https://nodejs.org/dist/$NODE_TARBALL_SERIES/SHASUMS256.txt" 2>/dev/null |
    awk -v suffix="darwin-$arch.tar.gz" '$2 ~ suffix { print $2; exit }')"

  if [[ -z "$tarball" ]]; then
    return 1
  fi

  target="$HOME/node"
  echo "Downloading $tarball from nodejs.org into $target."
  rm -rf "$target"
  mkdir -p "$target"

  if ! curl -fsSL "https://nodejs.org/dist/$NODE_TARBALL_SERIES/$tarball" |
    tar -xz -C "$target" --strip-components=1; then
    return 1
  fi

  export PATH="$target/bin:$PATH"
  return 0
}

# The toolchain needs Node 20.19.4 or newer (React Native 0.81 / Expo SDK 54).
node_is_compatible() {
  local candidate="${1:-}"

  if [[ -z "$candidate" ]] || [[ ! -x "$candidate" ]]; then
    return 1
  fi

  "$candidate" -e 'const [major, minor, patch] = process.versions.node.split(".").map(Number); process.exit(major > 20 || (major === 20 && (minor > 19 || (minor === 19 && patch >= 4))) ? 0 : 1);'
}

NODE_BINARY="$(command -v node 2>/dev/null || true)"

if ! node_is_compatible "$NODE_BINARY"; then
  echo "Node.js 20.19.4 or newer is required; this runner has '${NODE_BINARY:-no node}'."

  if command -v brew >/dev/null 2>&1; then
    echo "Trying Homebrew (node@20) first."
    if ! brew install node@20; then
      echo "warning: 'brew install node@20' failed; falling back to the official tarball." >&2
    fi

    BREW_NODE_PREFIX="$(brew --prefix node@20 2>/dev/null || true)"
    if [[ -n "$BREW_NODE_PREFIX" ]] && node_is_compatible "$BREW_NODE_PREFIX/bin/node"; then
      NODE_BINARY="$BREW_NODE_PREFIX/bin/node"
    fi
  else
    echo "Homebrew is not available on this runner."
  fi

  if ! node_is_compatible "$NODE_BINARY"; then
    if ! install_node_from_tarball; then
      echo "error: could not provision Node.js 20.19.4+ from Homebrew or nodejs.org." >&2
      exit 1
    fi

    NODE_BINARY="$(command -v node)"
  fi
fi

if ! node_is_compatible "$NODE_BINARY"; then
  echo "error: Node.js 20.19.4+ is still unavailable after provisioning." >&2
  exit 1
fi

export NODE_BINARY
export PATH="$(dirname "$NODE_BINARY"):$PATH"
echo "Using Node.js $($NODE_BINARY --version) from $NODE_BINARY."

# Xcode's script phases do not inherit this script's PATH, so record the resolved
# runtime for them. ios/.xcode.env sources this file, it is gitignored, and it has
# to be regenerated on every build.
echo "export NODE_BINARY=$NODE_BINARY" >"$IOS_DIRECTORY/.xcode.env.local"

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

LOCKED_COCOAPODS="$(sed -n 's/^COCOAPODS: //p' "$IOS_DIRECTORY/Podfile.lock" | tail -n 1)"
echo "Installing iOS dependencies with CocoaPods $(pod --version) (Podfile.lock records ${LOCKED_COCOAPODS:-unknown})."
cd "$IOS_DIRECTORY"

# `pod install --deployment` refuses to touch the lockfile, so it fails whenever
# ios/Podfile.lock was produced by a different CocoaPods version or is missing a
# freshly autolinked pod. Both have broken this workflow before, so try the strict
# install first and self-heal rather than blocking the archive.
if pod install --deployment; then
  echo "Podfile.lock matched; CocoaPods rewrote nothing."
else
  echo "warning: 'pod install --deployment' failed, so ios/Podfile.lock is out of" >&2
  echo "warning: sync with the Podfile or with CocoaPods ${LOCKED_COCOAPODS:-recorded in the lock}." >&2
  echo "warning: Retrying without --deployment so the archive can continue. Regenerate" >&2
  echo "warning: and commit ios/Podfile.lock to restore the strict check." >&2
  pod install
fi
