# CLAUDE.md

HomeDash: a home dashboard hosted on one PC, shown on small portrait touch displays and browsers. `server/` is a plain Node server with no dependencies, `app/` is the hand-written frontend, `docs/` holds the design language and the docs site. The server is called `homedash`: `.\homedash.ps1 start|stop|restart|status` (see `docs/system/running.md`).

## Rules

- Before any UI work, apply the `design-language` skill: tokens in `docs/assets/tokens.css`, rules in `docs/design/`. Never hard-code a value that has a token.
- The design language pages and tokens must not name the product.
- No holiday or seasonal themes.
- Frontend: hand-written, no build step, no CDN, works offline.
- Docs are part of the product: update `docs/` (served by MkDocs from `mkdocs/mkdocs.yml`) alongside user-visible changes.
- `main` is stable. Work on a `NNNN-<type>/<name>` branch (the number is the branch's pull request number, counting up from `0001`) and merge by pull request with a merge commit; see `docs/workflow/version-control.md`. The scaffold phase is over: never commit to `main` directly.
- No AI attribution in any commit or pull request, anywhere in the repo: no co-author trailer, no "Generated with" line, no mention of an AI tool in a summary, description or title.
- Before opening a pull request, add the branch's row (number, date, description) to `VERSION_HISTORY.md` with `/update-version-history`; the row travels in its own PR.
- Data lives on the devices that run HomeDash (`data/` on the host PC) and never moves into the repository. Before adding a file, folder, fixture or log field that could hold personal or customer data, ask the user with a pop-up (AskUserQuestion) whether its path should go in `.gitignore`, and commit nothing until they answer. See `docs/workflow/data-boundary.md`.
- Servers on the `stable` channel (`main`) update themselves, so `main` must work at every merge and an update must never change anything under `data/`. See `docs/system/updates.md`.
- Windows/PowerShell is the dev shell.
- `.reference-temp/` is a throwaway template folder and will be deleted. Never copy its data into the project.

## Skills

`.claude/skills/` with a slash command each in `.claude/commands/`; see `docs/workflow/skills-and-commands.md`.
