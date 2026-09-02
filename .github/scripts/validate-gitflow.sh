#!/usr/bin/env bash

set -euo pipefail

head_branch=${1:?A pull request head branch is required}
base_branch=${2:?A pull request base branch is required}

feature_pattern='^feature/[a-z0-9][a-z0-9._-]*$'
release_pattern='^release/[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$'
hotfix_pattern='^hotfix/[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$'

main_pattern='main'

is_feature() {
  [[ $1 =~ $feature_pattern ]]
}

is_release() {
  [[ $1 =~ $release_pattern ]]
}

is_hotfix() {
  [[ $1 =~ $hotfix_pattern ]]
}

is_main() {
  [[ $1 == $main_pattern ]]
}

valid=false
expected=''

case "$base_branch" in
  main)
    expected='release/<semver> or hotfix/<semver>'
    if is_release "$head_branch" || is_hotfix "$head_branch"; then
      valid=true
    fi
    ;;
  dev)
    expected='feature/<slug>, release/<semver>, main, or hotfix/<semver>'
    if is_feature "$head_branch" || is_release "$head_branch" || is_hotfix "$head_branch" || is_main "$head_branch"; then
      valid=true
    fi
    ;;
  release/*)
    expected='feature/<slug> targeting a valid release/<semver> branch'
    if is_release "$base_branch" && is_feature "$head_branch"; then
      valid=true
    fi
    ;;
  hotfix/*)
    expected='feature/<slug> targeting a valid hotfix/<semver> branch'
    if is_hotfix "$base_branch" && is_feature "$head_branch"; then
      valid=true
    fi
    ;;
  *)
    expected='a pull request targeting main, dev, release/<semver>, or hotfix/<semver>'
    ;;
esac

if [[ $valid == true ]]; then
  echo "Valid GitFlow route: ${head_branch} -> ${base_branch}"
  exit 0
fi

message="Invalid GitFlow route: ${head_branch} -> ${base_branch}. Expected ${expected}."
echo "::error title=Invalid GitFlow pull request::${message}"

if [[ -n ${GITHUB_STEP_SUMMARY:-} ]]; then
  {
    echo '## GitFlow policy failed'
    echo
    echo "$message"
    echo
    echo 'See `.github/GITFLOW.md` for the complete branch policy.'
  } >> "$GITHUB_STEP_SUMMARY"
fi

exit 1
