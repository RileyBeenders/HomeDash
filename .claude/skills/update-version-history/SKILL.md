---
name: update-version-history
description: Add newly merged PRs to VERSION_HISTORY.md, newest first, always one release behind the branch being merged. Use on /update-version-history, or before writing a merge with /write-merge.
---

# Update Version History

Keep `VERSION_HISTORY.md` (repo root) current. It lists merged PRs only, so it is always one behind: the PR that carries this update is not in the table yet, and the next update adds it.

## Steps

- Read the top row of the table (the newest date and description)
- `git fetch origin main` (skip if it fails), then list merges on main newer than that row: `git log --first-parent origin/main --merges --format='%h|%cs|%s'` (use local `main` if there is no remote). Skip merges already in the table
- Also include PRs merged into other branches (`Merge pull request #N from .../<branch>`) when they are not yet listed
- Skip sync merges such as `Merge main into <branch>`
- Insert one row per new merge at the top, newest first: `| <date merged> | <branch merged into> | <short description> |`
- Date is the merge commit date (`%cs`); branch is the target of the merge (`main` unless the subject or parents show otherwise)
- Description: under 15 words, taken from the merge title with the `Merge ` prefix dropped. Add `(PR #N)` only if the merge subject has a number
- Never add a row for the branch currently being worked on, and never reorder or reword existing rows
- Keep the title `# Release Log` and the three-column table (date and branch centered, description left-aligned: `| :---: | :---: | :--- |`); add nothing else to the file
- Don't commit or push
