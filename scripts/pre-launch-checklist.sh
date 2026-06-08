#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "=== NextShift OS Pre-Launch Checklist ==="
echo ""

echo "1. Build"
if ./node_modules/.bin/next build; then echo "✅ Build passes"; else echo "❌ Build failed"; fi

echo ""
echo "2. Lint"
if ./node_modules/.bin/next lint; then echo "✅ Lint passes"; else echo "❌ Lint failed"; fi

echo ""
echo "3. Type check"
if ./node_modules/.bin/tsc --noEmit; then echo "✅ Type check passes"; else echo "❌ Type check failed"; fi

echo ""
echo "4. Tests"
if ./node_modules/.bin/vitest run; then echo "✅ Tests pass"; else echo "❌ Tests failed"; fi

echo ""
echo "5. Dependency audit"
if pnpm audit --audit-level=high; then echo "✅ No high/critical vulnerabilities"; else echo "⚠️ Vulnerabilities found"; fi

echo ""
echo "6. I18n audit"
node --import tsx scripts/i18n-audit.ts

echo ""
echo "7. Secrets scan"
bash scripts/secrets-scan.sh

echo ""
echo "8. Environment check"
for var in DATABASE_URL NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
  if [ -z "${!var:-}" ]; then
    echo "❌ Missing: $var"
  else
    echo "✅ $var set"
  fi
done

echo ""
echo "=== Checklist complete ==="
