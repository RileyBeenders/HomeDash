// Everything the page knows: which display this is, its settings, the weather,
// and the server link. The server is the source of truth; this is a cache that
// the server-sent event stream keeps fresh.

const listeners = new Map();

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event).delete(fn);
}

export function emit(event, data) {
  for (const fn of listeners.get(event) || []) fn(data);
}

// A display is known by the id in its launch URL (?display=hallway-1, set by
// the kiosk launcher to the machine's hostname). A browser opened by hand gets
// a generated id kept locally, and can be named in settings.
const params = new URLSearchParams(location.search);
export const isKiosk = params.has('display');
export const displayId = (() => {
  const fromUrl = (params.get('display') || '').replace(/[^\w.-]/g, '').slice(0, 64);
  if (fromUrl) return fromUrl;
  try {
    let id = localStorage.getItem('display-id');
    if (!id) {
      id = 'browser-' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('display-id', id);
    }
    return id;
  } catch {
    return 'browser-' + Math.random().toString(36).slice(2, 8);
  }
})();

export const state = {
  settings: null,
  display: { id: displayId, name: displayId, own: false },
  weather: null,
  connection: 'connecting', // connecting | online | offline
  tier: 'high',
};

const q = (path, params) => {
  const url = new URL(path, location.origin);
  url.search = new URLSearchParams({ display: displayId, ...params }).toString();
  return url;
};

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) throw new Error(`${options.method || 'GET'} ${path} ${res.status}`);
  return res.json();
}

function applySettings(payload) {
  state.settings = payload.settings;
  state.display = payload.display;
  emit('settings', state.settings);
}

export async function loadSettings() {
  applySettings(await request(q('/api/settings')));
  return state.settings;
}

// Optimistic: the screen changes at once, the server confirms after.
export async function patchSettings(patch) {
  applySettings({ settings: merge(state.settings, patch), display: state.display });
  applySettings(await request('/api/settings', { method: 'PATCH', body: { display: displayId, patch } }));
}

export async function patchDisplay(fields) {
  applySettings(await request('/api/display', { method: 'PATCH', body: { display: displayId, ...fields } }));
}

export async function setLocation(query) {
  return request('/api/location', { method: 'POST', body: { display: displayId, query } });
}

export async function loadWeather() {
  state.weather = await request('/api/weather');
  emit('weather', state.weather);
  return state.weather;
}

export async function loadCalendar(from, to) {
  return request(q('/api/calendar', { from: from.toISOString(), to: to.toISOString() }));
}

// The event stream. EventSource reconnects on its own; we only track whether
// the link is up so Diagnostics and the "reconnecting" state can show it.
export function connect() {
  const es = new EventSource(q('/api/events'));
  es.addEventListener('open', () => setConnection('online'));
  es.addEventListener('error', () => setConnection('offline'));
  es.addEventListener('settings', (e) => {
    const { displays = [] } = safeJson(e.data);
    if (displays.includes(displayId)) loadSettings().catch(() => {});
  });
  es.addEventListener('weather', () => loadWeather().catch(() => {}));
  return es;
}

function setConnection(value) {
  if (state.connection === value) return;
  state.connection = value;
  emit('connection', value);
}

function safeJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

function merge(base, patch) {
  const out = { ...(base || {}) };
  for (const [k, v] of Object.entries(patch || {})) {
    const plain = v && typeof v === 'object' && !Array.isArray(v);
    out[k] = plain && out[k] && typeof out[k] === 'object' ? merge(out[k], v) : v;
  }
  return out;
}
