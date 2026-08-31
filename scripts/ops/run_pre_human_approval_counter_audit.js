/**
 * CONTRE-VÉRIFICATION STRICTE AVANT APPROBATION HUMAINE DU DÉPLOIEMENT BÊTA
 * Fichier : scripts/ops/run_pre_human_approval_counter_audit.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { unifiedServer } = require('../../backend/staging_unified_server.js');

async function runCounterAudit() {
  console.log("===============================================================================");
  console.log("CONTRE-VÉRIFICATION FORMELLE AVANT APPROBATION HUMAINE");
  console.log("===============================================================================\n");

  const PORT = 4195;
  await new Promise(resolve => unifiedServer.listen(PORT, '127.0.0.1', resolve));

  // Helper HTTP request
  function fetchUrl(urlPath, options = {}) {
    return new Promise((resolve) => {
      const req = http.request(`http://127.0.0.1:${PORT}${urlPath}`, options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, data, headers: res.headers });
        });
      });
      req.on('error', (err) => resolve({ status: 500, error: err.message }));
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  // Helper sha256
  function getSha256(filePath) {
    if (!fs.existsSync(filePath)) return "INTROUVABLE";
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  // 1. AUDIT DE LA MATRICE DES 126 ÉCRANS
  const matrixPath = path.join(__dirname, '../../BETA_ROUTE_STATUS_MATRIX.json');
  const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));

  const counts = { USER: 0, MERCHANT: 0, AGENT: 0, HYBRID: 0 };
  const seenRoutes = new Set();
  let duplicates = 0;
  let emptyRoutes = 0;
  let notVerified = 0;
  let fails = 0;

  matrix.forEach(item => {
    if (counts[item.role] !== undefined) counts[item.role]++;
    if (!item.route || item.route.trim() === '') emptyRoutes++;
    if (seenRoutes.has(item.route)) duplicates++;
    seenRoutes.add(item.route);
    if (item.status === 'NOT_VERIFIED') notVerified++;
    if (item.status === 'FAIL') fails++;
  });

  console.log("--- 1. ANALYSE DYNAMIQUE DE BETA_ROUTE_STATUS_MATRIX.JSON ---");
  console.log(`Total Écrans : ${matrix.length}`);
  console.log(`Utilisateur : ${counts.USER} (Attendu : 58)`);
  console.log(`Marchand : ${counts.MERCHANT} (Attendu : 24)`);
  console.log(`Agent : ${counts.AGENT} (Attendu : 28)`);
  console.log(`Hybride : ${counts.HYBRID} (Attendu : 16)`);
  console.log(`Doublons : ${duplicates} | Routes vides : ${emptyRoutes}`);
  console.log(`FAIL : ${fails} | NOT_VERIFIED : ${notVerified}\n`);

  // 2. AUDIT DE L'ÉTANCHÉITÉ DU SERVEUR (SENSITIVE DIRECTORIES)
  console.log("--- 2. CONTRÔLE DE PROTECTION DES RÉPERTOIRES SENSIBLES ---");
  const sensitivePaths = [
    '/scratch/preprod_storage.json',
    '/scratch/audit_126_screens_matrix.json',
    '/backups/',
    '/scripts/worker_auto_loop.js',
    '/.git/config',
    '/.env',
    '/package-lock.json'
  ];

  const securityChecks = [];
  for (const sp of sensitivePaths) {
    const res = await fetchUrl(sp);
    const isProtected = res.status === 403 || res.status === 404;
    securityChecks.push({ path: sp, httpCode: res.status, status: isProtected ? "PROTÉGÉ" : "EXPOSÉ" });
  }
  console.table(securityChecks);

  // 3. AUDIT DE LA BARRIÈRE FINANCIÈRE
  console.log("\n--- 3. CONTRÔLE DES ENDPOINTS FINANCIERS ---");
  const finPaths = [
    '/api/v1/payments/sbee',
    '/api/v1/payments/card',
    '/api/v1/payments/transfer',
    '/api/v1/payments/payout',
    '/api/v1/qr/pay'
  ];

  const financialChecks = [];
  for (const fp of finPaths) {
    const res = await fetchUrl(fp, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 5000 }) });
    const isLocked = res.status === 403 && res.data.includes("FEATURE_NOT_AVAILABLE");
    financialChecks.push({ endpoint: fp, httpCode: res.status, status: isLocked ? "BLOQUÉ (403)" : "NON_VERROUILLÉ" });
  }
  console.table(financialChecks);

  // 4. HASH SHA-256 DES FICHIERS CRITIQUES
  console.log("\n--- 4. EMPREINTES NUMÉRIQUES (SHA-256) DES FICHIERS SERVEUR ET RELEASE ---");
  const criticalFiles = [
    'backend/staging_unified_server.js',
    'backend/preprod_api_server.js',
    'BETA_RELEASE_NOTES.md',
    'BETA_KNOWN_LIMITATIONS.md',
    'BETA_ROUTE_STATUS_MATRIX.json',
    'BETA_DEPLOYMENT_CHECKLIST.md'
  ];

  const hashes = criticalFiles.map(f => {
    const abs = path.join(__dirname, '../../', f);
    return {
      file: f,
      sha256: getSha256(abs).substring(0, 24) + '...',
      lastModified: fs.existsSync(abs) ? fs.statSync(abs).mtime.toISOString() : 'N/A'
    };
  });
  console.table(hashes);

  await new Promise(resolve => unifiedServer.close(resolve));

  const allMatrixValid = matrix.length === 126 && counts.USER === 58 && counts.MERCHANT === 24 && counts.AGENT === 28 && counts.HYBRID === 16 && duplicates === 0 && emptyRoutes === 0 && notVerified === 0 && fails === 0;
  const allSecurityValid = securityChecks.every(s => s.status === "PROTÉGÉ");
  const allFinancialValid = financialChecks.every(f => f.status === "BLOQUÉ (403)");

  const finalVerdict = (allMatrixValid && allSecurityValid && allFinancialValid)
    ? "BETA_DEPLOYMENT_READY_FOR_HUMAN_APPROVAL"
    : "BETA_DEPLOYMENT_BLOCKED";

  console.log(`\nVERDICT DE CONTRE-VÉRIFICATION : ${finalVerdict}`);
  return { finalVerdict, allMatrixValid, allSecurityValid, allFinancialValid };
}

if (require.main === module) {
  runCounterAudit();
}

module.exports = { runCounterAudit };
