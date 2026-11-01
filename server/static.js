// Static files. The app folder is the site root; the design tokens are served
// from docs/assets so there is one copy, and the built docs site sits under
// /docs/ when it exists. Nothing outside those folders is reachable.

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

export function staticServer(mounts) {
  // mounts: [{ prefix: '/assets/', dir: '.../docs/assets' }, ...] longest prefix first.
  const sorted = [...mounts].sort((a, b) => b.prefix.length - a.prefix.length);

  return async function serve(req, res, urlPath) {
    const mount = sorted.find((m) => urlPath.startsWith(m.prefix));
    if (!mount) return false;

    let rel = decodeURIComponent(urlPath.slice(mount.prefix.length));
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const file = path.normalize(path.join(mount.dir, rel));
    if (!file.startsWith(mount.dir)) return notFound(res);

    let info;
    try {
      info = await stat(file);
    } catch {
      return notFound(res);
    }
    if (info.isDirectory()) {
      res.writeHead(301, { Location: urlPath + '/' });
      res.end();
      return true;
    }

    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Content-Length': info.size,
      // The app is hand-written and changes on update; displays reload to pick
      // it up, so no long cache.
      'Cache-Control': 'no-cache',
    });
    if (req.method === 'HEAD') {
      res.end();
      return true;
    }
    createReadStream(file).pipe(res);
    return true;
  };
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
  return true;
}
