const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

let PORT = parseInt(process.env.PORT || '3000', 10);
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Default to index.html
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  let filePath = path.join(ROOT_DIR, pathname);

  // Helper to serve file
  function serveFile(fileToServe) {
    fs.readFile(fileToServe, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Erreur serveur 500');
        return;
      }
      const ext = path.extname(fileToServe).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);
    });
  }

  // Check direct file
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      return serveFile(filePath);
    }

    // If path ends with /code or no extension -> check with .html
    if (pathname.endsWith('/code')) {
      const candidate = filePath + '.html';
      if (fs.existsSync(candidate)) return serveFile(candidate);
    }

    // Check if directory containing code.html
    const candidateCode = path.join(filePath, 'code.html');
    if (fs.existsSync(candidateCode)) return serveFile(candidateCode);

    // Check with .html appended
    const candidateHtml = filePath + '.html';
    if (fs.existsSync(candidateHtml)) return serveFile(candidateHtml);

    // Fallback 404
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="utf-8"><title>Page non trouvée - Switch</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:40px;background:#F8F9FD;">
        <h2>Page non trouvée : ${pathname}</h2>
        <p><a href="/index.html" style="color:#5e3bdc;font-weight:bold;">Retour à l'accueil Switch</a></p>
      </body>
      </html>
    `);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur Switch opérationnel sur http://localhost:${PORT}`);
});
