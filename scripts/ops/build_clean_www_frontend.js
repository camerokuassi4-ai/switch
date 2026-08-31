/**
 * SCRIPT DE CRÉATION DU DOSSIER WWW CLEAN POUR VERCEL
 * Fichier : scripts/ops/build_clean_www_frontend.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '../..');
const WWW_DIR = path.join(ROOT_DIR, 'www');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyFileOrDir(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDirRecursive(src, dest);
  } else {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function buildCleanWww() {
  console.log("===============================================================================");
  console.log("ISOLATION DU FRONTEND VERCEL — CRÉATION DU DOSSIER WWW/");
  console.log("===============================================================================\n");

  if (fs.existsSync(WWW_DIR)) {
    fs.rmSync(WWW_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(WWW_DIR, { recursive: true });

  // 1. Copie des fichiers racine autorisés
  const allowedRootFiles = ['index.html', 'manifest.json', 'sw.js', 'favicon.ico'];
  for (const file of allowedRootFiles) {
    const src = path.join(ROOT_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(WWW_DIR, file));
    }
  }

  // 2. Copie du dossier assets/
  const assetsSrc = path.join(ROOT_DIR, 'assets');
  if (fs.existsSync(assetsSrc)) {
    copyDirRecursive(assetsSrc, path.join(WWW_DIR, 'assets'));
  }

  // 3. Copie des 126 écrans HTML
  const matrixPath = path.join(ROOT_DIR, 'BETA_ROUTE_STATUS_MATRIX.json');
  const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));

  let screenCount = 0;
  for (const item of matrix) {
    const cleanRoute = item.route.replace(/^\//, '');
    const screenSrc = path.join(ROOT_DIR, cleanRoute);
    const screenDest = path.join(WWW_DIR, cleanRoute);

    if (fs.existsSync(screenSrc)) {
      copyFileOrDir(screenSrc, screenDest);
      screenCount++;
    } else {
      console.warn(`[WARN] Écran introuvable : ${cleanRoute}`);
    }
  }

  console.log(`\nCopie terminée : ${screenCount} écrans copiés dans www/`);
  console.log(`Vérification de l'étanchéité www/ :`);
  console.log(`- backend présent dans www/ : ${fs.existsSync(path.join(WWW_DIR, 'backend'))}`);
  console.log(`- scripts présent dans www/ : ${fs.existsSync(path.join(WWW_DIR, 'scripts'))}`);
  console.log(`- scratch présent dans www/ : ${fs.existsSync(path.join(WWW_DIR, 'scratch'))}`);
  console.log(`- supabase présent dans www/ : ${fs.existsSync(path.join(WWW_DIR, 'supabase'))}`);
  console.log(`- package.json présent dans www/ : ${fs.existsSync(path.join(WWW_DIR, 'package.json'))}`);
}

if (require.main === module) {
  buildCleanWww();
}

module.exports = { buildCleanWww };
