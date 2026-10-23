# Repository automation

This repository uses reusable actions pinned to
`ziqq/actions@ccd1a799683cd461a45d9303ac6fcb2792f8f5d2`.

## Extension validation and publication

Pull request CI packages the extension as a VSIX using Node.js 22 and
`@vscode/vsce@4.0.0`. The package currently has no test or lint npm scripts.

Publication runs only when an existing version tag is pushed. The tag must be
`v<package.json version>`, and the first version in `CHANGELOG.md` must match.
The workflow does not create tags or change the package version.

The deploy job uses the `release` environment and Microsoft Entra workload
identity federation. Only this job can request a GitHub OIDC token. The pinned
`azure/login` action signs in without an Azure subscription, and
`vsce publish --azure-credential` uses that Azure CLI session to obtain a
short-lived Azure DevOps token. The workflow no longer reads `VSCE_PAT`; keep
the stored secret until its removal is separately approved.

Before merging this migration, complete these provider prerequisites:

1. Create a dedicated application/service principal in your Microsoft Entra
   tenant and add a federated identity credential with issuer
   `https://token.actions.githubusercontent.com`, audience
   `api://AzureADTokenExchange`, and subject
   `repo:ziqq/vscode_codepen_theme:environment:release`.
2. Set the application client ID as `AZURE_CLIENT_ID` and directory tenant ID
   as `AZURE_TENANT_ID` in the GitHub `release` environment variables. These
   identifiers are not client secrets. Preserve the environment's required
   reviewer and tag-only `v*` deployment policy, and release-tag protection.
3. Grant the identity the **Contributor** role on Marketplace publisher
   `ziqq`. Use its Visual Studio profile resource ID returned by
   `az rest -u https://app.vssps.visualstudio.com/_apis/profile/profiles/me --resource 499b84ac-1321-427f-aa17-267ca6975798`
   while authenticated as that identity. This profile ID differs from the
   Entra application client ID and service principal object ID.

Keep the PR in draft until federation and publisher membership are configured.
A passing VSIX packaging check does not verify OIDC token exchange or publication.
See the official [Azure login OIDC prerequisites](https://github.com/Azure/login#login-with-openid-connect-oidc-recommended)
and [Marketplace identity authorization](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#secure-automated-publishing-to-visual-studio-marketplace).

As of 2026-10-23, `vsce` also exposes `--oidc`, but Marketplace backend support
is still pending rollout. This workflow uses the supported Entra path without
a PAT fallback. Track [Marketplace trusted publishing](https://github.com/microsoft/vsmarketplace/issues/1422)
and the [2026-10-21 maintainer update](https://github.com/microsoft/vscode-docs/pull/10519#issuecomment-6325167592)
before considering the direct path.

## Semantic labels

`.github/labels.json` is the repository-owned source of truth. Automation uses
stable semantic IDs while visible label names remain configurable. Existing
repository-specific labels are preserved because `sync.orphanPolicy` is
`keep`.

Lifecycle transitions:

- a `github-<number>` branch starts work and links the branch to the issue;
- opening a linked pull request keeps the issue in progress;
- merging into `master` moves linked issues to `waiting_for_release`;
- publishing a GitHub release moves matching issues to `completed`;
- an author or assignee response resumes work waiting for a response;
- assigning lifecycle labels normalizes mutually exclusive states;
- documentation and test changes add path labels to pull requests.

Run the `Semantic labels` workflow manually to preview or apply an operation.
Manual runs default to `sync-labels` with `dry_run: true`. Pattern removal
and label deletion remain separate explicit inputs. The current configuration
does not delete unmanaged labels.

The `pull_request_target` jobs read the trusted base-branch configuration
through the GitHub API. No pull request head code is checked out with a write
token. Label jobs receive only the permissions needed for their operation;
only branch-to-issue linking receives `contents: write`.

The successful publication job in `.github/workflows/deploy.yml` now calls
`release-completed`, pinned to
`ziqq/actions/labeler@a991545704ba3fc43380d2b6024db3ca6935e4a7`.
All publication/deployment prerequisites must succeed; failed, cancelled and
skipped runs never complete issues. The hook reads the default-branch label
configuration through the API and shares the label workflow's concurrency group.
It selects issues by `events.releasePublished`, moves them from
`waiting_for_release` to `completed`, and preserves unrelated labels. Empty
selections are allowed; pattern removal is explicitly enabled and bulk work is
limited to 100 issues. Manually published releases still use `release-published`.
No additional PAT is required for releases created with `GITHUB_TOKEN`.
See [GitHub token event rules](https://docs.github.com/en/actions/concepts/security/github_token).

## Notifications

`.github/workflows/notifications.yml` calls
`ziqq/actions/.github/workflows/notify-events.yml@7737ce8c4d87c656b7ccf5f78138d8d7e53a1b62`
to send required Discord and Telegram notifications for newly opened issues
and pull requests (including drafts and forks)
opened by anyone other than the repository owner.

Both events are explicitly enabled here with `notify-issues: true` and
`notify-pull-requests: true`. Set either input to `false` to disable that event;
the reusable workflow defaults both inputs to `false`. Edits, reopened items,
and draft-to-ready changes do not send another notification.

Templates belong to this repository: `.github/notify/templates/issue.md` and
`.github/notify/templates/pull-request.md`. Pull request notifications use
`pull_request_target` and check out only the trusted base SHA, never PR-head
code with repository secrets.

`.github/workflows/checkout.yml` sends a best-effort notification after every CI result.
Fork and Dependabot pull requests are skipped because repository secrets are
not available to them.

`.github/workflows/deploy.yml` sends a required notification after release or deploy,
including failed runs.

Configure these Actions secrets in this repository:

| Secret | Value |
|---|---|
| `DISCORD_WEBHOOKS` | JSON object such as `{"targets":[{"url":"https://discord.com/api/webhooks/..."}]}` |
| `TELEGRAM_BOT_TOKEN` | Token issued by BotFather |
| `TELEGRAM_TARGETS` | JSON object such as `{"targets":[{"chatId":"123456789"}]}` |

Templates live in `.github/notify/templates/`. Dynamic values are escaped by
the action. Delivery uses a 10-second per-request timeout and at most five
attempts for retryable failures. Logs and outputs contain neither credentials,
target identifiers, nor rendered message bodies.
