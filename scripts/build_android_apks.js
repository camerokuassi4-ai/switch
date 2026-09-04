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
    package: 'bj.switchuser.beta',
    entryPoint: 'accueil_splash_mis_jour',
    dashboard: 'tableau_de_bord_mis_jour',
    apkName: 'switch-beta-user-v2.1.0.apk',
    alias: 'switch_user_beta.apk'
  },
  {
    id: 'merchant',
    name: 'Switch Beta — Marchand',
    package: 'bj.switchmerchant.beta',
    entryPoint: 'inscription_marchand',
    dashboard: 'tableau_de_bord_marchand',
    apkName: 'switch-beta-merchant-v2.1.0.apk',
    alias: 'switch_merchant_beta.apk'
  },
  {
    id: 'agent',
    name: 'Switch Beta — Agent',
    package: 'bj.switchagent.beta',
    entryPoint: 'connexion_agent',
    dashboard: 'tableau_de_bord_agent',
    apkName: 'switch-beta-agent-v2.1.0.apk',
    alias: 'switch_agent_beta.apk'
  },
  {
    id: 'hybrid',
    name: 'Switch Beta — Hybride',
    package: 'bj.switchhybrid.beta',
    entryPoint: 'tableau_de_bord_agent_mixte',
    dashboard: 'tableau_de_bord_agent_mixte',
    apkName: 'switch-beta-hybrid-v2.1.0.apk',
    alias: 'switch_hybrid_beta.apk'
  }
];

const STRICT_EXCLUDE_DIRS = [
  '.git', '.github', 'node_modules', 'apps', 'dist', 'scratch', 'backups', 'download', 'downloads', 'www'
];

const STRICT_EXCLUDE_EXTS = [
  '.apk', '.zip', '.tar', '.gz', '.log', '.env', '.pem', '.key', '.p12', '.pkcs12', '.yml', '.gitignore', '.npmrc'
];

const STRICT_EXCLUDE_FILES = [
  '.env', '.env.local', '.env.production', '.env.example', '.gitignore', '.npmrc', '.apk', '.ds_store'
];

function isForbiddenFile(filename) {
  const lower = filename.toLowerCase();
  const ext = path.extname(lower);
  if (STRICT_EXCLUDE_FILES.includes(lower)) return true;
  if (lower.startsWith('.env')) return true;
  if (ext && STRICT_EXCLUDE_EXTS.includes(ext)) return true;
  if (STRICT_EXCLUDE_EXTS.some(e => lower.endsWith(e))) return true;
  return false;
}

function copyDirRecursive(src, dest, extraExcludes = []) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const excludes = [...STRICT_EXCLUDE_DIRS, ...extraExcludes];

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (excludes.includes(entry.name)) {
      continue;
    }
    if (!entry.isDirectory() && isForbiddenFile(entry.name)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, extraExcludes);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function scanDirStats(dirPath) {
  let fileCount = 0;
  let totalBytes = 0;
  const filesList = [];
  const forbiddenFound = [];

  function walk(current) {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (STRICT_EXCLUDE_DIRS.includes(entry.name)) {
          forbiddenFound.push({ path: fullPath, type: 'directory' });
        }
        walk(fullPath);
      } else {
        const stat = fs.statSync(fullPath);
        fileCount++;
        totalBytes += stat.size;
        const ext = path.extname(entry.name).toLowerCase();
        if (isForbiddenFile(entry.name)) {
          forbiddenFound.push({ path: fullPath, type: 'file' });
        }
        filesList.push({
          path: path.relative(dirPath, fullPath).replace(/\\/g, '/'),
          size: stat.size,
          ext: ext
        });
      }
    }
  }

  walk(dirPath);
  filesList.sort((a, b) => b.size - a.size);

  return {
    fileCount,
    totalBytes,
    totalMB: (totalBytes / (1024 * 1024)).toFixed(2),
    top10: filesList.slice(0, 10),
    forbiddenFound
  };
}

