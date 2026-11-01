# Version control

`main` is the stable branch. All work happens on a short-lived branch and reaches `main` through a pull request.

## Rules

- `main` always works. If it is on `main`, it has been reviewed and run.
- Branch from `main`, one purpose per branch, merge back, delete the branch.
- Merge with a **merge commit**, never squash or rebase, so `main` keeps one entry per branch (`git log --first-parent main`) and [the release log](#release-log) can be built from it.
- Don't commit to `main` directly. The exception is the scaffold phase (layout, docs, tooling, before any app code exists); it ends when the first `feature/` branch is opened.
- Never force-push `main`. Force-push your own branch only before anyone else has pulled it.

## Branch names

`<type>/<short-kebab-description>`, lowercase, under 40 characters.

| Type | For | Example |
| --- | --- | --- |
| `feature/` | A user-visible addition | `feature/clock-card` |
| `fix/` | A bug fix | `fix/kiosk-reconnect` |
| `design/` | Tokens, components, style guide | `design/dark-palette-contrast` |
| `docs/` | Docs only | `docs/display-setup` |
| `chore/` | Tooling, config, dependencies | `chore/gitignore-site` |

`/branch-name` checks the current branch against this table and recommends a rename when the name or its type doesn't fit the work. It runs on its own inside `/write-commit` and `/write-merge`, and after a merge it recommends what the merged branch should have been called. It renames only when you confirm; renaming a pushed branch means pushing the new name and deleting the old one, which closes any open pull request from it.

## Day to day

```bash
git switch main
git pull
git switch -c feature/clock-card
# work, commit often
git push -u origin feature/clock-card
# open a pull request into main
```

Keep a long-running branch current by merging `main` into it (`git merge main`), not by rebasing.

## Commits

- Summary: under 10 words, imperative, no trailing period (`Add clock card`).
- Description: short bullets, one change per bullet, explaining what changed and why.
- One logical change per commit. A commit that breaks the build doesn't go on a branch someone else uses.
- No AI attribution anywhere in a commit or pull request: no co-author trailer, no "Generated with" line, no mention of an AI tool in the summary, description or title.

`/write-commit` drafts both from the staged changes.

## Pull requests

Every pull request targets `main` and has:

- A title of the form `NNNN-<branch>`, for example `0001-feature/server-and-first-pages`. `NNNN` is the pull request's number, zero-padded to four digits, so titles count up by one with every pull request and the release log reads in order.
- A `## Summary` grouped by area, and a `## Testing` section covering how it was checked.
- Docs updated for anything user-visible (see the project rules in `CLAUDE.md`).
- UI changes checked in light and dark at 375px, 768px and 1080×1920.
- No AI attribution in the title or description.

The template in `.github/pull_request_template.md` fills this in. `/write-merge` drafts the title, description and merge commit text.

Merge commit summary: `Merge <branch>: <what it does>`.

## Release log

`VERSION_HISTORY.md` lists merged pull requests, newest first. It is always one merge behind: the pull request that updates it isn't in the table yet. Run `/update-version-history` before writing a merge.

## Tags

Tag `main` as `vMAJOR.MINOR.PATCH` when a version is ready to run on the host PC. Before the first app release, no tags.

## Protecting `main` on GitHub

Set once under Settings → Branches → Branch protection rule for `main`:

- Require a pull request before merging
- Require branches to be up to date before merging
- Block force pushes and deletion
- Allow merge commits only (Settings → General → Pull Requests)
- Automatically delete head branches
