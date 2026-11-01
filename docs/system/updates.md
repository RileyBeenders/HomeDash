# Updates

How a running server keeps itself current. Built. The 03:30 check time and the 30-second rollback window are defaults the owner has not confirmed; both can be changed per server in [the update file](#the-update-file).

## Channels

Each server follows one channel, chosen on that server.

| Channel | Follows | Updates itself |
| --- | --- | --- |
| `stable` (default) | `main`, the stable branch | Yes |
| Version lock | One release tag, such as `v1.2.0` | No |
| Branch lock | One named branch, such as `0007-feature/clock-card` | No |

A new install is on `stable`. Locking is a deliberate choice for testing a branch or staying on a release that works; a locked server never moves until it is unlocked or the lock is changed by hand. Moving off a lock back to `stable` updates it on the next check.

### The update file

The choice is kept in `data/update.json` on the host PC, so it survives updates and is never in the repository. The file is optional: with none, the server is on `stable`. A file that cannot be read, or names another channel, updates nothing.

```json
{ "channel": "stable" }
```

```json
{ "channel": "version", "ref": "v1.2.0" }
```

```json
{ "channel": "branch", "ref": "0007-feature/clock-card" }
```

Two optional keys apply to any channel: `"checkAt": "03:30"` (local time of the daily check) and `"rollbackSeconds": 30`.

A lock says what the server should stay on; it does not move the checkout. The server fetches and shows the lock but never switches anything, so put the checkout where you want it by hand (`git switch --detach v1.2.0`). Changing the file back to `stable` switches the checkout to `main` on the next check, provided no tracked file has been edited, and then it updates.

## Data is never touched

An update changes code and docs only. It must leave every file under `data/` exactly as it was.

- The server runs from a git checkout, and `data/` is ignored by git. An update is a fast-forward of tracked files (`git fetch`, then `git merge --ff-only`). It never runs `git clean`, `git reset --hard` or `git checkout --` over the working folder.
- If a tracked file has been edited locally, the update stops, logs the files, and leaves them as they are.
- Before applying an update, `settings.json` is copied to `data/backups/` as `settings-YYYYMMDD-HHMMSS.json`, keeping the last five.
- Everything the updater keeps (`update-state.json`, `update-pending.json`, `backups/`) is inside `data/`, so none of it can reach the repository.
- Going back is `git reset --keep`, which moves tracked files only, refuses to overwrite a local edit and never touches `data/`.
- Changes to the shape of saved data are additive. New settings arrive through `DEFAULTS` and are merged under what is saved, as `server/settings.js` already does. Removing or renaming a saved key needs a migration that runs on load and keeps the old value until the new one is written.
- See [Data boundary](../workflow/data-boundary.md).

## How a check works

1. Five seconds after it starts, and once a day at a quiet hour (default 03:30 local), the server runs `git fetch origin`. The Check now button does the same.
2. On `stable`, if `origin/main` is ahead of the running commit and the checkout can fast-forward to it, it is a candidate. Locked channels stop here. A checkout that is not on `main`, or that has commits `main` lacks, is left alone and the reason is logged.
3. The server waits until no display has been touched for three minutes (displays report a touch at most every 20 seconds), unless a commit in the update has a subject starting `Security` or containing `[security]`. Started with `homedash.ps1 start` or `run` it applies updates. Started any other way, such as `node server/server.js`, it only reports that one is ready, because nothing would restart it.
4. It stops if a tracked file is modified, copies settings to `data/backups/`, writes `data/update-pending.json`, runs `git merge --ff-only`, and exits with code 75.
5. The supervisor in `homedash.ps1` sees code 75 and launches the server again. With `update-pending.json` present it then waits for `GET /api/heartbeat`. If the new server exits or stays silent for 30 seconds, the supervisor stops it, runs `git reset --keep` back to the previous commit, logs `update=rejected` with the commit, records it in `data/update-state.json` and starts the server again. A rejected commit is not tried again; the server waits for a newer one.
6. Each time a display opens the event stream the server sends `version` with the commit it runs. A display that sees it change reloads itself, so a display that was reconnecting during the restart still catches up. A display never fetches updates.

The check needs the internet. With none, the server skips it, logs `update=check_skipped reason=no_internet`, and keeps running the version it has.

```
2026-11-02 03:30:00 INFO  update=available from=b9ea990 to=6c310b9 commits=1 security=false
2026-11-02 03:34:12 INFO  update=applied from=b9ea990 to=6c310b9 backup=settings-20261102-033412.json restarting=yes
2026-11-02 03:34:13 INFO  update=verified commit=6c310b9
```

A bad commit logs this instead of `verified`:

```
2026-11-02 03:34:13 ERROR update=rejected commit=b08f75c reason=exited_during_startup
2026-11-02 03:34:13 WARN  update=rolled_back restored=6c310b9 rejected=b08f75c
```

## What the server needs

- `git` on the host PC and a checkout that has `origin`.
- A supervisor so a restart brings the server back. `homedash.ps1` is it: `start` and `run` keep the server running and relaunch it when it exits for an update. The supervisor is part of the script, so a change to `homedash.ps1` takes effect the next time the server is started with `homedash.ps1 restart`; an update still applies and verifies with the supervisor that is already running.
- Settings → System → Updates shows the channel, the running version, the last check, the next check and a Check now button. The page only reads and asks; the channel is chosen on the host PC.

## Releases

`stable` follows every merge into `main`, so a merge to `main` is a release for those servers. Tags (`vMAJOR.MINOR.PATCH`, see [Version control](../workflow/version-control.md)) mark the points a version lock can pin to. Because stable servers update themselves, `main` has to work at every merge.
