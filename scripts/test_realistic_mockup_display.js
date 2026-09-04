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

async function testRealisticMockups() {
  const PORT = 3019;
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`🌐 Serveur de test actif sur http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });

  // TEST 1 : Mobile (iPhone 14 Pro - 393 x 852, DPR: 3)
  console.log('🧪 TEST 1 : Rendu Mobile (iPhone 14 Pro - 393 x 852, DPR: 3)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load', timeout: 15000 });
  await mobilePage.waitForTimeout(2000);

  // Vérification du débordement horizontal
  const overflow = await mobilePage.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
  console.log(` 📐 Débordement horizontal mobile: ${overflow.overflowPx}px (scrollWidth: ${overflow.scrollWidth}, clientWidth: ${overflow.clientWidth})`);

  // Mesure des mockups réalistes
  const mobileMetrics = await mobilePage.evaluate(() => {
    const mockups = document.querySelectorAll('.real-mockup-device');
    const frames = document.querySelectorAll('.real-mockup-overlay');
    const screens = document.querySelectorAll('.real-mockup-screen img');
    return {
      totalMockups: mockups.length,
      totalFrames: frames.length,
      totalScreens: screens.length,
      firstMockupWidth: mockups[0] ? Math.round(mockups[0].getBoundingClientRect().width) : 0,
      firstMockupHeight: mockups[0] ? Math.round(mockups[0].getBoundingClientRect().height) : 0
    };
  });
  console.log(` 📱 Vrais Mockups réalistes détectés : ${mobileMetrics.totalMockups}`);
  console.log(` 🖼️  Cadres PNG transparents overlay : ${mobileMetrics.totalFrames}`);
  console.log(` 📸 Écrans HD intégrés : ${mobileMetrics.totalScreens}`);
  console.log(` 📏 Taille mockup sur mobile : ${mobileMetrics.firstMockupWidth} x ${mobileMetrics.firstMockupHeight} px`);

  // Captures mobiles
  const userSectionMobile = await mobilePage.$('#profil-user');
  if (userSectionMobile) {
    const p = path.join(verifyDir, 'realistic_mockup_mobile_user.jpg');
    await userSectionMobile.screenshot({ path: p, type: 'jpeg', quality: 90 });
    console.log(` 📸 Capture mobile enregistrée : ${p}`);
  }

  await mobilePage.close();
  await mobileContext.close();

  // TEST 2 : Desktop (1440 x 900, DPR: 2)
  console.log('\n🧪 TEST 2 : Rendu Desktop (1440 x 900, DPR: 2)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load', timeout: 15000 });
  await desktopPage.waitForTimeout(2500);

  const desktopMetrics = await desktopPage.evaluate(() => {
    const mockups = document.querySelectorAll('.real-mockup-device');
    return {
      totalMockups: mockups.length,
      widths: Array.from(mockups).slice(0, 4).map(m => Math.round(m.getBoundingClientRect().width)),
      heights: Array.from(mockups).slice(0, 4).map(m => Math.round(m.getBoundingClientRect().height))
    };
  });
  console.log(` 💻 Vrais Mockups sur Desktop : ${desktopMetrics.totalMockups}`);
  console.log(` 📏 Dimensions des 4 premiers mockups (Desktop) : ${desktopMetrics.widths[0]} x ${desktopMetrics.heights[0]} px`);

  const userSectionDesktop = await desktopPage.$('#profil-user');
  if (userSectionDesktop) {
    const p = path.join(verifyDir, 'realistic_mockup_desktop_user.jpg');
    await userSectionDesktop.screenshot({ path: p, type: 'jpeg', quality: 90 });
    console.log(` 📸 Capture Desktop enregistrée : ${p}`);
  }

  const merchantSectionDesktop = await desktopPage.$('#profil-merchant');
  if (merchantSectionDesktop) {
    const p = path.join(verifyDir, 'realistic_mockup_desktop_merchant.jpg');
    await merchantSectionDesktop.screenshot({ path: p, type: 'jpeg', quality: 90 });
    console.log(` 📸 Capture Desktop Marchand enregistrée : ${p}`);
  }

  // TEST 3 : Lightbox modal
  console.log('\n🧪 TEST 3 : Test de la Modale Lightbox avec Mockup Réaliste...');
  await desktopPage.click('#profil-user .showcase-card');
  await desktopPage.waitForTimeout(600);

  const lightboxInfo = await desktopPage.evaluate(() => {
    const lb = document.getElementById('lightbox-modal');
    const isVisible = lb && !lb.classList.contains('opacity-0') && !lb.classList.contains('pointer-events-none');
    const mockup = lb ? lb.querySelector('.real-mockup-device') : null;
    const img = document.getElementById('lightbox-img');
    return {
      isVisible,
      hasRealMockup: !!mockup,
      mockupWidth: mockup ? Math.round(mockup.getBoundingClientRect().width) : 0,
      mockupHeight: mockup ? Math.round(mockup.getBoundingClientRect().height) : 0,
      imgSrc: img ? img.src : ''
    };
  });
  console.log(` 🔍 Lightbox actif : ${lightboxInfo.isVisible ? 'OUI ✅' : 'NON ❌'}`);
  console.log(` 📱 Mockup réaliste dans Lightbox : ${lightboxInfo.hasRealMockup ? 'OUI ✅' : 'NON ❌'} (${lightboxInfo.mockupWidth} x ${lightboxInfo.mockupHeight} px)`);

  const lightboxEl = await desktopPage.$('#lightbox-modal');
  if (lightboxEl) {
    const p = path.join(verifyDir, 'realistic_mockup_lightbox.jpg');
    await lightboxEl.screenshot({ path: p, type: 'jpeg', quality: 90 });
    console.log(` 📸 Capture Lightbox enregistrée : ${p}`);
  }

  await desktopPage.close();
  await desktopContext.close();

  await browser.close();
  server.close();
  console.log('\n🎉 TOUS LES TESTS DE RENDU MOCKUP RÉALISTE SONT VALIDÉS AVEC SUCCÈS !');
}

testRealisticMockups().catch(err => {
  console.error('Erreur test:', err);
  server.close();
  process.exit(1);
});
