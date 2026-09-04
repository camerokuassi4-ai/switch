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
    apkName: 'switch-beta-user-v2.2.1.apk',
    alias: 'switch_user_beta.apk',
    screens: [
      'accueil_splash_mis_jour',
      'inscription',
      'connexion',
      'v_rification_otp',
      'cr_ation_code_pin',
      'reinitialisation_code_pin',
      'succes_reinitialisation_pin',
      'modifier_le_profil',
      'bienvenue_succes_onboarding',
      'kyc_verification_identite',
      'resultat_verification_kyc',
      'succes_verification_niveau2',
      'verification_niveau_superieur',
      'tableau_de_bord_mis_jour',
      'profil_utilisateur',
      's_curit',
      'modification_du_code_pin',
      'centre_de_notifications',
      'notifications_vides',
      'historique_des_transactions',
      'historique_vide',
      'd_tail_de_transaction',
      'recu_transaction_partage',
      'support_aide',
      'appareils_connectes_securite',
      'd_p_t_de_fonds',
      'retrait_de_fonds',
      'code_depot_especes_agent',
      'code_retrait_especes_agent',
      'transfert_mobile_money',
      'transfert_switch_switch',
      'g_n_rer_qr_code_de_r_ception',
      'scanner_qr_code',
      'confirmation_paiement_qr',
      'confirmation_de_l_op_ration_code',
      'confirmation_de_succ_s',
      'chec_de_transaction',
      'carte_agents_guichets',
      'localiser_un_agent_switch',
      'd_tail_de_l_agent_switch',
      'achats_en_ligne_cartes_virtuelles',
      'creer_carte_virtuelle',
      'budget_analyse_depenses',
      'coffre_epargne_vault',
      'mes_tontines',
      'cr_er_une_tontine',
      'd_tail_de_la_tontine',
      'membres_de_la_tontine',
      'mes_cagnottes',
      'cr_er_une_cagnotte',
      'd_tail_de_la_cagnotte',
      'switch_kids_famille',
      'switch_sante_assurance',
      'micro_credit_express',
      'investissements_bons_tresor',
      'conversion_de_devises',
      'marketplace_boutiques_switch',
      'paiement_d_abonnements',
      'd_tail_de_l_abonnement',
      'paiement_sbee_electricite',
      'recu_recharge_sbee',
      'paiement_soneb_eau',
      'paiement_scolarite_campus',
      'recharge_credit_data',
      'paiements_recurrents_autopay',
      'parrainage_recompenses',
      'partage_addition_split',
      'mode_hors_ligne_ussd',
      'simulateur_de_frais',
      'moyens_de_paiement_li_s',
      'limites_de_transaction',
      'param_tres_g_n_raux',
      'verrouillage_pin',
      'choix_type_compte',
      'pas_de_connexion',
      'conditions_utilisation',
      'politique_confidentialite'
    ]
  },
  {
    id: 'merchant',
    name: 'Switch Beta — Marchand',
    package: 'bj.switchmerchant.beta',
    entryPoint: 'accueil_marchand',
    dashboard: 'tableau_de_bord_marchand',
    apkName: 'switch-beta-merchant-v2.2.1.apk',
    alias: 'switch_merchant_beta.apk',
    screens: [
      'accueil_marchand',
      'inscription_marchand',
      'v_rification_marchand',
      'setup_point_de_vente_marchand',
      'profil_de_l_entreprise',
      'tableau_de_bord_marchand',
      'caisse_marchand_pos',
      'operations_caisse_marchand',
      'd_tail_d_une_vente',
      'historique_des_ventes',
      'carnet_de_dettes_marchand',
      'liens_de_paiement_marchand',
      'catalogue_produits_services',
      'quipe_marchand',
      'retrait_marchand',
      'support_marchand',
      'centre_de_notifications_marchand',
      'messagerie_marchand_clients',
      'connexion',
      'conditions_utilisation',
      'politique_confidentialite'
    ]
  },
  {
    id: 'agent',
    name: 'Switch Beta — Agent',
    package: 'bj.switchagent.beta',
    entryPoint: 'connexion_agent',
    dashboard: 'tableau_de_bord_agent',
    apkName: 'switch-beta-agent-v2.2.1.apk',
    alias: 'switch_agent_beta.apk',
    screens: [
      'connexion_agent',
      'inscription_agent_switch',
      'agent_verification_caution',
      'documents_contrat_agent',
      'confirmation_biometrique_agent',
      'tableau_de_bord_agent',
      'tableau_de_bord_agent_simple',
      'd_p_t_de_fonds_mis_jour_agent',
      'retrait_de_fonds_mis_jour_agent',
      'valider_une_op_ration_client',
      'recu_operation_agent',
      'services_factures_agent',
      'demande_de_r_approvisionnement_float',
      'succes_reapprovisionnement_float',
      'transfert_float_inter_agent',
      'historique_des_op_rations_agent',
      'releve_operations_agent',
      'bareme_commissions_agent',
      'retrait_commissions_agent',
      'gestion_caissiers_agent',
      'cloture_de_caisse_agent',
      'param_tres_et_profil_agent',
      'modifier_profil_agent',
      'securite_et_pin_agent',
      'centre_de_notifications_agent',
      'support_assistance_agent',
      'conditions_utilisation',
      'politique_confidentialite'
    ]
  },
  {
    id: 'hybrid',
    name: 'Switch Beta — Hybride',
    package: 'bj.switchhybrid.beta',
    entryPoint: 'accueil_hybride',
    dashboard: 'tableau_de_bord_agent_mixte',
    apkName: 'switch-beta-hybrid-v2.2.1.apk',
    alias: 'switch_hybrid_beta.apk',
    screens: [
      'accueil_hybride',
      'connexion_agent',
      'tableau_de_bord_agent_mixte',
      'cloture_de_caisse_hybride',
      'services_factures_hybride',
      'param_tres_et_profil_hybride',
      'd_p_t_de_fonds_mis_jour_agent',
      'retrait_de_fonds_mis_jour_agent',
      'valider_une_op_ration_client',
      'recu_operation_agent',
      'demande_de_r_approvisionnement_float',
      'succes_reapprovisionnement_float',
      'transfert_float_inter_agent',
      'historique_des_op_rations_agent',
      'releve_operations_agent',
      'bareme_commissions_agent',
      'retrait_commissions_agent',
      'gestion_caissiers_agent',
      'securite_et_pin_agent',
      'centre_de_notifications_agent',
      'support_assistance_agent',
      'inscription_agent_switch',
      'agent_verification_caution',
      'documents_contrat_agent',
      'confirmation_biometrique_agent',
      'caisse_marchand_pos',
      'operations_caisse_marchand',
      'tableau_de_bord_marchand',
      'catalogue_produits_services',
      'liens_de_paiement_marchand',
      'carnet_de_dettes_marchand',
      'd_tail_d_une_vente',
      'historique_des_ventes',
      'retrait_marchand',
      'support_marchand',
      'centre_de_notifications_marchand',
      'messagerie_marchand_clients',
      'v_rification_marchand',
      'setup_point_de_vente_marchand',
      'profil_de_l_entreprise',
      'inscription_marchand',
      'quipe_marchand',
      'tableau_de_bord_agent',
      'tableau_de_bord_agent_simple',
      'modifier_profil_agent',
      'param_tres_et_profil_agent',
      'conditions_utilisation',
      'politique_confidentialite'
    ]
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
    fs.writeFileSync(path.join(wwwDir, 'assets', 'switch.env.js'), `/**\n * switch.env.js\n * Identité de l'application mobile (User, Merchant, Agent, Hybrid)\n */\nwindow.SWITCH_APP_PACKAGE = "${app.id}";\n`, 'utf8');
    fs.appendFileSync(path.join(wwwDir, 'assets', 'switch.config.js'), `\n/* Identité de l'application mobile */\nwindow.SWITCH_APP_PACKAGE = "${app.id}";\n`, 'utf8');
    
    // Copy ONLY role-specific screen folders defined in app.screens
    for (const screenName of app.screens) {
      const screenPath = path.join(rootDir, screenName);
      if (fs.existsSync(screenPath) && fs.statSync(screenPath).isDirectory()) {
        copyDirRecursive(screenPath, path.join(wwwDir, screenName));
      } else {
        console.warn(`  ⚠️ Écran non trouvé ou ignoré : ${screenName}`);
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
        path.join(distDownloadsDir, 'switch-beta-v2.2.1.apk'),
        path.join(distDownloadsDir, 'switch-beta.apk'),
        path.join(assetsDownloadsDir, 'switch-beta-v2.2.1.apk'),
        path.join(assetsDownloadsDir, 'switch-beta.apk'),
        path.join(wwwDownloadsDir, 'switch-beta-v2.2.1.apk'),
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
