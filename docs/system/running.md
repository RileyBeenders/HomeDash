# Running the server

One program, called `homedash`, serves everything: the dashboard, the settings, the weather, the docs and the log. It is plain Node with no packages to install.

## Needs

- Node 20 or newer on the host PC.
- Nothing else. There is no build step and no `npm install`.

## Start, stop, restart

From the repository folder in PowerShell:

```powershell
.\homedash.ps1 start
```

```powershell
.\homedash.ps1 stop
```

```powershell
.\homedash.ps1 restart
```

```powershell
.\homedash.ps1 status
```

`start` runs the server in the background, under a supervisor, and prints the address, normally `http://localhost:8081`. (8080 is not the default because other software, such as the NI Application Web Server, often holds it.) `stop` ends it. `restart` is the two in a row, for picking up a change to the server code. `status` says whether it is running.

To run it in the current window instead, with Ctrl+C to stop:

```powershell
.\homedash.ps1 run
```

Set `PORT` in the environment before starting to use another port. Each port runs its own instance, with its own `data\homedash-<port>.pid`.

The supervisor relaunches the server when it exits for an [update](updates.md) and rolls the update back if the new version does not answer in time. `stop` ends the supervisor and the server together.

The same server is the dev server. There is no separate dev mode: edit a file under `app/` and reload the display; edit a file under `server/` and run `restart`.

## What it writes

Everything the server keeps is under `data/`, which is not in version control and is never changed by an [update](updates.md):

| File | Holds |
| --- | --- |
| `settings.json` | Shared settings, each display's record and any per-display settings |
| `weather.json` | The last weather answer, so a display shows something while the internet is down |
| `log.txt` | The log, one line per event, with the display id on every line about a display |
| `update.json` | Which update channel this server follows; optional, written by hand, see [Updates](updates.md) |
| `update-state.json` | The last check, the last update, any rejected commit |
| `update-pending.json` | Present only between applying an update and the new server answering |
| `backups/` | The last five copies of `settings.json`, made before each update |
| `homedash-<port>.pid`, `server-<port>.*.txt` | The supervisor's process id and the server's output |

## Opening a display

- A kiosk opens `http://<server>:8081/?display=<name>`. The name is how the server tells displays apart in settings and in the log; use the machine's hostname.
- A phone or tablet opens `http://<server>:8081/` and gets a generated id, which can be named under Settings → This display.
- The docs site is at `http://<server>:8081/docs/` once it has been built with `mkdocs build -f mkdocs/mkdocs.yml`.

## Routes

| Route | Does |
| --- | --- |
| `GET /api/settings?display=` | The settings a display runs with |
| `PATCH /api/settings` | Change settings for a display, or for all when it shares them |
| `PATCH /api/display` | Rename a display or switch it to its own settings |
| `POST /api/location` | Turn a typed place into coordinates for the weather |
| `GET /api/weather` | The cached forecast |
| `GET /api/calendar?from=&to=` | Events in a range (sample events until a calendar is connected) |
| `GET /api/events?display=` | The server-sent event stream a display listens to; sends `version` when it opens and `reload` on request |
| `GET /api/displays` | Every display the server has seen |
| `GET /api/update` | Channel, running version, last and next check, any update waiting, any rejected commit |
| `POST /api/update/check` | Check now; answers at once, read the result from `GET /api/update` |
| `POST /api/activity?display=` | A display reports a touch, so an update waits for a quiet moment |
| `GET /api/heartbeat`, `POST /api/telemetry` | What each display reports about itself, see [Performance](performance.md) |
