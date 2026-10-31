# CLAUDE.md

HomeDash: a home dashboard hosted on one PC, shown on small portrait touch displays and browsers. The app is not built yet; this repo currently holds the design language, Claude skills and docs.

## Rules

- Before any UI work, apply the `design-language` skill: tokens in `docs/assets/tokens.css`, rules in `docs/design/`. Never hard-code a value that has a token.
- The design language pages and tokens must not name the product.
- No holiday or seasonal themes.
- Frontend: hand-written, no build step, no CDN, works offline.
- Docs are part of the product: update `docs/` (served by MkDocs from `mkdocs/mkdocs.yml`) alongside user-visible changes.
- Windows/PowerShell is the dev shell.
- `.reference-temp/` is a throwaway template folder and will be deleted. Never copy its data into the project.

## Skills

`.claude/skills/` with a slash command each in `.claude/commands/`; see `docs/workflow/skills-and-commands.md`.
