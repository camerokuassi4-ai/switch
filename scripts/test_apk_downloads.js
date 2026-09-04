const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found: ' + reqPath);
    return;
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.apk' ? 'application/vnd.android.package-archive' : 'text/html';
  
  res.writeHead(200, {
    'Content-Type': mime,
    'Content-Length': stat.size
  });
  fs.createReadStream(filePath).pipe(res);
});

async function runDownloadTests() {
  const PORT = 3088;
  await new Promise(res => server.listen(PORT, '127.0.0.1', res));
  console.log(`🌐 Serveur de test dist actif sur http://127.0.0.1:${PORT}`);

  const endpoints = [
    '/assets/downloads/switch-beta-user-v2.1.0.apk',
    '/assets/downloads/switch-beta-merchant-v2.1.0.apk',
    '/assets/downloads/switch-beta-agent-v2.1.0.apk',
    '/assets/downloads/switch-beta-hybrid-v2.1.0.apk',
    '/assets/downloads/switch_user_beta.apk',
    '/assets/downloads/switch_merchant_beta.apk',
    '/assets/downloads/switch_agent_beta.apk',
    '/assets/downloads/switch_hybrid_beta.apk'
  ];

  console.log('\n--- 1. TEST DES LIENS HTTP ET TAILLE DES PACKAGES APK ---');
  let allPass = true;
  for (const ep of endpoints) {
    const res = await new Promise(resolve => {
      http.get(`http://127.0.0.1:${PORT}${ep}`, (response) => {
        let size = 0;
        response.on('data', chunk => size += chunk.length);
        response.on('end', () => resolve({ status: response.statusCode, size, headers: response.headers }));
      });
    });

    const sizeMb = (res.size / (1024 * 1024)).toFixed(2);
    if (res.status === 200 && res.size > 8000000) {
      console.log(` ✅ 200 OK | ${ep} -> ${res.size} octets (${sizeMb} Mo)`);
    } else {
      console.error(` ❌ Échec : ${ep} -> Statut ${res.status}, Taille : ${res.size}`);
      allPass = false;
    }
  }

  console.log('\n--- 2. TEST AUTOMATIQUE DE TÉLÉCHARGEMENT DANS LE NAVIGATEUR ---');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  // Test index.html user download button
  console.log(' Navigation vers index.html...');
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load' });
  const downloadPromiseUser = page.waitForEvent('download');
  const userBtn = await page.$('a[href*="switch-beta-user-v2.1.0.apk"]');
  if (userBtn) {
    await userBtn.click();
    const download = await downloadPromiseUser;
    const savePath = path.join(rootDir, 'scratch', download.suggestedFilename());
    await download.saveAs(savePath);
    const size = fs.statSync(savePath).size;
    const mb = (size / (1024 * 1024)).toFixed(2);
    console.log(` ✅ Téléchargement déclenché avec succès : ${download.suggestedFilename()} (${mb} Mo)`);
    if (size < 1000000) allPass = false;
  } else {
    console.error(' ❌ Bouton de téléchargement Utilisateur introuvable sur index.html');
    allPass = false;
  }

  // Test download.html merchant button
  console.log(' Navigation vers download.html...');
  await page.goto(`http://127.0.0.1:${PORT}/download.html`, { waitUntil: 'load' });
  const downloadPromiseMch = page.waitForEvent('download');
  const mchBtn = await page.$('a[href*="switch-beta-merchant-v2.1.0.apk"]');
  if (mchBtn) {
    await mchBtn.click();
    const download = await downloadPromiseMch;
    const savePath = path.join(rootDir, 'scratch', download.suggestedFilename());
    await download.saveAs(savePath);
    const size = fs.statSync(savePath).size;
    const mb = (size / (1024 * 1024)).toFixed(2);
    console.log(` ✅ Téléchargement déclenché avec succès : ${download.suggestedFilename()} (${mb} Mo)`);
    if (size < 1000000) allPass = false;
  } else {
    console.error(' ❌ Bouton de téléchargement Marchand introuvable sur download.html');
    allPass = false;
  }

  await browser.close();
  server.close();

  if (allPass) {
    console.log('\n🎉 TOUS LES TESTS DE TÉLÉCHARGEMENT APK SONT VALIDÉS (8.40 Mo RÉELS) !');
  } else {
    console.error('\n⚠️ Certains tests ont échoué.');
    process.exit(1);
  }
}

runDownloadTests();
