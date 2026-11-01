// Settings live on the server, in one JSON file. Every display shares the
// same settings until it turns "Same on all displays" off; at that moment it
// gets its own copy and edits only that. Displays are listed by id so a
// reloaded or replaced screen comes back the same.

import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULTS = {
  general: {
    theme: 'auto',      // mode: auto | light | dark
    palette: 'ember',   // ember | harbor | moss | graphite | rose
    ground: 'plain',    // plain | meadow | ridge | sky | sunset | fern
    idleReturn: 60,     // seconds without a touch before the pager goes Home; 0 = off
    carousel: 0,        // seconds per page while idle; 0 = off
    quality: 'auto',    // auto | high | low
  },
  home: {
    hourCycle: '12',    // 12 | 24
    seconds: false,
    clockStyle: 'text', // text | flip
    timeZone: '',       // IANA zone; '' follows the device
  },
  calendar: {
    weekStart: 0,       // 0 Sunday, 1 Monday
  },
  weather: {
    units: 'f',         // f | c
    location: null,     // { name, lat, lon } once set
  },
};

export class Settings {
  constructor(dir) {
    this.file = path.join(dir, 'settings.json');
    this.data = { shared: clone(DEFAULTS), displays: {}, logLevel: 'info' };
    this.ready = this.load();
  }

  async load() {
    await mkdir(path.dirname(this.file), { recursive: true });
    try {
      const saved = JSON.parse(await readFile(this.file, 'utf8'));
      this.data.shared = merge(clone(DEFAULTS), saved.shared || {});
      this.data.displays = saved.displays || {};
      this.data.logLevel = saved.logLevel || 'info';
    } catch {
      // First run: defaults.
    }
  }

  async save() {
    const tmp = this.file + '.tmp';
    await writeFile(tmp, JSON.stringify(this.data, null, 2));
    await rename(tmp, this.file);
  }

  // The display record, created on first sight.
  display(id) {
    const d = this.data.displays[id] || (this.data.displays[id] = {
      name: id,
      own: false,
      settings: {},
      firstSeen: new Date().toISOString(),
    });
    return d;
  }

  touch(id, info = {}) {
    const d = this.display(id);
    d.lastSeen = new Date().toISOString();
    Object.assign(d, info);
  }

  // What a display actually runs with.
  effective(id) {
    const d = this.display(id);
    const settings = d.own ? merge(clone(DEFAULTS), d.settings) : clone(this.data.shared);
    return { display: { id, name: d.name, own: d.own }, settings };
  }

  // Apply a partial change for a display, into its own copy or the shared one.
  // Returns the ids whose effective settings changed.
  async patch(id, partial) {
    const d = this.display(id);
    if (d.own) {
      d.settings = merge(d.settings, partial);
      await this.save();
      return [id];
    }
    this.data.shared = merge(this.data.shared, partial);
    await this.save();
    return Object.keys(this.data.displays).filter((k) => !this.data.displays[k].own);
  }

  async setOwn(id, own) {
    const d = this.display(id);
    if (own && !d.own) d.settings = clone(this.data.shared); // keep what it had, so nothing jumps
    d.own = Boolean(own);
    await this.save();
  }

  async rename(id, name) {
    this.display(id).name = String(name).trim().slice(0, 40) || id;
    await this.save();
  }

  list() {
    return Object.entries(this.data.displays).map(([id, d]) => ({ id, ...d, settings: undefined }));
  }
}

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

// Deep merge of plain objects; arrays and null replace.
function merge(base, patch) {
  const out = { ...base };
  for (const [k, v] of Object.entries(patch || {})) {
    if (isObject(v) && isObject(out[k])) out[k] = merge(out[k], v);
    else out[k] = v;
  }
  return out;
}

function isObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}
