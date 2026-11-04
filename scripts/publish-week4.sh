#!/usr/bin/env bash
set -euo pipefail

cd /c/demo1/EnterpriseE-commercePlatform

git switch seed-sample-data

week4_paths=(
  "package.json"
  "apps/backend/package.json"
  "apps/backend/medusa-config.ts"
  "apps/backend/src/modules/week4-payment"
  "apps/backend/src/scripts/check-week4-inventory.ts"
  "apps/backend/src/scripts/week4-inventory"
  "apps/backend/src/scripts/week4-read-cart.ts"
  "docs/report/week-4-handoff-20261105"
  "docs/report/evidence/inventory-week4-20261101-01/W4-01"
  "docs/report/evidence/inventory-week4-auto-20261105-suite-01"
  "docs/report/evidence/inventory-week4-auto-20261105-verify-01"
  "scripts/publish-week4.sh"
)

git add -- "${week4_paths[@]}"
git diff --cached --stat -- "${week4_paths[@]}"

if git diff --cached --quiet -- "${week4_paths[@]}"; then
  printf '%s\n' "No new Week 4 changes to commit."
else
  git commit --only -m "Complete week 4 inventory edge-case tests and evidence" -- "${week4_paths[@]}"
fi

git push -u origin seed-sample-data
git log -1 --oneline
printf '%s\n' "Week 4 push completed on branch seed-sample-data."
