#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "Scanning for potential secrets..."

grep -rn "sk-[a-zA-Z0-9]\{20,\}" src/ --include="*.ts" --include="*.tsx" || true
grep -rn "sk-ant-[a-zA-Z0-9]\{20,\}" src/ --include="*.ts" --include="*.tsx" || true
grep -rn "eyJ[a-zA-Z0-9_-]\{50,\}" src/ --include="*.ts" --include="*.tsx" || true
grep -rnE '(^|[^[:alnum:]_])password[[:space:]]*=[[:space:]]*["'"'"'][^"'"'"']+["'"'"']' src/ --include="*.ts" --include="*.tsx" || true

echo "Scan complete. Review any matches above."
