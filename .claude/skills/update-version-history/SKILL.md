---
name: update-version-history
description: Add the branch being merged, and any merged PRs not yet listed, to VERSION_HISTORY.md, newest first. Run it before every PR. Use on /update-version-history, or before writing a merge with /write-merge.
---

# Update Version History

Keep `VERSION_HISTORY.md` (repo root) current. Every branch gets its row before its PR is opened, so the row travels in the PR it describes. Run this before every PR, and again if more work lands on the branch.

## Steps

- Read the top row of the table (the newest date and description)
- `git fetch origin main` (skip if it fails), then list merges on main newer than that row: `git log --first-parent origin/main --merges --format='%h|%cs|%s'` (use local `main` if there is no remote). Skip merges already in the table
- Also include PRs merged into other branches (`Merge pull request #N from .../<branch>`) when they are not yet listed
- Skip sync merges such as `Merge main into <branch>`
- Insert one row per new merge at the top, newest first: `| <date merged> | <branch merged into> | <short description> |`
- Date is the merge commit date (`%cs`); branch is the target of the merge (`main` unless the subject or parents show otherwise)
- Description: under 15 words, taken from the merge title with the `Merge ` prefix dropped, led by the PR's `NNNN` number from its title (see the PR title rule in `docs/workflow/version-control.md`): `0007 clock-card: add the clock card`
- Always add a row for the branch being worked on: today's date (`date +%F`), `main` as the target, and its `NNNN` number from the branch name (the PR number). Never reorder or reword existing rows, and never add a second row for a branch already listed
- Keep the title `# Release Log` and the three-column table (date and branch centered, description left-aligned: `| :---: | :---: | :--- |`); add nothing else to the file
- Don't commit or push
