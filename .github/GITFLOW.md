# GitFlow integration

This repository uses two long-lived branches and three kinds of short-lived
branches. Changes reach `master` only through a reviewed release or hotfix.

## Branches

| Branch           | Start from         | Purpose                  | Merge into           |
| ---------------- | ------------------ | ------------------------ | -------------------- |
| `master`         | n/a                | Production history       | `dev` (back-sync)    |
| `dev`            | `master` initially | Next release integration | `release/vX.Y.Z`     |
| `feature/<slug>` | `dev` normally     | One focused change       | `dev`                |
| `release/vX.Y.Z` | `dev`              | Release stabilization    | `master`, then `dev` |
| `hotfix/<slug>`  | `master`           | Urgent production repair | `master`, then `dev` |

Feature slugs may contain uppercase and lowercase letters, numbers, `.`, `_`, or `-`,
for example `feature/devOps` or `feature/123-add-course-search`. Release branches use semantic versions
in the form `release/vX.Y.Z`, for example `release/v1.4.0`.
Legacy `RELEASE-X.Y.Z` branches remain accepted during migration. Hotfix branches use lowercase slugs containing letters,
numbers, `.`, `_`, or `-`, for example `hotfix/fix-login-crash`.

## Allowed pull requests

| Source      | Target                    | Use                                                         |
| ----------- | ------------------------- | ----------------------------------------------------------- |
| `feature/*` | `dev`                     | Normal integration                                          |
| `feature/*` | `release/*` or `hotfix/*` | A reviewed stabilization fix based on that temporary branch |
| `release/*` | `master`                  | Publish a release                                           |
| `release/*` | `dev`                     | Back-merge release-only changes                             |
| `hotfix/*`  | `master`                  | Publish an urgent fix                                       |
| `hotfix/*`  | `dev`                     | Back-merge the production fix                               |
| `master`    | `dev`                     | Synchronize all released changes back into development      |

The `gitflow-policy` check rejects every other source/target combination. CI
shows formatting, linting, type checking, tests and coverage, code-quality,
security, build, and conditional container-scan jobs separately. The required
`quality-gate` check aggregates those results and passes only when every job
succeeds. The container build and Trivy scan are skipped when no root
`Dockerfile` exists.

## Feature flow

```bash
git switch dev
git pull --ff-only
git switch -c feature/123-short-description
git push -u origin feature/123-short-description
```

Open a pull request into `dev`. Delete the feature branch after it is merged.

## Release flow

1. Add a commit to `dev` whose subject is exactly `RELEASE-X.Y.Z`, normally by
   using that message when merging the release-preparation pull request. The
   release automation creates `release/vX.Y.Z` at that commit. A pull request
   title by itself does not create a release branch.
2. Make only release stabilization changes on the release branch. Use a
   `feature/*` branch based on the release branch when review is needed.
3. Open `release/vX.Y.Z` into `master` and merge after approval and checks pass.
4. Tag the merge commit as `vX.Y.Z`.
5. Open `master` into `dev` to synchronize the completed release and any other
   production changes, then delete the release branch.

## Hotfix flow

1. Create `hotfix/<slug>` from an up-to-date `master`.
2. Implement and validate only the production fix.
3. Open the hotfix into `master` and merge it after approval and checks pass.
4. Tag the merge commit as `vX.Y.Z`, then open `master` into `dev` to synchronize
   the production fix.
5. Delete the hotfix branch after the synchronization is complete.

## One-time GitHub setup

GitHub Actions checks can report policy violations, but repository rulesets are
what block direct pushes and unsafe merges. After these files are present on
`master`, a repository administrator must:

1. Create a fine-grained personal access token for this repository with
   **Administration: read and write** and **Contents: read and write**.
2. Create a GitHub Actions environment named `repository-administration` and
   add the token as its `GITFLOW_ADMIN_TOKEN` environment secret. Restrict the
   environment to trusted administrators and the `master` branch.
3. Run **Actions > Set up GitFlow rules > Run workflow** from `master`.

The idempotent setup workflow creates `dev` from `master` if needed and creates
or updates the checked-in rulesets. The rulesets require pull requests,
resolved checks, resolved review threads, an up-to-date branch, `gitflow-policy`, and
`quality-gate` on `master` and `dev`. They also block deletion and force-pushes on
the long-lived branches and block force-pushes on `release/*` and `hotfix/*`.

This repository previously used `development`. Once `dev` exists and the team
has confirmed that no work exists only on `development`, an administrator may
archive or delete that legacy branch. The setup workflow deliberately does not
delete it.
