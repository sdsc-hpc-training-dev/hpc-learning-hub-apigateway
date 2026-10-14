# Learning Hub deployment and team assignments

Date: October 12, 2026. Proposed release owner: Srujam. Proposed production
approvers: Fernando, with Shing covering his absence. This plan starts with one supervised deployment
and gives the team a private environment in which to build deployment automation,
end-to-end tests, CILogon, and observability.

## Current evidence

The October 9 collection run published a validated snapshot to Azure Storage and
an NRP S3 backup. It did not run a Kubernetes Job on NRP and did not update the
production application database. The twice-daily workflow was absent from the
pipeline repository's default `main` branch, so it could not run on a schedule.

Azure PostgreSQL currently serves 530 materials and 520 event editions. Its active
snapshot is `snapshot-v3-20260805T002229Z`; its latest event starts August 3, 2026.
It therefore has no upcoming events on October 12. The isolated local candidate
contains 538 materials, 527 editions, eight upcoming events, and seven learning
paths. Uploading a snapshot does not activate it in the served database.

The October 12 Daily Catalog Candidate workflow collects and audits data at
13:17 UTC daily (06:17 PDT, 05:17 PST). It uses tested pipeline source
`719ccee9feb0d26a4e1be5ea76aed84654089aac` and runs an image by digest on a temporary
GitHub runner. Azure credentials are generated through the existing OIDC identity
for each run. NRP is currently the backup bucket, not the execution host. AIDA
evaluation is separate. The workflow retains evidence; database activation is
Srujam's next integration task.

