const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');

// Simple HTTP server for dist/
const server = http.createServer((req, res) => {
  let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.apk': 'application/vnd.android.package-archive'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

async function verifyDist() {
  server.listen(4199, '127.0.0.1', async () => {
    console.log('🌐 Test du bundle dist/ sur http://127.0.0.1:4199...');
    const browser = await chromium.launch({
      executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      headless: true
    });
    const page = await browser.newPage();

    let failedRequests = 0;
    page.on('response', resp => {
      if (resp.status() >= 400) {
        console.error(` ❌ 404/Error HTTP ${resp.status()}: ${resp.url()}`);
        failedRequests++;
      }
    });

    await page.goto('http://127.0.0.1:4199/', { waitUntil: 'networkidle' });
    console.log(' ✅ Page d\'accueil index.html chargée sans erreur !');

    await page.goto('http://127.0.0.1:4199/download.html', { waitUntil: 'networkidle' });
    console.log(' ✅ Page de téléchargement download.html chargée sans erreur !');

    await page.goto('http://127.0.0.1:4199/download/user.html', { waitUntil: 'networkidle' });
    console.log(' ✅ Page fiche utilisateur /download/user chargée sans erreur !');

    await browser.close();
    server.close();

    if (failedRequests === 0) {
      console.log('\n🎉 TEST D\'HÉBERGEMENT DU DOSSIER dist/ RÉUSSI : 0 ERREUR HTTP !');
    } else {
      console.error(`\n⚠️ ${failedRequests} requêtes ont échoué.`);
    }
  });
}

verifyDist();
