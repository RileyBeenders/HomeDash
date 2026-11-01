// Server-sent events. The server pushes "something changed" and the display
// fetches what it needs, so a display never polls.

export class Hub {
  constructor() {
    this.clients = new Set();
    // A comment line every 25s keeps proxies and sleepy browsers from closing
    // the stream.
    this.keepalive = setInterval(() => this.raw(': keepalive\n\n'), 25_000);
    this.keepalive.unref();
  }

  open(req, res, meta = {}) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('retry: 3000\n\n');
    const client = { res, ...meta };
    this.clients.add(client);
    req.on('close', () => this.clients.delete(client));
    return client;
  }

  send(event, data = {}) {
    this.raw(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  sendTo(res, event, data = {}) {
    res.write(`event: ${event}
data: ${JSON.stringify(data)}

`);
  }

  raw(chunk) {
    for (const c of this.clients) c.res.write(chunk);
  }

  get size() {
    return this.clients.size;
  }
}
