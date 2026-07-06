#!/usr/bin/env bash
set -euo pipefail

profile="${1:-general}"
safe_profile="$(printf '%s' "$profile" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9._-' '-')"
timestamp="$(date +%Y%m%d-%H%M%S)"

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

output_dir=".chatgpt-context"
build_dir="$output_dir/repository-build-$safe_profile-$timestamp"
zip_path="$output_dir/Repository.zip"
manifest="$build_dir/manifest.txt"

rm -rf "$build_dir" "$zip_path"
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

is_excluded_path() {
  case "$1" in
    .git/*|.github/workflows/deploy.yml|.chatgpt-context/*|outputs/*)
      return 0
      ;;
    audit/*|docs/audit/*|docs/PRD/*|docs/epics/*)
      return 0
      ;;
    node_modules/*|*/node_modules/*|.next/*|coverage/*|playwright-report/*|test-results/*|*/dist/*|public/*|*.tsbuildinfo|.DS_Store)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_profile_path() {
  local path="$1"

  case "$path" in
    README.md|AGENTS.md|LAUNCH_GUIDE.md|package.json|pnpm-lock.yaml|pnpm-workspace.yaml|tsconfig.json|tsconfig.base.json)
      return 0
      ;;
    next.config.mjs|tailwind.config.ts|postcss.config.js|playwright.config.ts|vitest.config.ts|next-env.d.ts)
      return 0
      ;;
    Dockerfile|docker-compose.dev.yml|docker-compose.prod.yml|.dockerignore|.gitignore|.env.example|.env.production.example)
      return 0
      ;;
    prisma/*|supabase/*|src/*|packages/*|tests/*|scripts/*)
      return 0
      ;;
    docs/README.md|docs/SUPABASE_SETUP.md|docs/github-actions-ci.md|docs/monitoring-sentry.md|docs/playwright-e2e.md|docs/vps-setup-guide.md)
      return 0
      ;;
    docs/nextshift-os-3/README.md|docs/nextshift-os-3/START_HERE.md|docs/nextshift-os-3/MASTER_INDEX.md|docs/nextshift-os-3/PROJECT_STATUS.md|docs/nextshift-os-3/RUNTIME_STATUS.md|docs/nextshift-os-3/SYSTEM_CONTEXT.md|docs/nextshift-os-3/PROJECT_ROADMAP.md|docs/nextshift-os-3/MVP_1_ALIGNMENT.md|docs/nextshift-os-3/MVP_1_IMPLEMENTATION_MASTER_PLAN.md|docs/nextshift-os-3/MVP_1_PHASE_TRACKER.md)
      return 0
      ;;
  esac

  case "$safe_profile" in
    general)
      return 1
      ;;
    auth)
      [[ "$path" == src/app/login/* || "$path" == src/app/signup/* || "$path" == src/app/register/* || "$path" == src/app/join/* || "$path" == src/app/pending/* || "$path" == src/app/api/v1/auth/* || "$path" == src/modules/auth/* || "$path" == src/modules/tenant/* || "$path" == src/modules/member/* || "$path" == src/__tests__/security/* || "$path" == src/__tests__/isolation/* ]]
      ;;
    crm)
      [[ "$path" == src/app/\(auth\)/crm* || "$path" == src/app/\(auth\)/crm-center/* || "$path" == src/app/api/v1/crm/* || "$path" == src/modules/crm/* || "$path" == src/modules/crm-engine/* || "$path" == src/__tests__/api/* || "$path" == src/__tests__/services/* ]]
      ;;
    dashboard|ai-coo|mission)
      [[ "$path" == src/app/\(auth\)/dashboard/* || "$path" == src/app/\(auth\)/mission/* || "$path" == src/app/\(auth\)/admin-command/* || "$path" == src/modules/dashboard/* || "$path" == src/modules/ai-coo/* || "$path" == src/modules/mission/* || "$path" == src/modules/mission-engine/* || "$path" == src/modules/mission-workspace/* || "$path" == src/modules/business-state/* || "$path" == src/modules/analytics/* || "$path" == docs/ai-coo/* || "$path" == src/__tests__/services/* ]]
      ;;
    workspace)
      [[ "$path" == src/app/\(auth\)/workspace/* || "$path" == src/modules/workspace/* || "$path" == src/modules/tenant/* || "$path" == src/modules/member/* || "$path" == src/modules/team/* || "$path" == docs/nextshift-os-3/workspace-experience-framework/* || "$path" == src/__tests__/services/* ]]
      ;;
    billing|payments)
      [[ "$path" == src/app/\(auth\)/billing/* || "$path" == src/app/api/payments/* || "$path" == src/modules/payments/* || "$path" == src/modules/saas/* || "$path" == src/__tests__/security/* ]]
      ;;
    *)
      [[ "$path" == src/modules/"$safe_profile"/* || "$path" == src/app/* || "$path" == src/__tests__/* ]]
      ;;
  esac
}

copy_tracked_file() {
  local path="$1"
  if [[ -f "$path" ]] && ! is_sensitive_path "$path" && ! is_excluded_path "$path" && is_profile_path "$path"; then
    mkdir -p "$build_dir/$(dirname "$path")"
    cp "$path" "$build_dir/$path"
    printf '%s\n' "$path" >> "$manifest"
  fi
}

write_package_notes() {
  {
    echo "# Repository Package"
    echo
    echo "This is a filtered source package for ChatGPT. It is not the full GitHub repository archive."
    echo
    echo "- Generated: $timestamp"
    echo "- Profile: $profile"
    echo "- Use with: NextShift_Context_Package.zip"
    echo
    echo "Recommended reading order:"
    echo
    echo "1. Read NextShift_Context_Package.zip first, starting at PROJECT_CONTEXT.md."
    echo "2. Use this Repository.zip only as source-code evidence."
    echo "3. In this zip, start with repo-map.txt and manifest.txt."
    echo "4. If a required file is missing, request that path instead of guessing."
    echo
    echo "Excluded by design:"
    echo
    echo "- audit history"
    echo "- bulky docs archives"
    echo "- node_modules and build outputs"
    echo "- local environment files and secret-looking paths"
    echo "- public assets; attach visual files separately when needed"
  } > "$build_dir/REPOSITORY_PACKAGE.md"
  printf '%s\n' "REPOSITORY_PACKAGE.md" >> "$manifest"
}

write_repo_map() {
  {
    echo "# Repository Map"
    echo
    echo "Generated: $timestamp"
    echo "Profile: $profile"
    echo
    echo "## Git Status"
    git status --short --branch --untracked-files=all
    echo
    echo "## Included Top-Level Areas"
    cut -d/ -f1 "$manifest" | sort | uniq -c | sort -nr
    echo
    echo "## Recent Commits"
    git log --oneline -12
  } > "$build_dir/repo-map.txt"
  printf '%s\n' "repo-map.txt" >> "$manifest"
}

while IFS= read -r path; do
  copy_tracked_file "$path"
done < <(git ls-files)

write_package_notes
sort -u "$manifest" -o "$manifest"
write_repo_map
sort -u "$manifest" -o "$manifest"

(
  cd "$build_dir"
  zip -qr "../$(basename "$zip_path")" .
)

checksum="$(shasum -a 256 "$zip_path" | awk '{print $1}')"
file_count="$(find "$build_dir" -type f | wc -l | tr -d ' ')"
zip_size="$(du -h "$zip_path" | awk '{print $1}')"

printf '%s  %s\n' "$checksum" "$(basename "$zip_path")" > "$output_dir/Repository.zip.sha256"

echo "Created $zip_path"
echo "Profile: $profile"
echo "Files included: $file_count"
echo "Zip size: $zip_size"
echo "SHA256: $checksum"
echo "Manifest: $build_dir/manifest.txt"
