// The one program on the host PC. It serves the app and the docs, keeps the
// settings, fetches the weather, pushes changes to every open display and
// writes the log. Plain Node, no dependencies.
//
//   node server/server.js            (PORT=8081 by default; 8080 is often taken)

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticServer } from './static.js';
import { Settings } from './settings.js';
import { Weather } from './weather.js';
import { eventsBetween } from './calendar.js';
import { Hub } from './sse.js';
import { Log } from './log.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const PORT = Number(process.env.PORT) || 8081;

const log = new Log(DATA);
const hub = new Hub();
const settings = new Settings(DATA);
const weather = new Weather(DATA, log, () => hub.send('weather'));

const serveStatic = staticServer([
  { prefix: '/', dir: path.join(ROOT, 'app') },
  { prefix: '/assets/', dir: path.join(ROOT, 'docs', 'assets') },
  { prefix: '/docs/', dir: path.join(ROOT, 'site') },
]);

await settings.ready;
await weather.ready;
log.setLevel(settings.data.logLevel);
weather.configure(settings.data.shared.weather);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (await serveStatic(req, res, url.pathname)) return;
    notFound(res);
  } catch (err) {
    log.error({ request: url.pathname, reason: err.message });
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'server' }));
  }
});

server.listen(PORT, () => log.info({ server: 'listening', port: PORT }));

// ------------------------------------------------------------------- API

async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  const displayId = clean(url.searchParams.get('display'));

  switch (route) {
    case 'GET /api/events': {
      // One stream per display. Opening it counts as the display checking in.
      if (displayId) settings.touch(displayId, { agent: req.headers['user-agent'] });
      hub.open(req, res, { display: displayId });
      log.info({ display: displayId, event: 'connected', clients: hub.size });
      req.on('close', () => log.info({ display: displayId, event: 'disconnected', clients: hub.size }));
      return;
    }

    case 'GET /api/settings': {
      if (!displayId) return bad(res, 'display required');
      settings.touch(displayId);
      return json(res, settings.effective(displayId));
    }

    case 'PATCH /api/settings': {
      const body = await readJson(req);
      if (!body.display) return bad(res, 'display required');
      const id = clean(body.display);
      const changed = await settings.patch(id, body.patch || {});
      if (body.patch?.weather) {
        const eff = settings.effective(id).settings.weather;
        weather.configure(eff);
      }
      log.info({ display: id, settings: 'changed', keys: Object.keys(body.patch || {}).join(',') });
      hub.send('settings', { displays: changed });
      return json(res, settings.effective(id));
    }

    case 'PATCH /api/display': {
      const body = await readJson(req);
      const id = clean(body.display);
      if (!id) return bad(res, 'display required');
      if (typeof body.name === 'string') await settings.rename(id, body.name);
      if (typeof body.own === 'boolean') await settings.setOwn(id, body.own);
      log.info({ display: id, display_record: 'changed', name: body.name, own: body.own });
      hub.send('settings', { displays: [id] });
      return json(res, settings.effective(id));
    }

    case 'POST /api/location': {
      // A typed place name becomes coordinates on the server; displays never
      // talk to the internet.
      const body = await readJson(req);
      const id = clean(body.display);
      if (!id) return bad(res, 'display required');
      const query = String(body.query || '').trim();
      let location = null;
      if (query) {
        location = await weather.geocode(query).catch((err) => {
          log.warn({ geocode: 'failed', reason: err.message });
          return null;
        });
        if (!location) return json(res, { ok: false, reason: 'not-found' });
      }
      const changed = await settings.patch(id, { weather: { location } });
      weather.configure(settings.effective(id).settings.weather);
      log.info({ display: id, location: location?.name || 'cleared' });
      hub.send('settings', { displays: changed });
      return json(res, { ok: true, location });
    }

    case 'GET /api/weather':
      return json(res, weather.current());

    case 'GET /api/calendar': {
      const from = new Date(url.searchParams.get('from') || Date.now());
      const to = new Date(url.searchParams.get('to') || from.getTime() + 86_400_000);
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return bad(res, 'bad range');
      return json(res, { events: eventsBetween(from, to), source: 'sample' });
    }

    case 'GET /api/displays':
      return json(res, { displays: settings.list(), connected: hub.size });

    case 'GET /api/heartbeat': {
      if (displayId) settings.touch(displayId);
      return json(res, { ok: true, at: Date.now() });
    }

    case 'POST /api/telemetry': {
      // Small batches from each display: frame time, long tasks, heap, errors.
      const body = await readJson(req);
      const id = clean(body.display);
      if (!id) return bad(res, 'display required');
      settings.touch(id, { tier: body.tier, screen: body.screen });
      for (const line of body.lines || []) {
        const level = ['warn', 'error'].includes(line.level) ? line.level : 'info';
        log[level]({ display: id, ...line.fields });
      }
      return json(res, { ok: true });
    }

    default:
      return notFound(res);
  }
}

// --------------------------------------------------------------- helpers

function clean(id) {
  return id ? String(id).replace(/[^\w.-]/g, '').slice(0, 64) : '';
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function bad(res, message) {
  return json(res, { error: message }, 400);
}

function notFound(res) {
  return json(res, { error: 'not found' }, 404);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 64_000) reject(new Error('body too large'));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('bad json'));
      }
    });
    req.on('error', reject);
  });
}
