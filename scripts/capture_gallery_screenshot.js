const { chromium } = require('playwright');
const path = require('path');

const artifactDir = "C:\\Users\\camer\\.gemini\\antigravity-ide\\brain\\6a649ff6-a80c-41c6-a5ba-8b004499ab0d";
const workspaceDir = "c:\\Users\\camer\\OneDrive\\Documents\\Nouveau dossier\\stitch_switch_fintech_app_benin";

async function captureGallery() {
  console.log("📸 Capture de la galerie d'affichage des logos...");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  await page.goto("http://localhost:3000/gallery_logos.html", { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const artifactPath = path.join(artifactDir, "gallery_logos_screenshot.jpg");
  const workspacePath = path.join(workspaceDir, "assets", "images", "gallery_logos_screenshot.jpg");

  await page.screenshot({ path: artifactPath, type: 'jpeg', quality: 95 });
  await page.screenshot({ path: workspacePath, type: 'jpeg', quality: 95 });

  await browser.close();
  console.log("✅ Capture d'écran de la galerie enregistrée avec succès !");
}

captureGallery();
