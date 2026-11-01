# HomeDash

Home dashboard hosted on one PC and shown on small portrait touch displays and any browser on the network.

Status: the server and the first pages (Calendar, Home, Weather) with settings are built. Calendar accounts, background images and display management are next.

## Run

Needs Node 20 or newer. No packages to install.

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

The server is called `homedash` and listens on `http://localhost:8081` (set `PORT` to change it; 8080 is avoided because other software often holds it). `start` runs it in the background; `.\homedash.ps1 run` runs it in the current window instead. A kiosk opens `http://<server>:8081/?display=<hostname>`; a phone opens `http://<server>:8081/`. Details in [`docs/system/running.md`](docs/system/running.md).

## Layout

- `server/` the Node server: static files, settings, weather, events, log
- `app/` the dashboard, hand-written HTML, CSS and JS with no build step
- `docs/` the docs site and the design language: [`docs/design/`](docs/design/index.md), tokens in [`docs/assets/tokens.css`](docs/assets/tokens.css), live demo in [`docs/assets/style-guide.html`](docs/assets/style-guide.html)
- `.claude/` skills and commands, see [`docs/workflow/skills-and-commands.md`](docs/workflow/skills-and-commands.md)
- Version control: [`docs/workflow/version-control.md`](docs/workflow/version-control.md)
- Docs site: `pip install mkdocs-material`, then `mkdocs serve -f mkdocs/mkdocs.yml`, or `mkdocs build -f mkdocs/mkdocs.yml` for the server to serve it at `/docs/`
