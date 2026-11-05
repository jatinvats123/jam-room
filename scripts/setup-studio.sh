#!/usr/bin/env bash
# Jam Room studio setup (macOS / Linux).
# Usage: ./scripts/setup-studio.sh [target-dir]     (default: ~/jam-studio)
#
# Copies studio-kit/ into the target folder, runs npm install, and makes it a git repo.
# Safe to re-run: kit files (STUDIO.md, starter/, tools/, package.json) are refreshed,
# while games/ and the generated arcade index.html are never overwritten.
set -euo pipefail

TARGET="${1:-$HOME/jam-studio}"
KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/studio-kit"
[ -f "$KIT/STUDIO.md" ] || { echo "studio-kit not found at $KIT" >&2; exit 1; }
for cmd in node npm git; do
  command -v "$cmd" >/dev/null || { echo "$cmd is not installed or not on PATH." >&2; exit 1; }
done
major="$(node -v | sed 's/^v//; s/\..*//')"
[ "$major" -ge 20 ] || { echo "Node 20+ is required (found $(node -v))." >&2; exit 1; }

echo "Jam Room studio -> $TARGET"
mkdir -p "$TARGET/games"

# Kit-owned files: always refreshed from the kit.
cp "$KIT/STUDIO.md" "$KIT/package.json" "$KIT/.gitignore" "$KIT/.gitattributes" "$TARGET/"
for dir in starter tools; do
  rm -rf "${TARGET:?}/$dir"
  cp -R "$KIT/$dir" "$TARGET/$dir"
done
[ -f "$TARGET/games/.gitkeep" ] || touch "$TARGET/games/.gitkeep"

cd "$TARGET"
echo "Installing packages..."
npm install --no-fund --no-audit --loglevel=error
node tools/build-arcade.mjs

if [ ! -d .git ]; then
  git init -q -b main 2>/dev/null || { git init -q && git checkout -q -b main; }
fi
if [ -z "$(git config user.email || true)" ]; then
  git config user.name "Jam Room"
  git config user.email "jam-room@localhost"
fi
git add -A
if git diff --cached --quiet; then
  echo "Studio already up to date."
else
  if git rev-parse --verify -q HEAD >/dev/null; then msg="update studio kit"; else msg="studio setup"; fi
  git commit -q -m "$msg"
  echo "Committed: $msg"
fi

echo
echo "Studio ready."
echo "Next steps:"
echo "  1. cd \"$TARGET\""
echo "  2. npm run serve            (arcade at http://localhost:8080/)"
echo "  3. Point your three Switch agents at this folder (see the README)."
