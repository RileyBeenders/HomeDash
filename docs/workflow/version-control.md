# Version control

`main` is the stable branch. All work happens on a short-lived branch and reaches `main` through a pull request.

## Rules

- `main` always works. If it is on `main`, it has been reviewed and run.
- Branch from `main`, one purpose per branch, merge back, delete the branch.
- Merge with a **merge commit**, never squash or rebase, so `main` keeps one entry per branch (`git log --first-parent main`) and [the release log](#release-log) can be built from it.
- Don't commit to `main` directly. The exception is the scaffold phase (layout, docs, tooling, before any app code exists); it ended when the first feature branch was opened.
- Never force-push `main`. Force-push your own branch only before anyone else has pulled it.
- Nothing that is data goes in a branch. Data stays on the devices; see [Data boundary](data-boundary.md).
- Servers on the `stable` channel follow `main` and update themselves, so a merge to `main` reaches them. See [Updates](../system/updates.md).

## Branch names

`NNNN-<short-kebab-description>`, lowercase, 2-4 words, under 40 characters after the number. What kind of change it is goes in the pull request description, not the name.

`NNNN` is the branch's pull request number, zero-padded to four digits, so branches, pull requests and the release log all count up together: for example `0007-clock-card`. Branches `0001` to `0004` were named with a type before this rule (such as `0004-feature/auto-updates`) and keep their names. Before opening a branch, take one more than the highest number from `gh pr list --state all --limit 1 --json number`.

Good names: `0007-clock-card`, `0008-kiosk-reconnect`, `0009-dark-palette-contrast`. Never the date or a ticket number.

`/branch-name` checks the current branch against this pattern and recommends a rename when the number is wrong or the name doesn't describe the work. It runs on its own inside `/write-commit` and `/write-merge`, and after a merge it recommends what the merged branch should have been called. It renames only when you confirm; renaming a pushed branch means pushing the new name and deleting the old one, which closes any open pull request from it.

## Day to day

```bash
git switch main
git pull
git switch -c 0007-clock-card
# work, commit often
git push -u origin 0007-clock-card
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

- A title that is the branch name, for example `0007-clock-card`, so the number in the title is the pull request's own number.
- A `## Summary` grouped by area, and a `## Testing` section covering how it was checked.
- Docs updated for anything user-visible (see the project rules in `CLAUDE.md`).
- UI changes checked in light and dark at 375px, 768px and 1080×1920.
- No AI attribution in the title or description.

The template in `.github/pull_request_template.md` fills this in. `/write-merge` drafts the title, description and merge commit text.

Merge commit summary: `Merge <branch>: <what it does>`, with the branch's number: `Merge 0007-clock-card: add the clock card`.

## Release log

`VERSION_HISTORY.md` lists every branch by its number, newest first, with the date it was added and a short description. Add the branch's own row before opening its pull request, so the row merges with the work: run `/update-version-history`, then `/write-merge`.

## Tags

Tag `main` as `vMAJOR.MINOR.PATCH` when a version is ready to run on the host PC. Before the first app release, no tags.

## Protecting `main` on GitHub

Set once under Settings → Branches → Branch protection rule for `main`:

- Require a pull request before merging
- Require branches to be up to date before merging
- Block force pushes and deletion
- Allow merge commits only (Settings → General → Pull Requests)
- Automatically delete head branches
