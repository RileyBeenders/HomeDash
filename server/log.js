// One log for the whole system. Every line carries a level and key=value
// pairs, and lines about a display carry its id, so the file can be grepped
// per screen. Written to stdout and appended to data/log.txt.

import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const LEVELS = ['info', 'warn', 'error'];

export class Log {
  constructor(dir) {
    this.file = path.join(dir, 'log.txt');
    this.level = 'info';
    this.ready = mkdir(dir, { recursive: true });
  }

  setLevel(level) {
    if (LEVELS.includes(level)) this.level = level;
  }

  info(fields) { return this.write('info', fields); }
  warn(fields) { return this.write('warn', fields); }
  error(fields) { return this.write('error', fields); }

  async write(level, fields) {
    if (LEVELS.indexOf(level) < LEVELS.indexOf(this.level)) return;
    const pairs = Object.entries(fields)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}=${String(v).replace(/\s+/g, '_')}`)
      .join(' ');
    const line = `${stamp()} ${level.toUpperCase().padEnd(5)} ${pairs}`;
    console.log(line);
    await this.ready;
    await appendFile(this.file, line + '\n').catch(() => {});
  }
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
