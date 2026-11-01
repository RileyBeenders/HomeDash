# Updates

Design for how a running server keeps itself current. Planned, not built; it ships on its own `feature/` branch.

## Channels

Each server follows one channel, chosen on that server.

| Channel | Follows | Updates itself |
| --- | --- | --- |
| `stable` (default) | `main`, the stable branch | Yes |
| Version lock | One release tag, such as `v1.2.0` | No |
| Branch lock | One named branch, such as `0007-feature/clock-card` | No |

A new install is on `stable`. Locking is a deliberate choice for testing a branch or staying on a release that works; a locked server never moves until it is unlocked or the lock is changed by hand. Moving off a lock back to `stable` updates it on the next check.

The choice is kept in `data/update.json` on the host PC, so it survives updates and is never in the repository:

```json
{ "channel": "stable" }
```

```json
{ "channel": "version", "ref": "v1.2.0" }
```

```json
{ "channel": "branch", "ref": "0007-feature/clock-card" }
```

## Data is never touched

An update changes code and docs only. It must leave every file under `data/` exactly as it was.

- The server runs from a git checkout, and `data/` is ignored by git. An update is a fast-forward of tracked files (`git fetch`, then `git merge --ff-only`). It never runs `git clean`, `git reset --hard` or `git checkout --` over the working folder.
- If a tracked file has been edited locally, the update stops and says so instead of overwriting it.
- Before applying an update, `settings.json` is copied to `data/backups/`, keeping the last five.
- Changes to the shape of saved data are additive. New settings arrive through `DEFAULTS` and are merged under what is saved, as `server/settings.js` already does. Removing or renaming a saved key needs a migration that runs on load and keeps the old value until the new one is written.
- See [Data boundary](../workflow/data-boundary.md).

## How a check works

1. On start, and once a day at a quiet hour (default 03:30 local), the server fetches `origin`.
2. On `stable`, if `origin/main` is ahead of the running commit, it is a candidate. Locked channels stop here.
3. The server waits until no display has touched the screen for a few minutes, unless the update is a security fix.
4. It backs up settings, fast-forwards, and restarts.
5. After the restart it must answer `GET /api/heartbeat` within 30 seconds. If it does not, it returns to the previous commit and restarts again, and the failure is logged with the commit it rejected.
6. Open displays are told over the event stream and reload themselves. A display never fetches updates.

The check needs the internet. With none, the server skips it, logs that it did, and keeps running the version it has.

## What the server needs

- `git` on the host PC and a checkout that has `origin`.
- A supervisor so a restart brings the server back: `homedash.ps1` keeps it running and relaunches it when it exits for an update.
- A settings page under Settings → System showing the channel, the running version, the last check and a button to check now.

## Releases

`stable` follows every merge into `main`, so a merge to `main` is a release for those servers. Tags (`vMAJOR.MINOR.PATCH`, see [Version control](../workflow/version-control.md)) mark the points a version lock can pin to. Because stable servers update themselves, `main` has to work at every merge.
