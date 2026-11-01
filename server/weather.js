// Weather comes through the server, never from a display. The server asks
// Open-Meteo (no key) every 15 minutes, keeps the last answer on disk, and
// serves that even when the internet is down, marked with when it was fetched.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const REFRESH_MS = 15 * 60 * 1000;
const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search';

export class Weather {
  constructor(dir, log, onUpdate) {
    this.file = path.join(dir, 'weather.json');
    this.log = log;
    this.onUpdate = onUpdate;
    this.cache = null; // { fetchedAt, units, location, current, hourly, daily }
    this.timer = null;
    this.ready = this.load();
  }

  async load() {
    await mkdir(path.dirname(this.file), { recursive: true });
    try {
      this.cache = JSON.parse(await readFile(this.file, 'utf8'));
    } catch {
      this.cache = null;
    }
  }

  // Called at start and whenever the location or units setting changes.
  configure({ location, units }) {
    this.location = location;
    this.units = units;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.refresh(), REFRESH_MS);
    this.timer.unref();
    this.refresh();
  }

  current() {
    if (!this.location) return { ok: false, reason: 'no-location' };
    const c = this.cache;
    const matches = c && c.units === this.units && sameSpot(c.location, this.location);
    if (!matches) return { ok: false, reason: 'loading' };
    return { ok: true, ...c, stale: Date.now() - Date.parse(c.fetchedAt) > 2 * REFRESH_MS };
  }

  async refresh() {
    if (!this.location) return;
    const { lat, lon } = this.location;
    const url = new URL(FORECAST);
    url.search = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m,relative_humidity_2m',
      hourly: 'temperature_2m,weather_code,is_day,precipitation_probability',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: '6',
      temperature_unit: this.units === 'c' ? 'celsius' : 'fahrenheit',
      wind_speed_unit: this.units === 'c' ? 'kmh' : 'mph',
    }).toString();

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`http ${res.status}`);
      const body = await res.json();
      this.cache = {
        fetchedAt: new Date().toISOString(),
        units: this.units,
        location: this.location,
        timezone: body.timezone,
        current: body.current,
        hourly: body.hourly,
        daily: body.daily,
      };
      await writeFile(this.file, JSON.stringify(this.cache));
      this.log.info({ weather: 'updated', place: this.location.name, temp: body.current?.temperature_2m });
      this.onUpdate?.();
    } catch (err) {
      this.log.warn({ weather: 'fetch-failed', reason: err.message });
    }
  }

  // Turn a typed place name into coordinates. Returns null when nothing matches.
  async geocode(query) {
    const url = new URL(GEOCODE);
    url.search = new URLSearchParams({ name: query, count: '1', language: 'en', format: 'json' }).toString();
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const hit = (await res.json()).results?.[0];
    if (!hit) return null;
    const region = hit.admin1 && hit.admin1 !== hit.name ? `, ${hit.admin1}` : '';
    return { name: `${hit.name}${region}`, lat: hit.latitude, lon: hit.longitude, country: hit.country_code };
  }
}

function sameSpot(a, b) {
  return a && b && Math.abs(a.lat - b.lat) < 1e-4 && Math.abs(a.lon - b.lon) < 1e-4;
}
