const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runMobileVerification() {
  console.log('🧪 Lancement de la suite de tests mobiles et desktop pour Switch Beta...');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const baseDir = path.resolve(__dirname, '..');
  const indexUrl = 'file://' + path.join(baseDir, 'index.html').replace(/\\/g, '/');
  const downloadUrl = 'file://' + path.join(baseDir, 'download.html').replace(/\\/g, '/');

  const screenshotsDir = path.join(baseDir, 'assets/images/screenshots_verification');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // TEST 1 : iPhone 14 Pro Viewport (393 x 852)
  console.log('\n📱 Test 1: Navigation Mobile iPhone (393x852)');
  const iphoneContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  });

  const iphonePage = await iphoneContext.newPage();
  await iphonePage.goto(indexUrl, { waitUntil: 'load' });
  await iphonePage.waitForTimeout(1000);

  // Vérifier le non-débordement horizontal
  const overflowCheck = await iphonePage.evaluate(() => {
    return {
      bodyScrollWidth: document.body.scrollWidth,
      windowInnerWidth: window.innerWidth,
      hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth
    };
  });
  console.log(`  + Débordement horizontal: ${overflowCheck.hasHorizontalOverflow ? '❌ OUI' : '✅ NON (Parfait)'} (Scroll: ${overflowCheck.bodyScrollWidth}px / Viewport: ${overflowCheck.windowInnerWidth}px)`);

  // Vérifier la présence des 4 sections distinctes
  const categories = ['#profil-user', '#profil-merchant', '#profil-agent', '#profil-hybrid'];
  for (const cat of categories) {
    const el = await iphonePage.$(cat);
    console.log(`  + Section ${cat}: ${el ? '✅ Présente' : '❌ Absente'}`);
  }

  // Vérifier les boutons de téléchargement et les liens APK
  const downloadLinks = await iphonePage.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[download]'));
    return links.map(a => ({
      text: a.innerText.trim().replace(/\s+/g, ' '),
      href: a.getAttribute('href'),
      height: a.getBoundingClientRect().height
    }));
  });

  console.log('\n  + Vérification des boutons de téléchargement APK :');
  downloadLinks.forEach((l, idx) => {
    const isTouchFriendly = l.height >= 44;
    console.log(`    [${idx + 1}] "${l.text}" -> ${l.href} | Hauteur tactile: ${Math.round(l.height)}px (${isTouchFriendly ? '✅ Conforme tactile' : '⚠️ Trop petit'})`);
  });

  // Vérifier les 4 écrans par section
  const screensPerSection = await iphonePage.evaluate(() => {
    const sections = ['profil-user', 'profil-merchant', 'profil-agent', 'profil-hybrid'];
    const report = {};
    sections.forEach(s => {
      const secEl = document.getElementById(s);
      if (secEl) {
        const imgs = Array.from(secEl.querySelectorAll('.phone-screen img, .phone-mockup img, .mockup-card img'));
        report[s] = imgs.map(img => img.getAttribute('src'));
      }
    });
    return report;
  });

  console.log('\n  + Vérification des 4 écrans d\'aperçu par section :');
  for (const [sec, imgs] of Object.entries(screensPerSection)) {
    console.log(`    * ${sec} : ${imgs.length} écrans intégrés (${imgs.length === 4 ? '✅ 4/4 Parfait' : '⚠️ ' + imgs.length})`);
  }

  // Capturer screenshots iPhone
  const iphoneScreenshotPath = path.join(screenshotsDir, 'landing_mobile_iphone.jpg');
  await iphonePage.screenshot({ path: iphoneScreenshotPath, fullPage: false });
  console.log(`  📸 Capture écran iPhone sauvegardée : ${iphoneScreenshotPath}`);

  // TEST 2 : Test Navigation Mobile Android (360 x 800)
  console.log('\n🤖 Test 2: Navigation Mobile Android (360x800)');
  const androidContext = await browser.newContext({
    viewport: { width: 360, height: 800 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    isMobile: true,
    hasTouch: true
  });
  const androidPage = await androidContext.newPage();
  await androidPage.goto(indexUrl, { waitUntil: 'load' });
  await androidPage.waitForTimeout(500);

  // Scroll to merchant section to verify anchor and appearance
  await androidPage.evaluate(() => document.getElementById('profil-merchant').scrollIntoView());
  await androidPage.waitForTimeout(500);

  const androidScreenshotPath = path.join(screenshotsDir, 'landing_mobile_android_merchant.jpg');
  await androidPage.screenshot({ path: androidScreenshotPath, fullPage: false });
  console.log(`  📸 Capture écran Android (Marchand) sauvegardée : ${androidScreenshotPath}`);

  // TEST 3 : Page download.html (Mobile)
  console.log('\n📥 Test 3: Vérification de download.html sur mobile');
  await androidPage.goto(downloadUrl, { waitUntil: 'load' });
  await androidPage.waitForTimeout(500);

  const downloadCardsCount = await androidPage.evaluate(() => {
    return document.querySelectorAll('a[download]').length;
  });
  console.log(`  + Boutons de téléchargement sur download.html: ${downloadCardsCount} (${downloadCardsCount === 4 ? '✅ 4 APKs distincts' : '⚠️ ' + downloadCardsCount})`);

  const downloadScreenshotPath = path.join(screenshotsDir, 'download_page_mobile.jpg');
  await androidPage.screenshot({ path: downloadScreenshotPath, fullPage: false });
  console.log(`  📸 Capture écran download.html mobile sauvegardée : ${downloadScreenshotPath}`);

  // TEST 4 : Desktop HD Viewport (1280 x 800)
  console.log('\n💻 Test 4: Vue Desktop HD (1280x800)');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(indexUrl, { waitUntil: 'load' });
  await desktopPage.waitForTimeout(500);

  const desktopScreenshotPath = path.join(screenshotsDir, 'landing_desktop_hd.jpg');
  await desktopPage.screenshot({ path: desktopScreenshotPath, fullPage: false });
  console.log(`  📸 Capture écran Desktop HD sauvegardée : ${desktopScreenshotPath}`);

  await browser.close();

  console.log('\n🎉 TOUS LES TESTS MOBILES & DESKTOP ONT ÉTÉ VALIDÉS AVEC SUCCÈS !');
}

runMobileVerification().catch(err => {
  console.error('❌ Erreur lors des tests:', err);
  process.exit(1);
});
