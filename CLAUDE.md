# CLAUDE.md

HomeDash: a home dashboard hosted on one PC, shown on small portrait touch displays and browsers. `server/` is a plain Node server with no dependencies, `app/` is the hand-written frontend, `docs/` holds the design language and the docs site. The server is called `homedash`: `.\homedash.ps1 start|stop|restart|status` (see `docs/system/running.md`).

## Rules

- Before any UI work, apply the `design-language` skill: tokens in `docs/assets/tokens.css`, rules in `docs/design/`. Never hard-code a value that has a token.
- The design language pages and tokens must not name the product.
- No holiday or seasonal themes.
- Frontend: hand-written, no build step, no CDN, works offline.
- Docs are part of the product: update `docs/` (served by MkDocs from `mkdocs/mkdocs.yml`) alongside user-visible changes.
- `main` is stable. Work on a `<type>/<name>` branch and merge by pull request with a merge commit; see `docs/workflow/version-control.md`. Commit to `main` directly only during the scaffold phase, and only when asked.
- No AI attribution in any commit or pull request, anywhere in the repo: no co-author trailer, no "Generated with" line, no mention of an AI tool in a summary, description or title.
- Windows/PowerShell is the dev shell.
- `.reference-temp/` is a throwaway template folder and will be deleted. Never copy its data into the project.

## Skills

`.claude/skills/` with a slash command each in `.claude/commands/`; see `docs/workflow/skills-and-commands.md`.
