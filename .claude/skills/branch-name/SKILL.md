---
name: branch-name
description: Check that the current branch follows the <type>/<short-kebab-description> convention and recommend a rename when it does not. Runs as part of /write-commit and /write-merge, and after a merge to recommend renaming the branch that was merged. Use on /branch-name.
---

# Branch name

Branches are named `NNNN-<type>/<short-kebab-description>`: a four-digit number, then lowercase, under 40 characters after the number, with `<type>` one of:

| Type | For |
| --- | --- |
| `feature` | A user-visible addition |
| `fix` | A bug fix |
| `design` | Tokens, components, style guide |
| `docs` | Docs only |
| `chore` | Tooling, config, dependencies |

Pattern: `^[0-9]{4}-(feature|fix|design|docs|chore)/[a-z0-9]+(-[a-z0-9]+)*$`. `NNNN` is the branch's pull request number: one more than the highest from `gh pr list --state all --limit 1 --json number` when the branch is opened, or the PR's own number once it exists. The convention lives in `docs/workflow/version-control.md`.

## Check

- `git branch --show-current`. If it is `main`, there is nothing to rename: during the scaffold phase say nothing, otherwise remind the user that work belongs on a branch
- Match it against the pattern and the length limit. If it passes, the type fits the work and the number is the branch's PR number (or the next free one when there is no PR yet), say "Branch name OK" in one line and stop
- A name can pass the pattern and still be wrong: `docs/` for a branch that changes `tokens.css`, `feature/` for a bug fix, a number already used by another PR. Judge the type from the commits (`git log --format=%s main..HEAD`) and files (`git diff --stat main...HEAD`, plus uncommitted changes)

## Recommend a name

Pick the type from the work:

- Only `docs/` outside `docs/design/`, or README, VERSION_HISTORY: `docs`
- `docs/design/`, `docs/assets/tokens.css`, `docs/assets/style-guide.html`: `design`
- `.claude/`, `.github/`, `mkdocs/`, config, ignore files, dependencies: `chore`
- A change that corrects broken behavior: `fix`
- Everything else that adds something a person sees or uses: `feature`

Build the description from what the branch does, 2-4 words (`clock-card`, `kiosk-reconnect`), never the date or a ticket number, and put the number in front (`0007-feature/clock-card`). Offer one to three names with AskUserQuestion, best first, and let the user keep the current name.

## Rename

Only after the user picks a name:

- `git branch -m <old> <new>`
- If the old branch has an upstream, tell the user a remote rename means pushing the new name and deleting the old one, and that deleting the old one closes any open pull request from it. Do that (`git push -u origin <new>`, then `git push origin --delete <old>`) only if they say so
- Never rename `main`, and never rename a branch other people may have pulled without saying so

## After a merge

When a merge into `main` has just happened (the user says so, `/write-merge` was just used, or `git log -1 --merges --first-parent main --format=%s` names a branch you have not checked), find the merged branch name:

- From the merge subject: `Merge branch '<name>'` or `Merge pull request #N from <owner>/<name>`
- From the reflog if that fails: `git reflog -n 30` and the last "moving from <name> to main"

If it does not match the convention, recommend what it should have been called, using the merged work (`git diff --stat <merge>^1...<merge>^2`) for the type. The merge commit keeps the old name, so the rename is cosmetic: offer it only if the local branch still exists, otherwise say what to call the next one. Delete a merged local branch only if the user asks.

## Output

One or two lines: the verdict, then the recommendation if there is one. No file writes.
