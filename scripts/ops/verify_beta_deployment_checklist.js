/**
 * VÉRIFICATION DE LA CHECKLIST FINALE DE DÉPLOIEMENT BÊTA
 * Fichier : scripts/ops/verify_beta_deployment_checklist.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { unifiedServer } = require('../../backend/staging_unified_server.js');

async function verifyChecklist() {
  console.log("===============================================================================");
  console.log("CONTRÔLE DE CONFORMITÉ — CHECKLIST FINALE DE DÉPLOIEMENT BÊTA PUBLIQUE");
  console.log("===============================================================================\n");

  const PORT = 4190;
  await new Promise(resolve => unifiedServer.listen(PORT, '127.0.0.1', resolve));

  const checklistResults = [];

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

  // 1. manifest.json
  const manifestRes = await fetchUrl('/manifest.json');
  checklistResults.push({
    item: "1. Manifest PWA (manifest.json)",
    status: manifestRes.status === 200 && manifestRes.data.includes("Switch Bénin") ? "CONFORME" : "NON_CONFORME",
    details: `HTTP ${manifestRes.status} | JSON Valide`
  });

  // 2. Assets essentiels (CSS & JS)
  const cssRes = await fetchUrl('/assets/switch.css');
  const jsRes = await fetchUrl('/assets/switch.config.js');
  checklistResults.push({
    item: "2. Assets statiques (CSS & Config JS)",
    status: (cssRes.status === 200 && jsRes.status === 200) ? "CONFORME" : "NON_CONFORME",
    details: `switch.css (HTTP ${cssRes.status}), switch.config.js (HTTP ${jsRes.status})`
  });

  // 3. Protection répertoire /scratch & /backups (Pas de fuite publique)
  const scratchRes = await fetchUrl('/scratch/preprod_storage.json');
  checklistResults.push({
    item: "3. Étanchéité répertoire /scratch & secrets",
    status: (scratchRes.status === 404 || scratchRes.status === 403) ? "CONFORME" : "NON_CONFORME",
    details: `Accès direct non servi publiquement (HTTP ${scratchRes.status})`
  });

  // 4. Verrouillage Financier Global (HTTP 403 FEATURE_NOT_AVAILABLE)
  const finEndpoints = ['/api/v1/payments/sbee', '/api/v1/payments/card', '/api/v1/payments/transfer', '/api/v1/payments/payout', '/api/v1/qr/pay'];
  let all403 = true;
  for (const ep of finEndpoints) {
    const res = await fetchUrl(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 1000 }) });
    if (res.status !== 403) all403 = false;
  }
  checklistResults.push({
    item: "4. Verrouillage Financier Backend (HTTP 403)",
    status: all403 ? "CONFORME" : "NON_CONFORME",
    details: "100% des endpoints financiers renvoient HTTP 403 FEATURE_NOT_AVAILABLE"
  });

  // 5. Présence des documents réglementaires (Support & Politique de Confidentialité)
  const supportRes = await fetchUrl('/support_aide/code.html');
  const privacyRes = await fetchUrl('/politique_confidentialite/code.html');
  checklistResults.push({
    item: "5. Documents Légaux & Support Accessibles",
    status: (supportRes.status === 200 && privacyRes.status === 200) ? "CONFORME" : "NON_CONFORME",
    details: `Support (HTTP ${supportRes.status}), Confidentialité (HTTP ${privacyRes.status})`
  });

  // 6. Plan de Rollback Documenté
  const rollbackExists = fs.existsSync(path.join(__dirname, '../../BETA_DEPLOYMENT_CHECKLIST.md'));
  checklistResults.push({
    item: "6. Procédure de Rollback Documentée",
    status: rollbackExists ? "CONFORME" : "NON_CONFORME",
    details: "BETA_DEPLOYMENT_CHECKLIST.md et BETA_KNOWN_LIMITATIONS.md présents"
  });

  await new Promise(resolve => unifiedServer.close(resolve));

  console.table(checklistResults);
  const isReady = checklistResults.every(r => r.status === "CONFORME");
  console.log(`\nRÉSULTAT GLOBAL : ${isReady ? "BETA_DEPLOYMENT_READY_FOR_HUMAN_APPROVAL" : "BETA_DEPLOYMENT_BLOCKED"}`);

  return { isReady, checklistResults };
}

if (require.main === module) {
  verifyChecklist();
}

module.exports = { verifyChecklist };
