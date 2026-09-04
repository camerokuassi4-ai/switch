const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const appsDir = path.join(rootDir, 'apps');
const distDownloadsDir = path.join(rootDir, 'dist', 'assets', 'downloads');
const assetsDownloadsDir = path.join(rootDir, 'assets', 'downloads');
const wwwDownloadsDir = path.join(rootDir, 'www', 'assets', 'downloads');

[distDownloadsDir, assetsDownloadsDir, wwwDownloadsDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const apps = [
  {
    id: 'user',
    name: 'Switch Beta — Utilisateur',
    package: 'bj.switch.user.beta',
    dashboard: 'tableau_de_bord_mis_jour',
    apkName: 'switch-beta-user-v2.1.0.apk',
    alias: 'switch_user_beta.apk'
  },
  {
    id: 'merchant',
    name: 'Switch Beta — Marchand',
    package: 'bj.switch.merchant.beta',
    dashboard: 'tableau_de_bord_marchand',
    apkName: 'switch-beta-merchant-v2.1.0.apk',
    alias: 'switch_merchant_beta.apk'
  },
  {
    id: 'agent',
    name: 'Switch Beta — Agent',
    package: 'bj.switch.agent.beta',
    dashboard: 'tableau_de_bord_agent',
    apkName: 'switch-beta-agent-v2.1.0.apk',
    alias: 'switch_agent_beta.apk'
  },
  {
    id: 'hybrid',
    name: 'Switch Beta — Hybride',
    package: 'bj.switch.hybrid.beta',
    dashboard: 'tableau_de_bord_agent_mixte',
    apkName: 'switch-beta-hybrid-v2.1.0.apk',
    alias: 'switch_hybrid_beta.apk'
  }
];

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function buildAll() {
  console.log('====================================================');
  console.log('🚀 COMPILATION ANDROID CAPACITOR — SWITCH BÉNIN BETA');
  console.log('====================================================\n');

  for (const app of apps) {
    const appDir = path.join(appsDir, app.id);
    console.log(`\n📦 Préparation de l'application : ${app.name} (${app.package})...`);
    
    // 1. Prepare www
    const wwwDir = path.join(appDir, 'www');
    if (!fs.existsSync(wwwDir)) fs.mkdirSync(wwwDir, { recursive: true });
    
    // Copy assets to www/assets
    copyDirRecursive(path.join(rootDir, 'assets'), path.join(wwwDir, 'assets'));
    
    // Copy dashboard files
    const dashSrc = path.join(rootDir, app.dashboard);
    const dashDest = path.join(wwwDir, app.dashboard);
    copyDirRecursive(dashSrc, dashDest);
    
    // Prepare www/index.html (redirect to dashboard or embed directly)
    const indexHtmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"/>
  <title>${app.name}</title>
  <meta http-equiv="refresh" content="0; url=${app.dashboard}/code.html" />
  <script>
    window.location.replace("${app.dashboard}/code.html");
  </script>
</head>
<body style="background:#5E3BDC; color:#ffffff; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
  <div style="text-align:center;">
    <h2 style="font-size:1.5rem; margin-bottom:0.5rem;">${app.name}</h2>
    <p style="opacity:0.8;">Chargement de l'application...</p>
  </div>
</body>
</html>`;
    fs.writeFileSync(path.join(wwwDir, 'index.html'), indexHtmlContent, 'utf8');

    // 2. Add or sync android
    const androidDir = path.join(appDir, 'android');
    if (!fs.existsSync(androidDir)) {
      console.log(`  ➕ Ajout de la plateforme Android via Capacitor...`);
      execSync('npx cap add android', { cwd: appDir, stdio: 'inherit' });
    } else {
      console.log(`  🔄 Synchronisation des assets Capacitor...`);
      execSync('npx cap sync android', { cwd: appDir, stdio: 'inherit' });
    }

    // 3. Patch variables.gradle for compatibility with runner SDK
    const variablesGradle = path.join(androidDir, 'variables.gradle');
    if (fs.existsSync(variablesGradle)) {
      let content = fs.readFileSync(variablesGradle, 'utf8');
      content = content.replace(/compileSdkVersion\s*=\s*\d+/, 'compileSdkVersion = 36');
      content = content.replace(/targetSdkVersion\s*=\s*\d+/, 'targetSdkVersion = 36');
      fs.writeFileSync(variablesGradle, content, 'utf8');
    }

    // 4. Build APK with Gradle
    console.log(`  🔨 Compilation native avec Gradle (assembleDebug)...`);
    const isWindows = process.platform === 'win32';
    const gradlewCmd = isWindows ? 'gradlew.bat' : './gradlew';
    if (!isWindows) {
      fs.chmodSync(path.join(androidDir, 'gradlew'), 0o755);
    }
    
    execSync(`${gradlewCmd} assembleDebug --no-daemon --stacktrace`, {
      cwd: androidDir,
      stdio: 'inherit'
    });

    // 5. Locate output APK
    const outputApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    if (!fs.existsSync(outputApk)) {
      throw new Error(`APK introuvable après compilation : ${outputApk}`);
    }

    const stat = fs.statSync(outputApk);
    const mb = (stat.size / (1024 * 1024)).toFixed(2);
    console.log(`  ✅ Compilation réussie ! APK généré : ${stat.size} octets (${mb} Mo)`);

    // 6. Copy to distribution directories
    const destinations = [
      path.join(distDownloadsDir, app.apkName),
      path.join(distDownloadsDir, app.alias),
      path.join(assetsDownloadsDir, app.apkName),
      path.join(assetsDownloadsDir, app.alias),
      path.join(wwwDownloadsDir, app.apkName),
      path.join(wwwDownloadsDir, app.alias)
    ];

    if (app.id === 'user') {
      destinations.push(
        path.join(distDownloadsDir, 'switch-beta-v2.1.0.apk'),
        path.join(distDownloadsDir, 'switch-beta.apk'),
        path.join(assetsDownloadsDir, 'switch-beta-v2.1.0.apk'),
        path.join(assetsDownloadsDir, 'switch-beta.apk'),
        path.join(wwwDownloadsDir, 'switch-beta-v2.1.0.apk'),
        path.join(wwwDownloadsDir, 'switch-beta.apk')
      );
    }

    // Specific redirect directories
    const redirs = [
      path.join(rootDir, 'dist', 'download', app.id, `${app.id}-beta.apk`),
      path.join(rootDir, 'dist', 'download', app.id, app.apkName),
      path.join(rootDir, 'www', 'download', app.id, `${app.id}-beta.apk`)
    ];
    if (app.id === 'user') {
      redirs.push(
        path.join(rootDir, 'dist', 'download', 'switch-beta.apk'),
        path.join(rootDir, 'www', 'download', 'switch-beta.apk')
      );
    }

    for (const d of [...destinations, ...redirs]) {
      const parent = path.dirname(d);
      if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
      fs.copyFileSync(outputApk, d);
    }

    console.log(`  📁 Copié vers toutes les cibles de téléchargement.`);
  }

  console.log('\n====================================================');
  console.log('🎉 TOUTES LES 4 APPLICATIONS ONT ÉTÉ COMPILÉES AVEC SUCCÈS !');
  console.log('====================================================');
}

buildAll().catch(err => {
  console.error('\n❌ Erreur lors de la compilation des APKs :', err);
  process.exit(1);
});
