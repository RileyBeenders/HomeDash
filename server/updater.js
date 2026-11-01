// Keeps the server current. A server on the `stable` channel follows `main`:
// it fetches, waits for the displays to be idle, backs up the settings,
// fast-forwards the tracked files and exits with UPDATE_EXIT so the supervisor
// in homedash.ps1 relaunches it. The supervisor also checks the new server
// answers /api/heartbeat and rolls back if it does not. See docs/system/updates.md.
//
// Everything this file writes is under data/ (update.json is read, never
// written). The checkout is only ever changed by `git merge --ff-only`.

import { execFile } from 'node:child_process';
import { readFile, writeFile, mkdir, readdir, copyFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';

export const UPDATE_EXIT = 75;
const KEEP_BACKUPS = 5;
const GIT_TIMEOUT = 60_000;
const DEFAULT_CHECK_AT = '03:30';
const IDLE_POLL = 30_000;

export class Updater {
  constructor({ root, data, log, hub, port }) {
    this.root = root;
    this.dir = data;
    this.log = log;
    this.hub = hub;
    this.port = port;
    this.supervised = process.env.HOMEDASH_SUPERVISED === '1';
    this.idleMs = (Number(process.env.HOMEDASH_IDLE_SECONDS) || 180) * 1000;
    this.configFile = path.join(data, 'update.json');
    this.stateFile = path.join(data, 'update-state.json');
    this.pendingFile = path.join(data, 'update-pending.json');
    this.lastActive = 0;
    this.activeDisplays = new Map();
    this.busy = false;
    this.waiting = null;
    this.timer = 0;
    this.waitTimer = 0;
    this.running = null;
    this.state = {};
    this.ready = this.init();
  }

  async init() {
    // The supervisor writes `rejected` and a rolled-back `lastUpdate` while this
    // server is down, so read the file once here and own it afterwards.
    this.state = await readJson(this.stateFile, {});
    this.running = await this.describe('HEAD');
    if (this.state.available?.commit === this.running?.commit) this.state.available = null;
    // First boot after an update: the supervisor leaves the pending file in
    // place until this server has answered the heartbeat.
    const pending = await readJson(this.pendingFile, null);
    if (pending && pending.to === this.running?.commit) {
      this.state.lastUpdate = { status: 'applied', from: pending.from, to: pending.to, at: new Date().toISOString() };
      await this.saveState();
      this.log.info({ update: 'running_new_version', from: short(pending.from), to: short(pending.to) });
    }
  }

  // ------------------------------------------------------------ schedule

  start() {
    // Let the server finish starting before the first check.
    setTimeout(() => this.check({ reason: 'start' }), 5_000).unref();
    this.scheduleDaily();
  }

  async scheduleDaily() {
    clearTimeout(this.timer);
    const { checkAt } = await this.config();
    const [hh, mm] = parseTime(checkAt);
    const next = new Date();
    next.setHours(hh, mm, 0, 0);
    if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
    this.nextCheck = next.toISOString();
    this.timer = setTimeout(async () => {
      await this.check({ reason: 'daily' });
      this.scheduleDaily();
    }, next.getTime() - Date.now());
    this.timer.unref();
  }

  // A display reports a touch; the update waits until nobody has for a while.
  activity(displayId) {
    this.lastActive = Date.now();
    if (displayId) this.activeDisplays.set(displayId, this.lastActive);
  }

  isIdle() {
    return Date.now() - this.lastActive >= this.idleMs;
  }

  // -------------------------------------------------------------- config

  // update.json is optional: no file means stable. A file that cannot be read
  // or names an unknown channel never updates anything.
  async config() {
    const base = { channel: 'stable', ref: '', checkAt: DEFAULT_CHECK_AT, valid: true };
    let raw;
    try {
      raw = await readText(this.configFile);
    } catch {
      return base;
    }
    try {
      const c = JSON.parse(raw);
      const channel = c.channel || 'stable';
      const valid = ['stable', 'version', 'branch'].includes(channel) && (channel === 'stable' || typeof c.ref === 'string' && c.ref);
      return { channel, ref: c.ref || '', checkAt: c.checkAt || DEFAULT_CHECK_AT, valid };
    } catch {
      return { ...base, valid: false };
    }
  }

  // --------------------------------------------------------------- check

  async check({ reason = 'manual' } = {}) {
    if (this.busy) return this.status();
    this.busy = true;
    const result = { at: new Date().toISOString(), reason };
    try {
      await this.ready;
      const config = await this.config();
      Object.assign(result, await this.runCheck(config, reason));
    } catch (err) {
      Object.assign(result, { outcome: 'error', message: err.message });
      this.log.error({ update: 'check_failed', reason: err.message });
    } finally {
      this.busy = false;
    }
    this.state.lastCheck = result;
    await this.saveState();
    return this.status();
  }

  async runCheck(config, reason) {
    if (!config.valid) {
      this.log.error({ update: 'config_invalid', file: 'data/update.json' });
      return { outcome: 'error', message: 'data/update.json is not valid; not updating' };
    }

    const fetched = await this.fetch();
    if (!fetched.ok) {
      if (fetched.offline) this.log.warn({ update: 'check_skipped', reason: 'no_internet' });
      else this.log.warn({ update: 'check_skipped', reason: fetched.message });
      return { outcome: 'skipped', message: fetched.offline ? 'No internet; keeping the version it has' : fetched.message };
    }

    if (config.channel !== 'stable') {
      this.stopWaiting();
      this.state.lastChannel = config.channel;
      const where = config.channel === 'version' ? `version ${config.ref}` : `branch ${config.ref}`;
      this.log.info({ update: 'locked', channel: config.channel, ref: config.ref });
      return { outcome: 'locked', message: `Locked to ${where}; does not update itself` };
    }

    // Moving off a lock back to stable: put the checkout back on main.
    if (this.state.lastChannel && this.state.lastChannel !== 'stable') {
      const back = await this.returnToMain();
      if (!back.ok) return { outcome: 'error', message: back.message };
    }
    this.state.lastChannel = 'stable';

    const branch = await this.git(['rev-parse', '--abbrev-ref', 'HEAD']);
    if (branch.out !== 'main') {
      this.log.info({ update: 'not_on_main', branch: branch.out });
      return { outcome: 'skipped', message: `The checkout is on ${branch.out}, not main; stable follows main` };
    }

    const head = (await this.git(['rev-parse', 'HEAD'])).out;
    const remote = await this.git(['rev-parse', '--verify', '--quiet', 'origin/main']);
    if (!remote.ok) return { outcome: 'error', message: 'origin/main not found' };
    if (remote.out === head) {
      this.stopWaiting();
      this.state.available = null;
      this.log.info({ update: 'up_to_date', commit: short(head) });
      return { outcome: 'up-to-date', message: 'Up to date' };
    }

    const ahead = await this.git(['merge-base', '--is-ancestor', head, remote.out]);
    if (!ahead.ok) {
      this.log.warn({ update: 'cannot_fast_forward', local: short(head), remote: short(remote.out) });
      return { outcome: 'skipped', message: 'This checkout has commits main does not; not touching it' };
    }

    if (this.state.rejected?.commit === remote.out) {
      this.log.info({ update: 'skipped_rejected', commit: short(remote.out) });
      return { outcome: 'rejected', message: `${short(remote.out)} failed to start here before; waiting for a newer commit` };
    }

    const subjects = (await this.git(['log', '--format=%s', `${head}..${remote.out}`])).out.split('\n').filter(Boolean);
    const security = subjects.some((s) => /^security\b|\[security\]/i.test(s));
    this.state.available = { commit: remote.out, short: short(remote.out), count: subjects.length, security };
    this.log.info({ update: 'available', from: short(head), to: short(remote.out), commits: subjects.length, security });

    if (!this.supervised) {
      this.log.warn({ update: 'not_applied', reason: 'not_supervised' });
      return { outcome: 'available', message: `Update ${short(remote.out)} is ready; start with homedash.ps1 so the server can restart itself` };
    }

    this.waitForIdle(remote.out, security);
    return { outcome: 'available', message: security ? 'Security update; installing now' : 'Update ready; installs when displays are idle' };
  }

  // ---------------------------------------------------------------- apply

  waitForIdle(commit, security) {
    this.stopWaiting();
    this.waiting = { commit, since: new Date().toISOString(), security };
    const tick = async () => {
      if (this.busy) return;
      if (!security && !this.isIdle()) return;
      this.stopWaiting();
      await this.apply(commit);
    };
    this.waitTimer = setInterval(tick, IDLE_POLL);
    this.waitTimer.unref();
    // The first look comes once this check has finished.
    setTimeout(tick, 1_000).unref();
  }

  stopWaiting() {
    clearInterval(this.waitTimer);
    this.waiting = null;
  }

  async apply(commit) {
    this.busy = true;
    try {
      const head = (await this.git(['rev-parse', 'HEAD'])).out;

      // A tracked file that was edited here is never overwritten.
      const dirty = await this.git(['status', '--porcelain', '--untracked-files=no']);
      if (dirty.out) {
        const files = dirty.out.split('\n').map((l) => l.replace(/^\s*\S+\s+/, '')).join(',');
        this.log.error({ update: 'stopped', reason: 'tracked_file_modified', files });
        this.state.lastUpdate = { status: 'stopped', at: new Date().toISOString(), message: 'A tracked file was changed here; update stopped' };
        await this.saveState();
        return;
      }

      const backup = await this.backupSettings();
      await writeFile(this.pendingFile, JSON.stringify({ from: head, to: commit, at: new Date().toISOString() }));

      const merged = await this.git(['merge', '--ff-only', commit]);
      if (!merged.ok) {
        await rm(this.pendingFile, { force: true });
        this.log.error({ update: 'merge_failed', reason: merged.message });
        this.state.lastUpdate = { status: 'failed', at: new Date().toISOString(), message: merged.message };
        await this.saveState();
        return;
      }

      this.log.info({ update: 'applied', from: short(head), to: short(commit), backup: backup || 'none', restarting: 'yes' });
      await this.saveState();
      await new Promise((r) => setTimeout(r, 200));
      process.exit(UPDATE_EXIT);
    } finally {
      this.busy = false;
    }
  }

  // settings.json is copied to data/backups/, newest five kept.
  async backupSettings() {
    const src = path.join(this.dir, 'settings.json');
    try {
      await readFile(src);
    } catch {
      return null;
    }
    const dir = path.join(this.dir, 'backups');
    await mkdir(dir, { recursive: true });
    const name = `settings-${stamp()}.json`;
    await copyFile(src, path.join(dir, name));
    const old = (await readdir(dir)).filter((f) => /^settings-.*\.json$/.test(f)).sort().reverse().slice(KEEP_BACKUPS);
    for (const f of old) await rm(path.join(dir, f), { force: true });
    return name;
  }

  async returnToMain() {
    const dirty = await this.git(['status', '--porcelain', '--untracked-files=no']);
    if (dirty.out) return { ok: false, message: 'A tracked file was changed here; not switching back to main' };
    const r = await this.git(['switch', 'main']);
    if (!r.ok) {
      this.log.error({ update: 'switch_main_failed', reason: r.message });
      return { ok: false, message: `Could not switch back to main: ${r.message}` };
    }
    this.log.info({ update: 'switched_to_main' });
    return { ok: true };
  }

  // ------------------------------------------------------------------ git

  async fetch() {
    const r = await this.git(['fetch', 'origin', '--tags', '--quiet'], GIT_TIMEOUT);
    if (r.ok) return { ok: true };
    const offline = /could not resolve host|unable to access|network is unreachable|timed out|connection (refused|reset)|failed to connect|could not read from remote|no route to host/i.test(r.message);
    if (/'origin' does not appear|no such remote/i.test(r.message)) return { ok: false, message: 'No origin remote' };
    return { ok: false, offline, message: offline ? 'No internet' : r.message };
  }

  git(args, timeout = 15_000) {
    return new Promise((resolve) => {
      execFile('git', args, { cwd: this.root, timeout, windowsHide: true, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }, (err, stdout, stderr) => {
        const out = String(stdout || '').trim();
        if (err) resolve({ ok: false, out, message: (String(stderr || '').trim() || err.message).split('\n')[0] });
        else resolve({ ok: true, out });
      });
    });
  }

  async describe(ref) {
    const commit = await this.git(['rev-parse', ref]);
    if (!commit.ok) return null;
    const [describe, date] = await Promise.all([
      this.git(['describe', '--tags', '--always']),
      this.git(['show', '-s', '--format=%cI', commit.out]),
    ]);
    return { commit: commit.out, short: short(commit.out), describe: describe.out, date: date.out };
  }

  // --------------------------------------------------------------- status

  async status() {
    await this.ready;
    const config = await this.config();
    const branch = await this.git(['rev-parse', '--abbrev-ref', 'HEAD']);
    const pkg = await readJson(path.join(this.root, 'package.json'), {});
    return {
      channel: config.channel,
      ref: config.ref,
      valid: config.valid,
      version: pkg.version || '',
      running: this.running,
      branch: branch.out,
      lastCheck: this.state.lastCheck || null,
      available: this.state.available || null,
      lastUpdate: this.state.lastUpdate || null,
      rejected: this.state.rejected || null,
      checking: this.busy,
      waiting: this.waiting,
      nextCheck: this.nextCheck || null,
      supervised: this.supervised,
    };
  }

  async saveState() {
    await mkdir(this.dir, { recursive: true });
    const tmp = this.stateFile + '.tmp';
    await writeFile(tmp, JSON.stringify(this.state, null, 2));
    await rename(tmp, this.stateFile);
  }
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readText(file));
  } catch {
    return fallback;
  }
}

// PowerShell writes a byte-order mark; JSON.parse does not accept one.
async function readText(file) {
  return (await readFile(file, 'utf8')).replace(/^\uFEFF/, '');
}

function parseTime(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s));
  if (!m || +m[1] > 23 || +m[2] > 59) return [3, 30];
  return [+m[1], +m[2]];
}

function short(sha) {
  return String(sha || '').slice(0, 7);
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
