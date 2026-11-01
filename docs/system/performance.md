# Performance

The target is the display's refresh rate with no visible stutter, for days at a time. The display side is built (`app/js/perf.js`); thresholds are the starting values below and are tuned on real displays.

## Building for it

- Animate `transform` and `opacity` only (see [Motion](../design/motion.md)).
- Update only what changed. Write a number to the page when the value changes, not on a timer.
- Use one `requestAnimationFrame` loop for anything per-frame. No polling under one second; the server pushes changes (server-sent events).
- Keep two glass layers visible at most. Glass blur is the most expensive thing on the page.
- Pages that are off screen do no work: `content-visibility: auto`, and timers and listeners paused until the page is near.
- Images are resized on the server to the screen size, decoded off the main thread, and never larger than needed.
- No unbounded lists. Anything that grows is capped.

## Quality tiers

The page carries `data-quality="high"` or `"low"` on `<html>`. Low turns off glass blur (the floating layer falls back to its solid fill), the flip clock's fold (digits swap instead) and entrance animation, and keeps everything else. Settings choose **Auto**, **High** or **Low**; Auto starts high.

- **Down:** two warning windows in a row drops the tier to low. A warning window is 30 seconds (three 10-second samples) all over the p95 threshold, so one rough sample never drops the tier.
- **Up:** only after ten clean minutes, and never more than once an hour, so it can't flap.
- Every change is logged with its reason.

## Monitoring

Each display measures itself and reports to the server, which writes to the main log.

| Signal | How | Why |
| --- | --- | --- |
| Frame time | `requestAnimationFrame` deltas, summarized per 10-second window as average, p95 and dropped-frame share | Stutter |
| Long tasks | `PerformanceObserver` for `longtask` | Frozen interaction |
| Memory | Heap size where the browser exposes it, sampled each minute | Leaks over days |
| Connection | Heartbeat round trip every 15 seconds | Dead or slow server link |
| Errors | `error` and `unhandledrejection` events | Bugs |
| Device | Screen size, pixel ratio, browser, uptime, quality tier | Context for everything above |

Reports are small JSON batches posted to the server every 30 seconds, plus a heartbeat. A worker thread sends the heartbeat so a frozen page still shows up as silent.

## Log levels

Starting thresholds, to be tuned on the real displays.

| Level | When |
| --- | --- |
| **Info** | Summary every 5 minutes per display: average and p95 frame time, heap, tier. Tier changes. Display connects or reloads. |
| **Warning** | p95 frame time over 25ms across a 30-second window. Three long tasks over 100ms in a minute. Heap grown by 30% over an hour. |
| **Error** | p95 over 50ms after dropping to low. Any unhandled error. No heartbeat for 60 seconds. |

Every line carries the display name and id:

```text
2026-11-02 19:04:11 WARN  display=hallway-1 frame_p95=31ms window=30s tier=high
2026-11-02 19:04:41 WARN  display=hallway-1 frame_p95=34ms window=30s tier=high -> low
2026-11-02 19:09:12 ERROR display=hallway-1 heartbeat_lost=60s
```

## Recovery

- A page that logs an error twice in a row reloads itself.
- A display that stops sending heartbeats is marked offline in the log and in Diagnostics, and shown a calm "reconnecting" state when it returns.
- Restarting the display computer itself is outside the page's reach. Doing it from the server is planned for the Raspberry Pis; phones and tablets only ever reload.
