const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Simple static server
const rootDir = path.resolve(__dirname, '..');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(rootDir, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found: ' + reqPath);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

async function run() {
  await new Promise(resolve => server.listen(3005, '127.0.0.1', resolve));
  console.log('Static server listening on http://127.0.0.1:3005');

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });

  // Modern crisp mobile viewport: 412x915 (Pixel 7 / Galaxy S23) with deviceScaleFactor 2.625 (1080x2400) or deviceScaleFactor 3
  const context = await browser.newContext({
    viewport: { width: 412, height: 890 },
    deviceScaleFactor: 2.625, // 412 * 2.625 = 1081.5px width (~1080p full HD mobile resolution)
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3005/tableau_de_bord_mis_jour/code.html', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  const testDir = path.join(rootDir, 'assets/images/test_hd');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

  const pngPath = path.join(testDir, 'test_user_dashboard.png');
  const webpPath = path.join(testDir, 'test_user_dashboard.webp');

  await page.screenshot({ path: pngPath, type: 'png' });
  console.log('PNG saved:', pngPath, fs.statSync(pngPath).size, 'bytes');

  // Let's also test a slightly higher scale factor (3x) for ultra crispness
  await page.close();
  await context.close();
  await browser.close();
  server.close();
  console.log('Done test capture!');
}

run().catch(err => {
  console.error('Error:', err);
  server.close();
  process.exit(1);
});
