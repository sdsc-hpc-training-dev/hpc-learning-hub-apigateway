#!/usr/bin/env bash
set -euo pipefail

policy="$(dirname "$0")/validate-gitflow.sh"
for route in 'feature/catalog dev' 'feature/devOps dev' 'feature/DevOps dev' 'release/v0.0.0 master' 'release/0.0.1 master' 'RELEASE-0.0.1 master' 'hotfix/catalog master' 'master dev' 'main dev' 'feature/catalog release/v0.0.0'; do
  read -r head base <<< "$route"
  bash "$policy" "$head" "$base" >/dev/null
done
for route in 'feature/catalog master' 'feature/devOps main' 'dev master' 'release/vbad master' 'feature/catalog unknown' 'feature/catalog release/invalid'; do
  read -r head base <<< "$route"
  if bash "$policy" "$head" "$base" >/dev/null 2>&1; then
    echo "Unexpected valid route: $route" >&2
    exit 1
  fi
done
echo 'Gitflow route tests passed.'
