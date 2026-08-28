#!/usr/bin/env bash

set -euo pipefail

repository=${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}
create_dev=${CREATE_DEV_BRANCH:-true}
script_directory=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ruleset_directory="${script_directory}/../rulesets"
api_version=2022-11-28

for command in gh jq; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "$command is required." >&2
    exit 1
  fi
done

if [[ $create_dev == true ]]; then
  if gh api \
    --header "X-GitHub-Api-Version: ${api_version}" \
    "repos/${repository}/git/ref/heads/dev" >/dev/null 2>&1; then
    echo 'dev already exists.'
  else
    main_sha=$(gh api \
      --header "X-GitHub-Api-Version: ${api_version}" \
      "repos/${repository}/git/ref/heads/main" \
      --jq '.object.sha')

    jq -n --arg sha "$main_sha" '{ref: "refs/heads/dev", sha: $sha}' | \
      gh api \
        --method POST \
        --header "X-GitHub-Api-Version: ${api_version}" \
        "repos/${repository}/git/refs" \
        --input - >/dev/null
    echo "Created dev from main at ${main_sha}."
  fi
fi

# GitFlow merges into protected branches use merge commits so the release and
# hotfix topology remains visible.
gh api \
  --method PATCH \
  --header "X-GitHub-Api-Version: ${api_version}" \
  "repos/${repository}" \
  -F allow_merge_commit=true >/dev/null

existing_rulesets=$(gh api \
  --paginate \
  --header "X-GitHub-Api-Version: ${api_version}" \
  "repos/${repository}/rulesets?includes_parents=false")

for ruleset_file in "${ruleset_directory}"/*.json; do
  ruleset_name=$(jq -r '.name' "$ruleset_file")
  ruleset_id=$(jq -r --arg name "$ruleset_name" \
    '.[] | select(.name == $name and .source_type == "Repository") | .id' \
    <<< "$existing_rulesets" | head -n 1)

  if [[ -n $ruleset_id ]]; then
    gh api \
      --method PUT \
      --header "X-GitHub-Api-Version: ${api_version}" \
      "repos/${repository}/rulesets/${ruleset_id}" \
      --input "$ruleset_file" >/dev/null
    echo "Updated ruleset: ${ruleset_name}"
  else
    gh api \
      --method POST \
      --header "X-GitHub-Api-Version: ${api_version}" \
      "repos/${repository}/rulesets" \
      --input "$ruleset_file" >/dev/null
    echo "Created ruleset: ${ruleset_name}"
  fi
done
