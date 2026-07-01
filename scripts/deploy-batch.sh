#!/usr/bin/env bash
# Sequential supabase function deployer with per-function status.
# Usage: scripts/deploy-batch.sh fn1 fn2 fn3 ...
#
# Each function is deployed via `supabase functions deploy <name>`.
# Output for each is one line: "✓ <name> (Xs)" or "✗ <name> (Xs) — <err>".
# Exits 0 if all OK, 1 if any failed.

set -u
REF=zskaxjtyuaqazydouifp
PROJECT_DIR=/Users/jhl/code/signaldesk-v3
cd "$PROJECT_DIR"

failed=()
for fn in "$@"; do
  start=$(date +%s)
  out=$(supabase functions deploy "$fn" --project-ref "$REF" 2>&1)
  rc=$?
  elapsed=$(($(date +%s) - start))
  if [ $rc -eq 0 ]; then
    printf '✓ %-50s (%ds)\n' "$fn" "$elapsed"
  else
    err=$(echo "$out" | grep -v -E '^WARN|^$' | head -1 | cut -c1-80)
    printf '✗ %-50s (%ds) — %s\n' "$fn" "$elapsed" "$err"
    failed+=("$fn")
  fi
done

echo "---"
if [ ${#failed[@]} -eq 0 ]; then
  echo "all $# deployed cleanly"
  exit 0
else
  echo "FAILED (${#failed[@]}): ${failed[*]}"
  exit 1
fi
