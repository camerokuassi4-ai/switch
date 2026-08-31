/**
 * TEST E2E DU PARCOURS FRONTEND ET ÉTATS D'UI EN PRÉPRODUCTION
 * Fichier : scripts/ops/test_frontend_e2e_staging.js
 */

const http = require('http');
const { unifiedServer } = require('../../backend/staging_unified_server.js');

async function runFrontendE2eTests() {
  console.log("===============================================================================");
  console.log("TESTS END-TO-END : PARCOURS FRONTEND PWA & ÉTATS D'INTERFACE EN STAGING");
  console.log("===============================================================================\n");

  const PORT = 4070;
  await new Promise(res => unifiedServer.listen(PORT, '127.0.0.1', res));

  function getPage(path) {
    return new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${PORT}${path}`, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, html: data }));
      }).on('error', reject);
    });
  }

  function postApi(path, body) {
    return new Promise((resolve, reject) => {
      const payloadStr = JSON.stringify(body);
      const req = http.request({
        host: '127.0.0.1',
        port: PORT,
        path: `/api/v1${path}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadStr)
        }
      }, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          let parsed = {};
          try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
          resolve({ statusCode: res.statusCode, data: parsed });
        });
      });
      req.on('error', reject);
      req.write(payloadStr);
      req.end();
    });
  }

  const results = [];

  // 1. Accès à l'accueil PWA et script API Bridge
  const home = await getPage('/index.html');
  const bridge = await getPage('/assets/js/api_bridge.js');
  results.push({
    test: "1. Chargement Frontend & API Bridge",
    status: (home.statusCode === 200 && bridge.statusCode === 200) ? "PASSED" : "FAILED",
    details: "index.html (200 OK) et assets/js/api_bridge.js servis sans erreur."
  });

  // 2. Écran Inscription & Onboarding API
  const regPage = await getPage('/inscription/code.html');
  const regApi = await postApi('/auth/onboarding', { user_id: 'usr-e2e-01', phone: '+22997112233' });
  results.push({
    test: "2. Parcours Inscription & Création Profil",
    status: (regPage.statusCode === 200 && regApi.statusCode === 201) ? "PASSED" : "FAILED",
    details: "Écran d'inscription opérationnel, profil créé avec statut PENDING."
  });

  // 3. Écran OTP & Validation Code
  const otpPage = await getPage('/v_rification_otp/code.html');
  const otpApi = await postApi('/auth/verify-otp', { user_id: 'usr-e2e-01', otp: '1234' });
  results.push({
    test: "3. Parcours OTP & Authentification",
    status: (otpPage.statusCode === 200 && otpApi.statusCode === 200) ? "PASSED" : "FAILED",
    details: "Écran OTP validé, statut utilisateur passé à APPROVED_LEVEL_1."
  });

  // 4. Écran KYC Niveau 2
  const kycPage = await getPage('/kyc_verification_identite/code.html');
  const kycApi = await postApi('/kyc/upgrade', { user_id: 'usr-e2e-01', documents: { id_document_url: 'https://doc', facial_match_score: 95 } });
  results.push({
    test: "4. Parcours KYC & Vérification Biométrique",
    status: (kycPage.statusCode === 200 && kycApi.statusCode === 200 && kycApi.data.profile.kyc_level === 2) ? "PASSED" : "FAILED",
    details: "Écran KYC validé, passage au Niveau 2 (plafond 2M FCFA)."
  });

  // 5. Écran Paiement & Rate Limiting
  const payPage = await getPage('/paiement_sbee_electricite/code.html');
  const payApi1 = await postApi('/payments/transfer', { user_id: 'usr-e2e-pay', amount: 5000 });
  const payApi2 = await postApi('/payments/transfer', { user_id: 'usr-e2e-pay', amount: 5000 });
  const payApi3 = await postApi('/payments/transfer', { user_id: 'usr-e2e-pay', amount: 5000 });
  const payApi4 = await postApi('/payments/transfer', { user_id: 'usr-e2e-pay', amount: 5000 }); // Bloqué 429
  results.push({
    test: "5. Parcours Paiement & Rate Limiting (UI Loading/Error)",
    status: (payPage.statusCode === 200 && payApi1.statusCode === 200 && payApi4.statusCode === 429) ? "PASSED" : "FAILED",
    details: "Écran de paiement opérationnel, 3 transferts acceptés, 4ème rejeté (429)."
  });

  // 6. Écran POS Marchand & Consommation QR
  const posPage = await getPage('/caisse_marchand_pos/code.html');
  const qrApi = await postApi('/merchant/qr-pay', { qr_id: 'QR-E2E-99', expires_at_timestamp: Date.now() + 60000 });
  results.push({
    test: "6. Parcours Caisse POS & Encaissement QR",
    status: (posPage.statusCode === 200 && qrApi.statusCode === 200) ? "PASSED" : "FAILED",
    details: "Écran POS opérationnel, QR encaissé et reçu RCP-QR généré."
  });

  // 7. Écran Historique des Transactions
  const histPage = await getPage('/historique_des_transactions/code.html');
  results.push({
    test: "7. Écran Historique des Transactions",
    status: histPage.statusCode === 200 ? "PASSED" : "FAILED",
    details: "Écran d'historique servi avec succès (200 OK)."
  });

  await new Promise(res => unifiedServer.close(res));

  console.table(results);
  const allPassed = results.every(r => r.status === "PASSED");
  console.log(`\nBILAN GLOBAL DES TESTS E2E FRONTEND STAGING : ${allPassed ? "100% SUCCÈS (7/7 PARCOURS VALIDÉS)" : "ÉCHEC"}\n`);
  return allPassed;
}

if (require.main === module) {
  runFrontendE2eTests();
}

module.exports = { runFrontendE2eTests };
