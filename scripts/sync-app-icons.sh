#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/assets/images/icon.png"
PLAY="$ROOT/store-assets/playstore.png"
MONO="$ROOT/store-assets/android-icon-monochrome.png"
DEST="$ROOT/assets/images"
STORE="$ROOT/store-assets"

if [[ ! -f "$SRC" ]]; then
  echo "Missing $SRC — add assets/images/icon.png (1024×1024 PNG recommended)."
  exit 1
fi

W=$(sips -g pixelWidth "$SRC" 2>/dev/null | awk '/pixelWidth/ {print $2}')
H=$(sips -g pixelHeight "$SRC" 2>/dev/null | awk '/pixelHeight/ {print $2}')
if [[ "${W:-}" != "1024" || "${H:-}" != "1024" ]]; then
  echo "Warning: assets/images/icon.png should be 1024×1024 for Expo (got ${W:-?}×${H:-?})."
fi

mkdir -p "$DEST"
cp "$SRC" "$DEST/android-icon-foreground.png"
cp "$SRC" "$DEST/splash-icon.png"
sips -z 48 48 "$SRC" --out "$DEST/favicon.png" >/dev/null
if [[ -f "$MONO" ]]; then
  cp "$MONO" "$DEST/android-icon-monochrome.png"
else
  echo "Note: Optional $MONO not found — left assets/images/android-icon-monochrome.png unchanged."
fi

mkdir -p "$STORE"
cp "$SRC" "$STORE/app-store-icon-1024.png"
if [[ -f "$PLAY" ]]; then
  cp "$PLAY" "$STORE/google-play-icon-512.png"
  PW=$(sips -g pixelWidth "$PLAY" 2>/dev/null | awk '/pixelWidth/ {print $2}')
  PH=$(sips -g pixelHeight "$PLAY" 2>/dev/null | awk '/pixelHeight/ {print $2}')
  if [[ "${PW:-}" != "512" || "${PH:-}" != "512" ]]; then
    echo "Warning: store-assets/playstore.png is usually 512×512 for Play high-res icon (got ${PW:-?}×${PH:-?})."
  fi
else
  echo "Note: Optional $PLAY not found — left store-assets/google-play-icon-512.png unchanged (if present)."
fi

echo "Synced icons into $DEST and $STORE. Rebuild native apps (EAS or expo run) to see launcher changes."
