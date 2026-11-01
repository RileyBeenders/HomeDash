# System overview

- **Server**: one always-on PC runs `homedash`, a plain Node program with no dependencies. It serves every page, keeps the settings, fetches the weather, pushes changes to open displays and writes the log. See [Running the server](running.md).
- **Displays**: small computers with portrait touch screens (Raspberry Pis, old phones and tablets) open a page in kiosk mode and only display it. Nothing is installed on them.
- **Phones and tablets**: any browser on the network opens the same pages.
- **Identity**: a kiosk is known by the `?display=` name in its launch URL, normally the machine's hostname. A browser opened by hand gets a generated id and can be named in settings.
- **Settings**: kept on the server and shared by every display until a display chooses its own. See [Dashboard](dashboard.md).
- **Push, not poll**: the server tells displays when something changed over server-sent events; a display never polls.
- **Offline**: no CDN and no web fonts; everything is served from the server. Only the server talks to the internet, for the weather.
- **Updates**: a server on the `stable` channel (`main`) updates itself on a schedule; a server locked to a branch or a version does not. Displays pick up changes by reloading, and an update never touches saved data. Planned, not built; see [Updates](updates.md).
- **Data**: everything an installation saves stays on its own devices and never goes into the repository. See [Data boundary](../workflow/data-boundary.md).
- **Docs**: this site is built from `docs/` and served by the server at `/docs/`.

## In the pipeline

- Managing the Raspberry Pis from the server: health, configuration, security updates, reboot. Phones and tablets stay browser-only.
- A system page that lists displays and their health.
- Calendar accounts (Microsoft, Google) and calendar feeds.
- A sleep mode once there is hardware to detect motion.
