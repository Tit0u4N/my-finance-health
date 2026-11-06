#!/usr/bin/env bash
# Deletes every Turbo cache entry that the runs of the current job did not use, so the cache saved
# from main holds exactly the state of main instead of growing with every commit.
# Usage: prune-turbo-cache.sh <turbo cache dir> <turbo run summaries dir>
set -euo pipefail

cache_dir="$1"
runs_dir="$2"

if [ ! -d "$cache_dir" ] || [ ! -d "$runs_dir" ]; then
  exit 0
fi

used_hashes=$(jq -r '.tasks[].hash' "$runs_dir"/*.json | sort -u)

for entry in "$cache_dir"/*; do
  [ -e "$entry" ] || continue
  name=$(basename "$entry")
  hash="${name%%[.-]*}"
  if ! grep -qx "$hash" <<<"$used_hashes"; then
    rm -rf "$entry"
  fi
done
