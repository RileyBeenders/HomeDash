// Each display measures itself: frame time, long tasks, heap, connection,
// errors. Summaries go to the server every 30 seconds, a worker sends the
// heartbeat so a frozen page still shows up as silent, and the quality tier
// drops when the screen can't keep up.

import { state, displayId, on } from './state.js';

const WINDOW_MS = 10_000;
const BATCH_MS = 30_000;
const HEARTBEAT_MS = 15_000;
const WARN_P95 = 25;
const ERROR_P95 = 50;
const SUSPENDED_MS = 400;

export function startPerf({ onTier }) {
  const lines = [];
  const windows = []; // last few { avg, p95, dropped }
  let deltas = [];
  let last = performance.now();
  let windowStart = last;
  let frameBudget = 1000 / 60;
  let longTasks = 0;
  let warnStreak = 0;
  let cleanSince = performance.now();
  let lastRaise = 0;
  let errorStreak = 0;
  let forced = null; // 'high' | 'low' when the setting isn't Auto

  // Learn the display's refresh rate from the first second of frames.
  const probe = [];
  function loop(now) {
    const dt = now - last;
    last = now;
    if (probe.length < 60) {
      probe.push(dt);
      if (probe.length === 60) {
        const sorted = [...probe].sort((a, b) => a - b);
        frameBudget = Math.max(4, sorted[Math.floor(sorted.length / 2)]);
      }
    }
    // A gap this long is a page the browser throttled or suspended (a covered
    // window, a pane in the background), not a screen that can't keep up.
    if (!document.hidden && dt < SUSPENDED_MS) deltas.push(dt);
    if (now - windowStart >= WINDOW_MS) {
      closeWindow();
      windowStart = now;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function closeWindow() {
    if (deltas.length < 10) {
      deltas = [];
      return;
    }
    const sorted = [...deltas].sort((a, b) => a - b);
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const dropped = sorted.filter((d) => d > frameBudget * 1.5).length / sorted.length;
    deltas = [];
    const w = { avg, p95, dropped, at: Date.now() };
    windows.push(w);
    if (windows.length > 30) windows.shift();
    state.perf = { fps: Math.round(1000 / avg), p95: Math.round(p95), dropped: Math.round(dropped * 100) };
    judge();
  }

  // Tier rules: two warning windows in a row drop to low; ten clean minutes
  // raise it, never more than once an hour.
  function judge() {
    // A warning is 30 seconds of bad frames, not one rough window.
    const recent = windows.slice(-3);
    const p95 = Math.max(...recent.map((w) => w.p95));
    const warn = recent.length === 3 && recent.every((w) => w.p95 > WARN_P95);
    if (warn) {
      warnStreak += 1;
      cleanSince = performance.now();
      lines.push({ level: 'warn', fields: { frame_p95: `${Math.round(p95)}ms`, window: '30s', tier: state.tier } });
    } else warnStreak = 0;

    if (forced) return setTier(forced, 'setting');
    if (warn && warnStreak >= 2 && state.tier === 'high') return setTier('low', `frame_p95=${Math.round(p95)}ms`);
    if (state.tier === 'low' && p95 > ERROR_P95) lines.push({ level: 'error', fields: { frame_p95: `${Math.round(p95)}ms`, tier: 'low' } });
    const clean = performance.now() - cleanSince > 10 * 60_000;
    const allowed = Date.now() - lastRaise > 60 * 60_000;
    if (state.tier === 'low' && clean && allowed) {
      lastRaise = Date.now();
      setTier('high', 'clean_10m');
    }
  }

  function setTier(tier, reason) {
    if (state.tier === tier) return;
    const from = state.tier;
    state.tier = tier;
    document.documentElement.dataset.quality = tier;
    lines.push({ level: 'info', fields: { tier: `${from}->${tier}`, reason } });
    onTier?.(tier);
  }

  // Long tasks.
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (e.duration > 100) longTasks += 1;
    }).observe({ type: 'longtask', buffered: true });
  } catch {
    // Not every browser reports long tasks.
  }

  // Errors: a page that errors twice in a row reloads itself.
  const onError = (fields) => {
    lines.push({ level: 'error', fields });
    errorStreak += 1;
    flush();
    if (errorStreak >= 2) setTimeout(() => location.reload(), 2000);
  };
  addEventListener('error', (e) => onError({ error: e.message || 'error', at: `${e.filename}:${e.lineno}` }));
  addEventListener('unhandledrejection', (e) => onError({ error: String(e.reason?.message || e.reason || 'rejection') }));

  // Heartbeat from a worker thread.
  try {
    const src = `setInterval(() => fetch(${JSON.stringify(location.origin + '/api/heartbeat?display=' + encodeURIComponent(displayId))}).catch(() => {}), ${HEARTBEAT_MS});`;
    new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
  } catch {
    setInterval(() => fetch(`/api/heartbeat?display=${encodeURIComponent(displayId)}`).catch(() => {}), HEARTBEAT_MS);
  }

  // Batches.
  let lastHeap = 0;
  let heapHourAgo = 0;
  let heapHourAt = Date.now();
  function flush() {
    const heap = performance.memory?.usedJSHeapSize || 0;
    if (heap) {
      lastHeap = heap;
      if (Date.now() - heapHourAt > 60 * 60_000) {
        if (heapHourAgo && heap > heapHourAgo * 1.3) lines.push({ level: 'warn', fields: { heap_growth: `${Math.round((heap / heapHourAgo - 1) * 100)}%`, window: '1h' } });
        heapHourAgo = heap;
        heapHourAt = Date.now();
      } else if (!heapHourAgo) heapHourAgo = heap;
      state.perf = { ...(state.perf || {}), heapMb: Math.round(heap / 1048576) };
    }
    if (longTasks >= 3) lines.push({ level: 'warn', fields: { long_tasks: longTasks, window: '30s' } });
    longTasks = 0;
    if (!lines.length) return;
    const batch = lines.splice(0, lines.length);
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display: displayId,
        tier: state.tier,
        screen: `${screen.width}x${screen.height}@${devicePixelRatio}`,
        lines: batch,
      }),
      keepalive: true,
    }).catch(() => {});
  }
  setInterval(flush, BATCH_MS);

  // Five-minute summary line.
  setInterval(() => {
    const p = state.perf;
    if (p) lines.push({ level: 'info', fields: { frame_avg: `${Math.round(1000 / (p.fps || 60))}ms`, frame_p95: `${p.p95}ms`, heap_mb: p.heapMb, tier: state.tier, uptime_min: Math.round(performance.now() / 60_000) } });
  }, 5 * 60_000);

  on('connection', (c) => lines.push({ level: c === 'offline' ? 'warn' : 'info', fields: { connection: c } }));
  lines.push({ level: 'info', fields: { event: 'loaded', screen: `${screen.width}x${screen.height}@${devicePixelRatio}`, agent: navigator.userAgent.slice(0, 60) } });
  setTimeout(flush, 2000);

  return {
    // Settings: Auto lets the rules decide; High or Low pin the tier.
    setQuality(q) {
      forced = q === 'auto' ? null : q;
      if (forced) setTier(forced, 'setting');
    },
  };
}
