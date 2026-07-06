#!/usr/bin/env bash
set -euo pipefail

scope="${1:-general}"
safe_scope="$(printf '%s' "$scope" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9._-' '-')"
timestamp="$(date +%Y%m%d-%H%M%S)"

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

output_dir=".chatgpt-context"
build_dir="$output_dir/build-$safe_scope-$timestamp"
zip_path="$output_dir/chatgpt-context-$safe_scope-$timestamp.zip"
manifest="$build_dir/manifest.txt"

rm -rf "$build_dir"
mkdir -p "$build_dir"
: > "$manifest"

is_sensitive_path() {
  case "$1" in
    .env|.env.*|*/.env|*/.env.*|*service-role*|*service_role*|*secret*|*secrets*|*password*|*token*|*private-key*|*private_key*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

copy_file() {
  local path="$1"
  if [[ -f "$path" ]] && ! is_sensitive_path "$path"; then
    mkdir -p "$build_dir/$(dirname "$path")"
    cp "$path" "$build_dir/$path"
    printf '%s\n' "$path" >> "$manifest"
  fi
}

copy_dir() {
  local path="$1"
  if [[ -d "$path" ]] && ! is_sensitive_path "$path"; then
    mkdir -p "$build_dir/$path"
    rsync -a \
      --prune-empty-dirs \
      --include='*/' \
      --include='*.cjs' \
      --include='*.css' \
      --include='*.js' \
      --include='*.json' \
      --include='*.md' \
      --include='*.mjs' \
      --include='*.prisma' \
      --include='*.sql' \
      --include='*.ts' \
      --include='*.tsx' \
      --include='*.yml' \
      --include='*.yaml' \
      --exclude='.env' \
      --exclude='.env.*' \
      --exclude='.next/' \
      --exclude='.turbo/' \
      --exclude='coverage/' \
      --exclude='dist/' \
      --exclude='node_modules/' \
      --exclude='playwright-report/' \
      --exclude='test-results/' \
      --exclude='*.tsbuildinfo' \
      --exclude='*' \
      "$path/" "$build_dir/$path/"
    find "$build_dir/$path" -type f | sed "s#^$build_dir/##" >> "$manifest"
  fi
}

write_repo_map() {
  {
    echo "# Repo Map"
    echo
    echo "Generated: $timestamp"
    echo "Scope: $scope"
    echo
    echo "## Git Status"
    git status --short --branch --untracked-files=all
    echo
    echo "## Root Files"
    git ls-files | awk -F/ 'NF == 1 {print}' | sort
    echo
    echo "## Top-Level Directories"
    git ls-files | awk -F/ 'NF > 1 {print $1}' | sort | uniq -c | sort -nr
    echo
    echo "## Largest Tracked Directories"
    git ls-files | sed 's#/[^/]*$##' | sort | uniq -c | sort -nr | head -80
    echo
    echo "## Recent Commits"
    git log --oneline -12
  } > "$build_dir/repo-map.txt"
  printf '%s\n' "repo-map.txt" >> "$manifest"
}

write_diff() {
  git diff -- . ':(exclude).chatgpt-context' > "$build_dir/git-diff.patch"
  git diff --cached -- . ':(exclude).chatgpt-context' > "$build_dir/git-diff-cached.patch"
  printf '%s\n' "git-diff.patch" "git-diff-cached.patch" >> "$manifest"
}

copy_common_context() {
  local files=(
    "README.md"
    "AGENTS.md"
    "LAUNCH_GUIDE.md"
    "package.json"
    "pnpm-lock.yaml"
    "pnpm-workspace.yaml"
    "tsconfig.json"
    "tsconfig.base.json"
    "next.config.mjs"
    "tailwind.config.ts"
    "postcss.config.js"
    "playwright.config.ts"
    "vitest.config.ts"
    "Dockerfile"
    "docker-compose.dev.yml"
    "docker-compose.prod.yml"
    ".dockerignore"
    ".gitignore"
    ".env.example"
    ".env.production.example"
    "prisma/schema.prisma"
    "docs/README.md"
    "docs/nextshift-os-3/README.md"
    "docs/nextshift-os-3/MASTER_INDEX.md"
    "docs/nextshift-os-3/PROJECT_ROADMAP.md"
  )

  for file in "${files[@]}"; do
    copy_file "$file"
  done

  copy_dir "supabase"
  copy_dir "src/lib"
  copy_dir "src/core"
  copy_dir "src/config"
  copy_dir "src/i18n"
  copy_dir "src/messages"
}

copy_scope_context() {
  case "$safe_scope" in
    auth)
      copy_dir "src/app/login"
      copy_dir "src/app/signup"
      copy_dir "src/app/register"
      copy_dir "src/app/join"
      copy_dir "src/app/pending"
      copy_dir "src/app/api/auth"
      copy_dir "src/modules/auth"
      copy_dir "src/modules/tenant"
      copy_dir "src/modules/member"
      copy_dir "src/__tests__/security"
      copy_dir "src/__tests__/isolation"
      ;;
    crm)
      copy_dir "src/app/(auth)/crm"
      copy_dir "src/app/(auth)/crm-center"
      copy_dir "src/app/api/v1/crm"
      copy_dir "src/modules/crm"
      copy_dir "src/modules/crm-engine"
      copy_dir "src/__tests__/api"
      copy_dir "src/__tests__/services"
      ;;
    dashboard|ai-coo|mission)
      copy_dir "src/app/(auth)/dashboard"
      copy_dir "src/app/(auth)/mission"
      copy_dir "src/app/(auth)/admin-command"
      copy_dir "src/modules/dashboard"
      copy_dir "src/modules/ai-coo"
      copy_dir "src/modules/mission"
      copy_dir "src/modules/mission-engine"
      copy_dir "src/modules/mission-workspace"
      copy_dir "src/modules/business-state"
      copy_dir "src/modules/analytics"
      copy_dir "src/__tests__/services"
      copy_dir "docs/ai-coo"
      ;;
    workspace)
      copy_dir "src/app/(auth)/workspace"
      copy_dir "src/modules/workspace"
      copy_dir "src/modules/tenant"
      copy_dir "src/modules/member"
      copy_dir "src/modules/team"
      copy_dir "src/__tests__/services"
      copy_dir "docs/nextshift-os-3/workspace-experience-framework"
      ;;
    billing|payments)
      copy_dir "src/app/(auth)/billing"
      copy_dir "src/app/api/payments"
      copy_dir "src/modules/payments"
      copy_dir "src/modules/saas"
      copy_dir "src/__tests__/security"
      ;;
    docs)
      copy_dir "docs/nextshift-os-3"
      copy_dir "docs/architecture"
      copy_dir "docs/ai-coo"
      copy_dir "docs/PRD"
      ;;
    general)
      copy_dir "src/app"
      copy_dir "src/modules/workspace"
      copy_dir "src/modules/auth"
      copy_dir "src/modules/tenant"
      copy_dir "src/modules/member"
      copy_dir "src/modules/crm"
      copy_dir "src/modules/ai-coo"
      copy_dir "src/modules/mission-engine"
      copy_dir "src/modules/dashboard"
      copy_dir "src/components"
      copy_dir "tests"
      ;;
    *)
      copy_dir "src/app"
      copy_dir "src/modules/$safe_scope"
      copy_dir "src/__tests__"
      ;;
  esac
}

write_repo_map
write_diff
copy_common_context
copy_scope_context

sort -u "$manifest" -o "$manifest"

(
  cd "$build_dir"
  zip -qr "../$(basename "$zip_path")" .
)

file_count="$(find "$build_dir" -type f | wc -l | tr -d ' ')"
zip_size="$(du -h "$zip_path" | awk '{print $1}')"

echo "Created $zip_path"
echo "Scope: $scope"
echo "Files included: $file_count"
echo "Zip size: $zip_size"
echo "Manifest: $build_dir/manifest.txt"
