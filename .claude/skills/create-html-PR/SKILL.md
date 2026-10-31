---
name: create-html-PR
description: Build a brief, non-technical HTML update page from one or more merged pull requests (a count, a number, a range, or a list), with screenshots where they exist. For sharing progress with family, friends or collaborators. Use on /create-html-PR.
---

# Create HTML PR

Turn merged pull requests into one self-contained HTML page that a non-technical reader can skim in a minute or two. Output is a file, not chat text.

## Pick the PRs

- Read the arguments first. Accept any of: a count ("last 3"), one number ("12"), a range ("10-14"), a list ("10, 12, 15"), a date range, or branch names
- If there are no arguments, ask (AskUserQuestion): "Which PRs?" with options such as "Most recent 1", "Most recent 3", "Most recent 5", and let Other take a number, range, or list
- Resolve them to merge records, oldest to newest, and show the user the resolved list (number or branch, date, title) in one line each before building. Don't wait for approval unless something is ambiguous
- If the user names PR numbers that can't be found (gh not logged in and the local merges carry no such numbers), ask once how to map them: log in to gh, or take the N newest merges. If they pick the newest merges, label them with the user's numbers in order, oldest to newest, and say in the final reply that the mapping is assumed and should be checked against GitHub

## Gather the source

Prefer GitHub, fall back to git. Check `gh auth status` once.

- **gh logged in**: `gh pr list --state merged --limit 50 --json number,title,mergedAt,body,url,headRefName`, or `gh pr view <n> --json title,body,mergedAt,url,files`. The PR body is the primary source. Image URLs in the body are candidate screenshots
- **gh not logged in**: use local history. `git log --first-parent main --merges --format='%h|%cs|%s'` lists merges newest first; `git log -1 --format=%B <hash>` gives the merge body; `git diff --stat <hash>^1 <hash>` gives files. Merge subjects may have no PR number, so refer to them by branch and date. Tell the user once that gh isn't logged in and that PR numbers and PR-body text were unavailable
- Cross-check `VERSION_HISTORY.md` for one-line descriptions of the same merges
- Read the diff only when the bullets don't make a change understandable to a layperson

## Find screenshots

Look for real images only; never invent or mock one up.

- Images embedded in the PR body (gh path)
- Images the merge added or changed: `git diff --name-only --diff-filter=AM <hash>^1 <hash>` filtered to png, jpg, jpeg, gif, webp, svg
- Folders that match the work, matched by branch or feature name: `.design/<feature>/screenshots/`, `docs/assets/`
- Prefer a clear, uncluttered shot over detail crops. At most 2 per PR, 6 overall
- Skip anything showing real addresses, credentials, tokens or personal data, and say so if you skipped one for that reason
- If a PR has no usable image, leave it text-only. Don't launch the app to take new shots unless the user asks
- Embed chosen images as base64 `data:` URIs so the HTML is one file the user can send. Downscale or skip any single image over about 1.5 MB; keep the page under about 8 MB total

## Write the content

Audience: people who don't read code. Plain words, short, outcome-first.

- Page order, top to bottom: header banner (title "Update Summary", date range covered, number of updates), then the Overview box (with the Update timeline inside it when there are more than 3 PRs), then one box per PR oldest to newest, then the footer
- Each PR box has a top row: `PR <n> · <date merged> · <branch>` in small muted text on the left, "Submitted by <name>" on the right (accent color, bold, wraps below on narrow screens). Then:
  - A plain-language title (not the branch name or jargon)
  - One sentence on what changed and why it matters to the people using it
  - 2 to 4 bullets maximum, each under 20 words, describing what people will notice. Merge related bullets
  - Screenshot(s) with a short caption, when found
- Drop anything internal: tests, refactors, file names, ports, config keys, library names. Mention fixes in outcome terms ("Saved scenes are back", not "restore scenes dict")
- Keep the whole page to roughly one screen of text per PR, less when possible
- American spelling. No AI mention, no co-author line
- Never include passwords, real addresses, keys or personal data

## Build the HTML

- One self-contained file: inline CSS, no external fonts, scripts, or CDNs, so it opens offline and survives email
- Follow the project's design language (`docs/design/`, tokens in `docs/assets/tokens.css`): inline the token values it needs, both light and dark via `prefers-color-scheme`. Max width about 760px, type 16px+, readable on a phone, prints well
- Images: `max-width: 100%`, rounded corners, thin border, `alt` text, caption beneath
- An "Overview" section at the top: one or two sentences on the theme of the whole set, then up to 3 plain bullets of the biggest outcomes. No table of contents and no anchor links
- **Update timeline** (only when the page covers more than 3 PRs): inside the Overview box, under its bullets, after a thin divider, a small "Update timeline" heading and a simple horizontal timeline. One column per calendar day from the first merge to the last, joined by a thin line. A day with merges gets an accent dot, then each PR under it as "PR <n>" (accent, bold) with a two-to-four-word plain label. A day with none gets a small grey dot and a faded date. Plain HTML and CSS, no script, no links. On phones, show just the PR numbers
- "Submitted by": with gh, the PR `author` (name if present, else login). Without gh, the most frequent commit author on the branch (`git log --format=%an <hash>^1..<hash>^2`). Names only; never emails
- Footer: generated date and range only
- Motion, if any, honors `prefers-reduced-motion`

## Save and report

- Write to `.updates/` at the repo root (create it), named `Release<PR Number>.html`. A single PR: `Release3.html`. A range or several PRs: first and last number joined by a hyphen (`Release3-6.html`). When merges have no PR numbers, use merge dates in the same shape (`Release2026-10-20.html`, or `Release2026-10-20_to_2026-10-26.html` for a span)
- Don't commit, push, or stage. `.updates/` is for the user to share from; mention that it isn't gitignored if `git check-ignore .updates` fails, and let the user decide
- Check the page once in the built-in browser (screenshot): Overview present (with the timeline when there are more than 3 PRs), "Submitted by" top-right, no stray links. Give the clickable path
- Keep any build script (Python, writes the HTML) in the scratchpad, not the repo
- Reply with: the file link, the PRs covered (one line each), which ones got screenshots and which didn't, and anything skipped or uncertain (gh not logged in, images omitted for size or sensitivity)
