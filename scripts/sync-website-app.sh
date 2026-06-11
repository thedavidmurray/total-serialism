#!/usr/bin/env bash
# Sync the runtime app files into the edgelesslab.com website checkout.
#
# Usage:
#   ./scripts/sync-website-app.sh /path/to/edgeless-website
#
# Copies only what the app needs at runtime into
# <website>/public/total-serialism/app/ — no planning docs, tests,
# backups, or node_modules. Next.js copies public/ into out/ at build
# time, so the app ships on the next site deploy.
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 /path/to/edgeless-website" >&2
  exit 1
fi

WEBSITE_ROOT="$1"
DEST="$WEBSITE_ROOT/public/total-serialism/app"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -d "$WEBSITE_ROOT/public" ]; then
  echo "error: $WEBSITE_ROOT does not look like the website repo (no public/)" >&2
  exit 1
fi

mkdir -p "$DEST"

rsync -a --delete \
  --exclude='.git*' \
  --exclude='node_modules/' \
  --exclude='.backups/' \
  --exclude='.backlog/' \
  --exclude='backlog/' \
  --exclude='02-docs/' \
  --exclude='docs/' \
  --exclude='tests/' \
  --exclude='__tests__/' \
  --exclude='test-output/' \
  --exclude='output/' \
  --exclude='packages/' \
  --exclude='scripts/' \
  --exclude='templates/' \
  --exclude='linedraw/' \
  --exclude='*.md' \
  --exclude='*.py' \
  --exclude='*.txt' \
  --exclude='package-lock.json' \
  --exclude='jest.config.js' \
  --exclude='playwright.config.js' \
  --exclude='test-*' \
  --exclude='*-dev.html' \
  --exclude='server-simple.js' \
  "$REPO_ROOT/" "$DEST/"

echo "Synced app to $DEST"
echo "Files: $(find "$DEST" -type f | wc -l)"
echo
echo "Next steps:"
echo "  cd $WEBSITE_ROOT && git add public/total-serialism/app && git commit && git push"
echo "  (GitHub Actions rebuilds and deploys https://edgelesslab.com/total-serialism/app/)"
