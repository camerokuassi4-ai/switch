const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const rootDir = path.resolve(__dirname, '..');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/test_mockup.html';
  const filePath = path.join(rootDir, reqPath);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

async function testAlignment() {
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          background: #0B061E;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 40px;
          font-family: sans-serif;
        }
        .real-mockup-device {
          position: relative;
          width: 320px;
          aspect-ratio: 1000 / 2050;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .real-mockup-screen {
          position: absolute;
          top: 3.31%;
          left: 7.8%;
          width: 84.4%;
          height: 93.36%;
          border-radius: 38px;
          overflow: hidden;
          background: #000;
          z-index: 1;
        }
        .real-mockup-screen img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top;
          image-rendering: -webkit-optimize-contrast;
        }
        .real-mockup-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10;
        }
      </style>
    </head>
    <body>
      <div class="real-mockup-device">
        <div class="real-mockup-screen">
          <img src="/assets/images/real_screens/user_dashboard.png" alt="Screen">
        </div>
        <img src="/assets/images/mockups/realistic_iphone_frame.png" class="real-mockup-overlay" alt="Frame">
      </div>
    </body>
    </html>
  `;

  fs.writeFileSync(path.join(rootDir, 'test_mockup.html'), testHtml, 'utf-8');

  await new Promise(r => server.listen(3033, '127.0.0.1', r));

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 600, height: 850 }, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:3033/test_mockup.html', { waitUntil: 'load' });
  await page.waitForTimeout(500);

  const testShotPath = path.join(rootDir, 'assets/images/screenshots_verification/test_realistic_mockup_single.jpg');
  await page.screenshot({ path: testShotPath, type: 'jpeg', quality: 95 });
  console.log('📸 Capture de test du mockup réaliste enregistrée:', testShotPath);

  await browser.close();
  server.close();
  fs.unlinkSync(path.join(rootDir, 'test_mockup.html'));
  console.log('✅ Test d\'alignement terminé avec succès !');
}

testAlignment().catch(err => {
  console.error('Erreur:', err);
  server.close();
  process.exit(1);
});
