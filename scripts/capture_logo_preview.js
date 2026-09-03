const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const artifactDir = "C:\\Users\\camer\\.gemini\\antigravity-ide\\brain\\6a649ff6-a80c-41c6-a5ba-8b004499ab0d";
const workspaceDir = "c:\\Users\\camer\\OneDrive\\Documents\\Nouveau dossier\\stitch_switch_fintech_app_benin";

async function captureLogoPreview() {
  console.log("📸 Capture de l'écran Splash avec le premier logo originel...");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 412, height: 870 },
    deviceScaleFactor: 2,
    isMobile: true
  });

  const page = await context.newPage();
  await page.goto("http://localhost:3000/accueil_splash_mis_jour/code.html", { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const artifactPreviewPath = path.join(artifactDir, "splash_logo_preview.jpg");
  const workspacePreviewPath = path.join(workspaceDir, "assets", "images", "splash_logo_preview.jpg");

  await page.screenshot({ path: artifactPreviewPath, type: 'jpeg', quality: 95 });
  await page.screenshot({ path: workspacePreviewPath, type: 'jpeg', quality: 95 });

  await browser.close();
  console.log("✅ Capture d'écran du logo enregistrée avec succès dans l'artifact et les assets !");
}

captureLogoPreview();
