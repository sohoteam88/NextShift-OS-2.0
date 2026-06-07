#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

BASE_URL="${1:-${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3000}}"
OUT_DIR="${2:-.lighthouse}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$OUT_DIR"

PAGES=(
  "/login"
  "/signup"
  "/crm"
  "/crm/pipeline"
  "/analytics"
  "/team"
)

for page in "${PAGES[@]}"; do
  slug="${page#/}"
  slug="${slug//\//-}"
  report_html="$OUT_DIR/${slug}-${TIMESTAMP}.html"
  report_json="$OUT_DIR/${slug}-${TIMESTAMP}.json"

  npx --yes lighthouse "${BASE_URL}${page}" \
    --quiet \
    --chrome-flags="--headless --no-sandbox" \
    --output=html \
    --output=json \
    --output-path="$report_html" \
    --output-path="$report_json" \
    --only-categories=performance,accessibility,best-practices,seo \
    >/dev/null

  echo "Wrote ${report_html}"
done
