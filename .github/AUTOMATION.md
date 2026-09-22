# Repository automation

This repository uses reusable actions pinned to
`ziqq/actions@ccd1a799683cd461a45d9303ac6fcb2792f8f5d2`.

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

## Notifications

`.github/workflows/notifications.yml` sends a required Discord and Telegram
notification when an issue is opened.

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