The schedule is active on `main` through
[pipeline PR 72](https://github.com/sdsc-hpc-training-dev/intvid-backend/pull/72),
merged October 12. The October 12 canary produced
`snapshot-v3-20261012T175431Z-5e4c572b49f8928f` and source bundle
`source-bundle-v1-20261012T175223Z-429040d2679c`. Its Azure promotion audit passes
all 13 gates; the audit checksum matches the published pointer. Canonical entity
and relationship files and the stable-ID registry are byte-identical to the
October 9 local candidate, so the local UI represents the latest collected
catalog content even though its snapshot provenance ID is older. New version IDs
do not necessarily mean new teaching material.

Azure role fixes were limited to the existing workflow identity: Storage Blob
Delegator on `staidanrppilot260730` and Storage Blob Data Contributor on its
`snapshots` container. Generated SAS permissions omit delete, require HTTPS and
expire after three hours. PostgreSQL permissions were not expanded.

[Live canary run 38285940023](https://github.com/sdsc-hpc-training-dev/intvid-backend/actions/runs/38285940023)
completed successfully. Raw data and the snapshot were published to both Azure and
NRP, with remote digest metadata and size verification. The pipeline runtime was
1,131.93 seconds (about 19 minutes); collection/enrichment took 710.88 seconds,
and snapshot build/audit/publication took 421.05 seconds. No NRP backup error was
reported. This proves the temporary runner plus NRP storage path; it is not a
Kubernetes execution test or an application-database activation.

The local review passed 115 frontend tests, targeted lint and the production
Docker build. The production npm audit reports zero known vulnerabilities. A
display scan of all 538 materials and their resource titles found no retained HTML
fragments after the October 12 fixes. Visual tests covered desktop events, series
navigation, material descriptions and mobile navigation/expanded-text wrapping;
the browser console was clean. These checks do not replace the full Cypress,
Playwright and Postman suites assigned to the team.

Young should also pin the hosted runner image and update the official actions
after testing: the canary warned of an `ubuntu-latest` migration beginning October
19 and older actions being forced from Node 20 to Node 24. They passed today;
retain these runner-maintenance tasks alongside the NRP migration.

The review stack is at http://127.0.0.1:18082/ and its Gateway at
http://127.0.0.1:18081/api/v1. Port 18080 was occupied by another project.
VM inspection through the configured `learning-hub` SSH alias failed because the
jump host rejected noninteractive authentication. VM permissions, resource limits,
and actual VM-to-Azure TLS connectivity must be verified from a working session.

## Ownership and completion criteria

| Owner                               | Deliverable                                                                         | Completion evidence                                                                                                                                                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Srujam                              | Release coordination, Gateway, DB migration/import/activation, CILogon backend      | One reproducible dev deployment, Postman reports, atomic snapshot activation and rollback with paths/users preserved, authenticated AIDA denied without a valid session                                          |
| Keyura                              | Frontend release, Cypress/Playwright, CILogon UI                                    | Desktop/mobile regression suite; ten library cards, six series cards, working filters, events/registration links, seven paths, no raw source markup or application errors; login/logout and session expiry tests |
| Young                               | Daily collectors, NRP execution, immutable snapshots and pipeline failure diagnosis | Daily `success` or `no_change` evidence; Azure and NRP checksums verified; one real NRP Job; no unexplained ID loss; documented handoff to ingestion                                                             |
| Shing                               | Metrics, logs, alerts, and monitoring deployment                                    | Dashboard for uptime, error rate, latency, resource usage, snapshot age, import failures and pipeline freshness; tested failure alert; telemetry redacts credentials and user content                            |
| Fernando / Shing as proposed backup | Production approval and coordination with SDSC                                      | Approval references the tested frontend/Gateway image digests, snapshot ID and test reports; supervised first production launch and rollback                                                                     |
| SDSC infrastructure                 | One-time VM account, storage, runtime, TLS and network setup                        | Named SSH access, shared directories, isolated dev runtime, working TLS/reverse proxy and VM-to-Azure test                                                                                                       |

Each person owns a bounded PR and updates the release tracking issue with branch,
commit, changed files, tests, evidence links, and blockers. Srujam checks cross-repo
compatibility and the release manifest. Avoid concurrent database migrations or
multiple people editing the same release configuration.

## Runtime layout

Production: frontend + Gateway containers on `train.sdsc.edu` and Azure PostgreSQL.
Private dev: frontend + Gateway containers and an isolated dev database on the
existing Azure server. Use a separate database and separate login, not merely a
different schema in production. Confirm connection/pool and workload capacity.
A second Azure server is an optional later decision with additional cost.

Do not run a production PostgreSQL replica on the 2-vCPU/4-GB VM for caching.
The frontend already caches public catalog lists for five minutes and details for
one hour. Successful snapshot activation must invalidate the shared `catalog` tag.
Private auth/user/AIDA responses must not enter the public cache.

A disposable local PostgreSQL container is appropriate on laptops or CI runners
for destructive tests. Restore a sanitized versioned dump and reset only that
test database. A local DB on the VM would be a third dev container and needs a
resource check. Run browser test workers and image builds on laptops/GitHub
runners to preserve VM memory. Begin with one shared dev environment.

Use administrator-created paths rather than a person's home directory:

```text
/srv/learning-hub/
  releases/<release-id>/          compose files, scripts, release manifests
  dev/                           current dev manifest and deployment state
  prod/                          current production manifest and state
  metrics/                       monitoring configuration
  evidence/                      smoke reports, screenshots, deployment history
/etc/learning-hub/dev/            dev-only secrets
/etc/learning-hub/prod/           production secrets
/var/lib/learning-hub-dev/        rootless dev runtime state
/var/lib/learning-hub-prod/       production runtime state
```

Code, configuration and evidence live in GitHub and the shared VM locations.
Keep authoritative backup dumps with checksums in private versioned Azure storage.
Do not distribute DB passwords, OIDC client secrets, registry tokens, or private
TLS keys through Git, a group-readable directory, or chat.

SDSC should create named accounts and a `learning-hub-dev` group, set directory
ownership/default ACLs, and separate dev/prod service identities. Access to the dev
runtime must grant control only over the dev service account and dev secrets.
Production secrets and runtime control remain restricted to the release operator.
Prefer a rootless dev Docker/Podman runtime with an audited group-access control
path; SDSC must confirm the exact supported arrangement. Do not expose either
Docker socket to a container or public TCP endpoint.

## What requires sudo

Interns can use SSH tunnels, Git, approved rootless container commands, Postman,
and browser tests without sudo after setup. They can update shared dev release
files and inspect the permitted logs. Srujam should document the exact dev
container context or supported wrapper supplied by SDSC before testing it.

An administrator is initially needed for shared directories/groups, subordinate
UID/GID ranges, runtime prerequisites, user-service lingering, resource controller
delegation, Nginx, TLS files, host firewall rules and privileged ports 80/443.
Installing Chromium dependencies or system exporters may also need an admin.
Put those tools in CI images or install them once. Do not promise sudo-free setup.
The ordinary rootful `docker` group grants root-level privileges; it is not a
least-privilege substitute for sudo.

With rootless Docker, service management uses `systemctl --user`; SDSC must enable
lingering so services survive logout/reboot. Resource limits require working
cgroup v2/systemd delegation. Runtime files may live under a service account's
system-managed home; deployable project files still belong under `/srv`.

## Private dev access and tests

Bind dev frontend to VM `127.0.0.1:18080` and dev Gateway to
`127.0.0.1:18081`. Gateway communicates with Azure on TCP 5432 over TLS. Use
separate container networks and DB logins for dev and prod. Do not expose a dev
database or Gateway port to the Internet.

Each intern uses their own VM login and approved jump-host setup. In PowerShell:

```powershell
ssh -N -o ExitOnForwardFailure=yes -L 18080:127.0.0.1:18080 -L 18081:127.0.0.1:18081 learning-hub
```

The `learning-hub` alias must use that person's username and key, not Fernando's.
Where needed it uses the approved SDSC jump host. MFA/password login can remain
interactive. Keep the SSH process open while tests run. Select different local
ports if those are already occupied.

| Tool                       | Target                                | Expected use                                                     |
| -------------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| Browser/Cypress/Playwright | http://127.0.0.1:18080                | UI, responsive layout, navigation, filters and error regressions |
| Postman/Newman             | http://127.0.0.1:18081/api/v1         | Gateway contract and authorization assertions                    |
| Headless CI worker         | Approved SSH tunnel to the same ports | Trusted release smoke/E2E tests with restricted SSH credentials  |

The tunnel does not automatically satisfy real OIDC callback URLs or Secure-cookie
requirements. Test real CILogon on an approved HTTPS dev origin, using a VPN-only
Nginx vhost or another SDSC-approved private route. Ordinary HTTP loopback is for
public catalog testing. Use a mock OIDC issuer for deterministic automated auth
tests; conduct one real CILogon round trip separately. Do not automate passwords,
MFA prompts, or bypass the identity provider's protections.

## First supervised deployment

1. SDSC completes the one-time setup and certificate for
   `learning-hub.sdsc.edu` and `dev-learning-hub.sdsc.edu`, both on
   `train.sdsc.edu` (`132.249.225.67`). Production HTTPS is public; dev access is
   tunneled or VPN-restricted. The identical IP means host-name isolation must
   also be enforced in Nginx, not assumed from the firewall alone.
2. From the VM verify the Azure hostname on port 5432 with `psql` using
   `sslmode=verify-full` and the trusted CA. Never put the password on the command
   line. Azure already has the VM's narrow IP firewall rule; confirm actual egress
   and TLS. No extra SDSC website certificate is needed for the database client.
3. Srujam prepares a versioned dev database from a checksum-verified dump,
   applies explicit Gateway migrations and restores curated paths separately.
   Keep `synchronize=false`. Match dump tooling to PostgreSQL 16; the historic
   PostgreSQL 17 dump requires compatibility handling.
   For the initial public launch with current events, restore the reviewed
   candidate into a fresh Azure release database, reconcile curator overlays and
   stable-ID redirects, test it, then switch Gateway configuration under
   supervision. Preserve the previous database for rollback. This controlled
   whole-database switch does not require running the unfinished M2 loader
   against the only served database.
4. Build and scan frontend/Gateway images in CI from the selected release SHAs.
   Runtime images use pinned Node versions, a non-root user and locked dependencies.
   Install dependencies with `npm ci --ignore-scripts` unless an explicitly
   reviewed build step needs a lifecycle script. Review runtime and dev audits
   separately; scanner success does not by itself prove absence of malware.
5. Store frontend/Gateway image digests, code SHAs, config version, migration
   version and snapshot ID in one release manifest. Frontend/Gateway pairing is
   explicit even though the repositories have different branch names.
6. Deploy dev using its own configuration and credentials. Validate actual DB
   reads through the Gateway; `/api/v1/health` currently checks process health
   only and is insufficient as a database readiness check.
7. Keyura and Srujam run the browser and API suites and preserve reports.
   Shing verifies monitoring. Young verifies snapshot counts/checksums and
   current events against the SDSC published calendar.
8. After review, promote the same tested image digests to prod. Back up and
   rehearse data rollback before any snapshot switch. Initially keep
   `ENABLE_PRIVATE_FEATURES=false` until CILogon and AIDA authorization pass.
9. Verify DNS/TLS, pages, resource links, public API, cache invalidation and
   private-route behavior. Record previous/current manifests and the rollback.

Candidate data is not ready for automatic production activation until Srujam
implements the missing M2 contract: staging, stable IDs, transactional activation,
preserved paths/users, active-snapshot-aware reads, and recovery. Pending that,
collection can run daily and supervised imports can use isolated dev databases.

## Gitflow and deployment automation assignment

```text
feature/* -> PR to dev/develop
  -> release/<version> -> CI/tests/scans -> immutable image digests
  -> dev manifest -> VM polls every 5 minutes -> dev smoke tests
  -> manual inspection + complete E2E evidence
  -> reviewed PR to main/master -> approved prod manifest
  -> VM polls every 5 minutes -> prod smoke tests or automatic rollback
  -> release tag and merge release fixes back to dev/develop
```

The frontend uses `master`, Gateway uses `main`, and the pipeline uses `main`;
development branch names vary. Follow each repository's existing convention.
The release manifest coordinates compatible revisions across them. Release fixes
must return to development to avoid losing them in the next release.

Young and Srujam implement CI image publication and a deployment controller using
GHCR. Keyura supplies the UI gates and Shing supplies deployment/freshness metrics.
Build once, test the image, and promote the digest; do not rebuild it for prod.

The VM timer polls an approved release manifest rather than an unconstrained
`latest` image tag. It verifies approval, repository/image allowlists, digest,
tests and configuration compatibility. Use a `systemd --user` timer or approved
cron with a lock (`flock`) to prevent overlapping deploys. Pull both images,
stage the pair, check readiness, switch traffic, smoke-test and retain the previous
pair. Never destroy the only healthy environment before staging its replacement.

Dev deployment is automatic after CI. Production deployment is automatic after
the human-reviewed PR and approved prod manifest; approval is the deliberate
human gate. On this repository account, branch-protection inspection returned a
plan limitation. Verify GitHub's protection/reviewer features for these private
repositories before relying on them. Until enforcement is available, a separate
release approver controls prod manifest publication; ordinary pushes to `master`
must not automatically authorize production.

Do not run arbitrary fork/feature PR code with production secrets or put a general
self-hosted GitHub runner on the production VM. Use trusted release refs, hosted
CI and restricted tunnel credentials. The VM should need outbound HTTPS to the
registry and GitHub, not a public webhook or inbound Docker API.

Acceptance exercise: failed CI produces no promotable manifest; a rejected PR
cannot promote prod; a failed container keeps the previous healthy pair; a duplicate
timer tick is a no-op; a reboot restores services; frontend and Gateway versions
cannot split; a rollback restores both images and data compatibility.

For the first automated version, retain fixed loopback upstream ports in Nginx
and allow a short, measured replacement window. Stage and check the new images
first, replace the pair at those ports, then restore the previous pair if final
checks fail. Record the expected interruption. True zero-downtime switching needs
additional temporary capacity and either an unprivileged internal traffic switch
or an SDSC-installed, narrowly constrained upstream-switch helper. Interns must
not need general permission to rewrite/reload system Nginx or edit a root-owned
deployment script. Confirm staging fits alongside prod/dev on this small VM.

Before launch, Young and Keyura should reconcile instructor metadata on featured
materials: one record currently identifies an instructor by job title, and the
GPU introduction's selected instructor differs from the design reference. Fix
the curated source/provenance so subsequent imports preserve the correction.
The displayed catalog format is clean; that does not establish that every label
or every historical external link has been manually verified.

## CILogon assignment

Srujam owns Gateway OIDC code exchange, token validation and application sessions.
Keyura owns sign-in/logout, signed-in navigation and the AIDA UI boundary. Register
separate dev/prod clients with exact HTTPS callback URLs, contact/approval details
and minimal scopes at https://cilogon.org/oauth2/register. Suggested route to
agree before registration: `/api/v1/auth/cilogon/callback`. The hostname alone is
insufficient; CILogon must approve the complete redirect URI.

Use authorization code flow with PKCE, state and nonce; validate issuer, audience,
signature and expiry against discovery/JWKS. Keep client secrets and provider
tokens server-side. Identify users by issuer + subject, not email. Application
roles are assigned locally. Use Secure, HttpOnly, host-only sessions, CSRF defenses,
logout/revocation and expiry handling. AIDA must reject unauthenticated API calls,
including direct calls through a tunnel; hiding the UI is insufficient. Retain a
public catalog and test user-to-user isolation. No silent fallback to anonymous
AIDA is permitted.

Shing verifies that metrics/logs exclude tokens, session cookies, email addresses
and raw prompts. Young tests pipeline operations independently of user sessions.
Keep private features disabled until negative auth tests and a real dev login pass.

## SDSC setup request

Request named SSH access for all four interns; shared `/srv/learning-hub` paths
and dev-group ACLs; separate dev/prod service identities; approved rootless runtime
and restart/linger setup; delegated resource limits; initial Nginx/TLS configuration;
VPN-only dev HTTPS access for CILogon; outbound HTTPS to GitHub/GHCR, CILogon and
NRP; outbound Azure PostgreSQL 5432; confirmation of CPU/RAM/disk; and a safe
monitoring path. Ask whether Shing's metrics need an administrator-installed
exporter. Provide a shared contact address for certificate expiry notifications.

## References

- [GitHub scheduled workflow requirements](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [Docker rootless prerequisites](https://docs.docker.com/engine/security/rootless/)
- [Rootless service and resource controls](https://docs.docker.com/engine/security/rootless/tips/)
- [Docker group privileges](https://docs.docker.com/engine/install/linux-postinstall/)
- [GHCR immutable image pulls](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [GitHub deployment review availability](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments)
- [CILogon registration and OIDC](https://www.cilogon.org/oidc)
- [Playwright CI](https://playwright.dev/docs/ci-intro)
- [Cypress configuration](https://docs.cypress.io/app/references/configuration)