async function buildAll() {
  const syncOnly = process.argv.includes('--sync-only') || process.argv.includes('--no-gradle');
  console.log('====================================================');
  console.log(`🚀 PACKAGING ANDROID CAPACITOR — SWITCH BÉNIN BETA ${syncOnly ? '(MODE SYNC SEUL)' : ''}`);
  console.log('====================================================\n');

  for (const app of apps) {
    const appDir = path.join(appsDir, app.id);
    console.log(`\n📦 Préparation de l'application : ${app.name} (${app.package})...`);
    
    // 1. Prepare & Clean www
    const wwwDir = path.join(appDir, 'www');
    if (fs.existsSync(wwwDir)) {
      fs.rmSync(wwwDir, { recursive: true, force: true });
    }
    fs.mkdirSync(wwwDir, { recursive: true });
    
    // Copy assets to www/assets
    copyDirRecursive(path.join(rootDir, 'assets'), path.join(wwwDir, 'assets'));
    
    // Copy all screen folders containing code.html
    for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
      if (entry.isDirectory() && !STRICT_EXCLUDE_DIRS.includes(entry.name)) {
        const codeFile = path.join(rootDir, entry.name, 'code.html');
        if (fs.existsSync(codeFile)) {
          copyDirRecursive(path.join(rootDir, entry.name), path.join(wwwDir, entry.name));
        }
      }
    }
    
    // Prepare www/index.html (redirect to entryPoint)
    const indexHtmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"/>
  <title>${app.name}</title>
  <meta http-equiv="refresh" content="0; url=${app.entryPoint}/code.html" />
  <script>
    window.location.replace("${app.entryPoint}/code.html");
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

    // 2. Add or sync android assets
    const androidDir = path.join(appDir, 'android');
    const publicAssetsDir = path.join(androidDir, 'app', 'src', 'main', 'assets', 'public');
    if (fs.existsSync(publicAssetsDir)) {
      fs.rmSync(publicAssetsDir, { recursive: true, force: true });
    }

    if (!fs.existsSync(androidDir)) {
      console.log(`  ➕ Ajout de la plateforme Android via Capacitor...`);
      execSync('npx cap add android', { cwd: appDir, stdio: 'inherit' });
    } else {
      console.log(`  🔄 Synchronisation des assets Capacitor...`);
      execSync('npx cap copy android', { cwd: appDir, stdio: 'inherit' });
    }

    // 3. Blocking Audit Scan
    const wwwStats = scanDirStats(wwwDir);
    const publicStats = scanDirStats(publicAssetsDir);

    console.log(`  📊 Audit Bundle ${app.id.toUpperCase()} :`);
    console.log(`     - Files in www/: ${wwwStats.fileCount} (${wwwStats.totalMB} MB)`);
    console.log(`     - Files in assets/public/: ${publicStats.fileCount} (${publicStats.totalMB} MB)`);
    console.log(`     - Fichiers ou répertoires interdits détectés : ${wwwStats.forbiddenFound.length}`);

    if (wwwStats.forbiddenFound.length > 0 || publicStats.forbiddenFound.length > 0) {
      console.error(`  ❌ ERREUR BLOQUANTE : Artefacts interdits détectés dans le bundle !`, wwwStats.forbiddenFound);
      throw new Error(`BUNDLE NON CONFORME : Fichiers interdits présents pour ${app.id}`);
    }

    if (syncOnly) {
      console.log(`  ✅ Synchronisation et audit validés avec succès pour ${app.name}.`);
      continue;
    }

    // 3. Patch variables.gradle and build.gradle for compatibility with runner SDK 35 and Kotlin duplicate classes
    const variablesGradle = path.join(androidDir, 'variables.gradle');
    if (fs.existsSync(variablesGradle)) {
      let content = fs.readFileSync(variablesGradle, 'utf8');
      content = content.replace(/compileSdkVersion\s*=\s*\d+/, 'compileSdkVersion = 35');
      content = content.replace(/targetSdkVersion\s*=\s*\d+/, 'targetSdkVersion = 35');
      content = content.replace(/androidxCoreVersion\s*=\s*['"][^'"]+['"]/, "androidxCoreVersion = '1.15.0'");
      content = content.replace(/androidxActivityVersion\s*=\s*['"][^'"]+['"]/, "androidxActivityVersion = '1.9.3'");
      content = content.replace(/androidxAppCompatVersion\s*=\s*['"][^'"]+['"]/, "androidxAppCompatVersion = '1.7.0'");
      content = content.replace(/androidxFragmentVersion\s*=\s*['"][^'"]+['"]/, "androidxFragmentVersion = '1.8.5'");
      fs.writeFileSync(variablesGradle, content, 'utf8');
    }

    const rootBuildGradle = path.join(androidDir, 'build.gradle');
    if (fs.existsSync(rootBuildGradle)) {
      let content = fs.readFileSync(rootBuildGradle, 'utf8');
      if (!content.includes('kotlin-stdlib:1.8.22')) {
        content = content.replace(
          'allprojects {',
          `allprojects {
    configurations.all {
        resolutionStrategy {
            force 'org.jetbrains.kotlin:kotlin-stdlib:1.8.22'
            force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22'
            force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22'
        }
    }`
        );
        fs.writeFileSync(rootBuildGradle, content, 'utf8');
      }
    }

    const appBuildGradle = path.join(androidDir, 'app', 'build.gradle');
    if (fs.existsSync(appBuildGradle)) {
      let content = fs.readFileSync(appBuildGradle, 'utf8');
      if (!content.includes('kotlin-stdlib-jdk7:1.8.22')) {
        content = content.replace('dependencies {', `dependencies {
    constraints {
        implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22") {
            because("kotlin-stdlib-jdk7 is now a part of kotlin-stdlib")
        }
        implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22") {
            because("kotlin-stdlib-jdk8 is now a part of kotlin-stdlib")
        }
    }`);
        fs.writeFileSync(appBuildGradle, content, 'utf8');
      }
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
