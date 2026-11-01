# Data boundary

Data lives on the devices that run HomeDash. The repository holds code, docs and design, and nothing else.

## The rule

- Anything that is data stays on the device that made it: the host PC, a display, a phone. It never moves into the repository, in any branch, for any reason.
- "Data" means everything an installation accumulates or is told: settings, display records, locations, the weather cache, calendar accounts and feeds, tokens and keys, logs, backups, and anything that could identify a person or a household.
- The repository ships **defaults and schemas**, never **values**. A default may be committed (`DEFAULTS` in `server/settings.js`). A value someone chose may not.
- Sample data used by the app before a real source is connected is part of the code and may be committed, but it must be invented, never copied from a real installation.

## Where data goes

| Kind | Lives in | In git |
| --- | --- | --- |
| Server data (settings, caches, log, update choice, backups) | `data/` on the host PC | Ignored |
| Secrets (calendar tokens, API keys) | `data/` on the host PC | Ignored |
| Display-only state (a remembered tab, a draft) | The display's own browser storage | Never leaves the device |
| Code, docs, tokens, defaults | The repository | Tracked |

New server code writes under `data/` only. If a place for data has to move, it moves to another folder that is also ignored.

## When something new could be personal

Before a branch adds a file, folder, fixture or log field that could hold personal or customer data, stop and ask whether its path should be added to `.gitignore`. The question is asked first, as a prompt, and nothing is committed until it is answered.

Treat as possibly personal: names, addresses and coordinates, calendar events, account identifiers, tokens and passwords, device names that identify a person, and exports, dumps or screenshots taken from a real installation.

When the answer is yes, the ignore rule goes in the same commit that introduces the path. When it is no, say why in the pull request.

## Why

Updating, branching and sharing the repository must never expose or overwrite what a household has set up, and a fresh checkout must start clean. See [Updates](../system/updates.md) for how updating keeps to this.
