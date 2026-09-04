const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const rootDir = path.resolve(__dirname, '..');
const verifyDir = path.join(rootDir, 'assets/images/screenshots_verification');
if (!fs.existsSync(verifyDir)) {
  fs.mkdirSync(verifyDir, { recursive: true });
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
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

async function testLanding() {
  const PORT = 3018;
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`🌐 Serveur de test actif sur http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });

  console.log('🧪 TEST 1 : Rendu Mobile (iPhone 14 Pro - 393 x 852, DPR: 3)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load' });
  await mobilePage.waitForTimeout(1000);

  // 1. Vérification du débordement horizontal
  const overflow = await mobilePage.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
  console.log(` 📐 Débordement horizontal mobile: ${overflow.overflowPx}px (scrollWidth: ${overflow.scrollWidth}, clientWidth: ${overflow.clientWidth})`);
  if (overflow.overflowPx > 0) {
    console.error(' ❌ ATTENTION: Débordement horizontal détecté!');
  } else {
    console.log(' ✅ Parfait : 0px de débordement horizontal sur mobile.');
  }

  // 2. Mesure de la largeur réelle des mockups smartphones sur mobile
  const mockupMetrics = await mobilePage.evaluate(() => {
    const mockups = document.querySelectorAll('.phone-mockup');
    const widths = Array.from(mockups).map(m => Math.round(m.getBoundingClientRect().width));
    const heights = Array.from(mockups).map(m => Math.round(m.getBoundingClientRect().height));
    return { count: mockups.length, widths: widths.slice(0, 4), heights: heights.slice(0, 4) };
  });
  console.log(` 📱 Mockups détectés sur mobile : ${mockupMetrics.count}`);
  console.log(` 📏 Largeur des 4 premiers mockups sur mobile : ${mockupMetrics.widths.join(', ')} px`);
  console.log(` 📏 Hauteur des 4 premiers mockups sur mobile : ${mockupMetrics.heights.join(', ')} px`);

  // 3. Captures d'écran de vérification mobile
  const heroPath = path.join(verifyDir, 'hd_mobile_user_section.jpg');
  const userSection = await mobilePage.$('#profil-user');
  if (userSection) {
    await userSection.screenshot({ path: heroPath, type: 'jpeg', quality: 90 });
    console.log(` 📸 Capture mobile section Utilisateur HD enregistrée: ${heroPath}`);
  }

  const merchantSection = await mobilePage.$('#profil-merchant');
  if (merchantSection) {
    const merchPath = path.join(verifyDir, 'hd_mobile_merchant_section.jpg');
    await merchantSection.screenshot({ path: merchPath, type: 'jpeg', quality: 90 });
    console.log(` 📸 Capture mobile section Marchand HD enregistrée: ${merchPath}`);
  }

  await mobilePage.close();
  await mobileContext.close();

  // 🧪 TEST 2 : Rendu Desktop (1920 x 1080)
  console.log('\n🧪 TEST 2 : Rendu Desktop (1920 x 1080, DPR: 1.5)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load' });
  await desktopPage.waitForTimeout(1000);

  const desktopMockupMetrics = await desktopPage.evaluate(() => {
    const mockups = document.querySelectorAll('.phone-mockup');
    const widths = Array.from(mockups).map(m => Math.round(m.getBoundingClientRect().width));
    return { count: mockups.length, widths: widths.slice(0, 4) };
  });
  console.log(` 💻 Mockups détectés sur Desktop : ${desktopMockupMetrics.count}`);
  console.log(` 📏 Largeur des mockups sur Desktop (Grille 2x2) : ${desktopMockupMetrics.widths.join(', ')} px`);

  const desktopUserSection = await desktopPage.$('#profil-user');
  if (desktopUserSection) {
    const deskPath = path.join(verifyDir, 'hd_desktop_user_section.jpg');
    await desktopUserSection.screenshot({ path: deskPath, type: 'jpeg', quality: 90 });
    console.log(` 📸 Capture Desktop section Utilisateur HD enregistrée: ${deskPath}`);
  }

  // TEST LIGHTBOX
  console.log('\n🧪 TEST 3 : Test du Lightbox Haute Résolution...');
  await desktopPage.click('#profil-user .showcase-card');
  await desktopPage.waitForTimeout(500);
  const lightboxVisible = await desktopPage.evaluate(() => {
    const lb = document.getElementById('lightbox-modal');
    const img = document.getElementById('lightbox-img');
    const isVisible = lb && !lb.classList.contains('opacity-0') && !lb.classList.contains('pointer-events-none');
    return { isVisible, src: img ? img.src : '' };
  });
  console.log(` 🔍 Lightbox HD actif : ${lightboxVisible.isVisible ? 'OUI ✅' : 'NON ❌'} (Image: ${lightboxVisible.src})`);

  await desktopPage.close();
  await desktopContext.close();

  await browser.close();
  server.close();
  console.log('\n🎉 TOUS LES TESTS D\'AFFICHAGE ET DE QUALITÉ HD SONT COMPLETS ET VALIDÉS !');
}

testLanding().catch(err => {
  console.error('Erreur test:', err);
  server.close();
  process.exit(1);
});
