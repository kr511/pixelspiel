import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

// spiel/ holds the built game (npm run build:spiel); images, sounds and icons are served
// straight from public/, so they exist only once in the repository.
const roots = [fileURLToPath(new URL('../spiel/', import.meta.url)), fileURLToPath(new URL('../public/', import.meta.url))];
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };

export function createGameServer() {
  return http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const relative = '.' + (pathname === '/' ? '/index.html' : pathname);
      let data;
      let filename;
      for (const root of roots) {
        filename = resolve(root, relative);
        if (!filename.startsWith(resolve(root) + sep)) {
          res.writeHead(403).end('Zugriff verweigert');
          return;
        }
        try { data = await readFile(filename); break; } catch { data = undefined; }
      }
      if (!data) throw new Error('not found');
      res.writeHead(200, { 'Content-Type': mime[extname(filename)] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404).end('Datei nicht gefunden');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createGameServer();
  const port = 8765;
  server.on('error', (error) => {
    console.error('pixelgame konnte nicht starten:', error.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}/`;
    console.log(`pixelgame ist bereit: ${url}\nZum Beenden Strg+C druecken.`);
    if (process.platform === 'win32') {
      const browser = spawn('rundll32.exe', ['url.dll,FileProtocolHandler', url], { detached: true, stdio: 'ignore', windowsHide: true });
      browser.on('error', () => console.log('Bitte die Spieladresse im Browser oeffnen.'));
      browser.unref();
    }
  });
}
