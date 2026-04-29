# Marketplace Submissions

Templates for submitting **lynx** to community / sibling Claude Code marketplaces.

## Status

| Marketplace | Type | Submission Path | Status |
|---|---|---|---|
| `buildwithclaude` (davepoon) | Community curation, ~117 plugins | PR adding plugin entry to `marketplace.json` | template ready |
| `omc` (oh-my-claudecode) | Single-author umbrella | Issue requesting cross-listing | template ready |
| `ecc` (everything-claude-code) | Single-author umbrella | Issue requesting cross-listing | template ready |
| `claude-skillz` (Nick Tune) | Single-author | Issue requesting cross-listing | template ready |

## How to submit

Each `*.md` here is the **issue or PR body** ready to paste. Read the `target-repo` field, open the issue/PR there, paste the body, attach the `plugin-entry.json` snippet.

The lynx repo's own `marketplace.json` (`name: "lynx-dev"`) is already authoritative — users can install via `/plugin marketplace add krzemienski/lynx` without any cross-listing. Cross-listing is for **discoverability**, not function.

## Why issues, not PRs

Submitting a PR to someone else's `marketplace.json` is presumptuous without prior consent — the maintainer chooses what to feature. An issue invites them to evaluate and merge themselves, which is the standard etiquette for unsolicited contributions.

If a maintainer responds positively, follow up with a PR.
