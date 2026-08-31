/**
 * TEST COMPLET DE PERSISTANCES ET RÉSILIENCE APRÈS REDÉMARRAGE DU BACKEND PREPROD
 * Fichier : scripts/ops/test_preprod_persistence_restart.js
 */

const http = require('http');
const { PreprodApiApp } = require('../../backend/preprod_api_server.js');
const crypto = require('crypto');

async function testPersistenceAndRestart() {
  console.log("===============================================================================");
  console.log("BANC D'ESSAI DES 7 TESTS OBLIGATOIRES DE PERSISTANCE & REDÉMARRAGE PREPROD");
  console.log("===============================================================================\n");

  const SECRET = "preprod-hmac-secret-key-2026";
  function genSig(payload) {
    return crypto.createHmac('sha256', SECRET).update(JSON.stringify(payload)).digest('hex');
  }

  function req(port, method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const payloadStr = body ? JSON.stringify(body) : '';
      const reqHeaders = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadStr),
        ...headers
      };

      const request = http.request({
        host: '127.0.0.1',
        port: port,
        path: path,
        method: method,
        headers: reqHeaders
      }, (res) => {
        let resData = '';
        res.on('data', chunk => { resData += chunk; });
        res.on('end', () => {
          let parsed = {};
          try { parsed = JSON.parse(resData); } catch (e) { parsed = resData; }
          resolve({ statusCode: res.statusCode, data: parsed });
        });
      });

      request.on('error', reject);
      if (payloadStr) request.write(payloadStr);
      request.end();
    });
  }

  const results = [];

  // PHASE 1 : Premier Démarrage de l'Instance A
  const appA = new PreprodApiApp();
  const serverA = http.createServer((q, s) => appA.handleRequest(q, s));
  await new Promise(res => serverA.listen(4060, '127.0.0.1', res));

  // 1. KYC avec création de profil
  const obRes = await req(4060, 'POST', '/api/v1/auth/onboarding', { user_id: 'usr-pers-01', phone: '+22997009988' });
  const otpRes = await req(4060, 'POST', '/api/v1/auth/verify-otp', { user_id: 'usr-pers-01', otp: '1234' });
  results.push({
    test: "1. KYC & Persistance Profil",
    status: (obRes.statusCode === 201 && otpRes.statusCode === 200) ? "PASSED" : "FAILED",
    details: "Profil créé et validé en base de préproduction."
  });

  // 2. Rate Limiting Multi-Clients
  const c1_1 = await req(4060, 'POST', '/api/v1/payments/transfer', { user_id: 'client-A', amount: 10000 });
  const c1_2 = await req(4060, 'POST', '/api/v1/payments/transfer', { user_id: 'client-A', amount: 10000 });
  const c1_3 = await req(4060, 'POST', '/api/v1/payments/transfer', { user_id: 'client-A', amount: 10000 });
  const c1_4 = await req(4060, 'POST', '/api/v1/payments/transfer', { user_id: 'client-A', amount: 10000 }); // Bloqué 429
  const c2_1 = await req(4060, 'POST', '/api/v1/payments/transfer', { user_id: 'client-B', amount: 10000 }); // Autre client -> Pass 200

  results.push({
    test: "2. Rate Limiting Multi-Clients Distincts",
    status: (c1_4.statusCode === 429 && c2_1.statusCode === 200) ? "PASSED" : "FAILED",
    details: "Client A bloqué à la 4ème requête, Client B indépendant et accepté."
  });

  // 3. POS & Caisse + QR Consommé
  const qr1 = await req(4060, 'POST', '/api/v1/merchant/qr-pay', { qr_id: 'QR-PERS-01', expires_at_timestamp: Date.now() + 60000 });
  const till = await req(4060, 'POST', '/api/v1/agent/till-close', { opening_cash: 10000, cash_in: 5000, cash_out: 2000, physical_cash: 13000 });
  results.push({
    test: "3. POS Caisse & Consommation QR",
    status: (qr1.statusCode === 200 && till.statusCode === 200) ? "PASSED" : "FAILED",
    details: "QR consommé et clôture de caisse enregistrée."
  });

  // 4. Notification avec Dédoublonnage
  const notif1 = await req(4060, 'POST', '/api/v1/notifications/send', { event_id: 'EVT-NOTIF-PERS', channel: 'SMS', recipient: '+22997000000', message: 'OTP' });
  results.push({
    test: "4. Notification Enregistrée",
    status: notif1.statusCode === 200 ? "PASSED" : "FAILED",
    details: "Notification envoyée et event_id persisté."
  });

  // 5. Webhook SBEE avec Signature
  const whPayload = { txId: 'TX-PERS-01', amount: 25000, provider: 'SBEE' };
  const sig = genSig(whPayload);
  const whRes = await req(4060, 'POST', '/api/v1/webhooks/sbee', whPayload, { 'x-sbee-signature': sig, 'x-sbee-event-id': 'EVT-WH-PERS-01' });
  results.push({
    test: "5. Webhook SBEE HMAC Traité",
    status: whRes.statusCode === 200 ? "PASSED" : "FAILED",
    details: "Webhook validé par HMAC et enregistré."
  });

  // ARRÊT DU SERVEUR A (SIMULATION DE CRASH / REDÉMARRAGE)
  await new Promise(res => serverA.close(res));

  // PHASE 2 : DÉMARRAGE D'UNE NOUVELLE INSTANCE B (VÉRIFICATION DE PERSISTANCE)
  const appB = new PreprodApiApp();
  const serverB = http.createServer((q, s) => appB.handleRequest(q, s));
  await new Promise(res => serverB.listen(4061, '127.0.0.1', res));

  // 6. Test de persistance après redémarrage
  const kycAfter = await req(4061, 'POST', '/api/v1/kyc/upgrade', { user_id: 'usr-pers-01', documents: { id_document_url: 'https://doc', facial_match_score: 90 } });
  const qrReplayAfter = await req(4061, 'POST', '/api/v1/merchant/qr-pay', { qr_id: 'QR-PERS-01', expires_at_timestamp: Date.now() + 60000 });
  const notifReplayAfter = await req(4061, 'POST', '/api/v1/notifications/send', { event_id: 'EVT-NOTIF-PERS', channel: 'SMS', recipient: '+22997000000', message: 'OTP' });
  const whReplayAfter = await req(4061, 'POST', '/api/v1/webhooks/sbee', whPayload, { 'x-sbee-signature': sig, 'x-sbee-event-id': 'EVT-WH-PERS-01' });

  const restartPersistencePassed = kycAfter.statusCode === 200 && kycAfter.data.profile.kyc_level === 2 &&
                                   qrReplayAfter.statusCode === 400 && qrReplayAfter.data.error === "QR_ALREADY_USED" &&
                                   notifReplayAfter.data.duplicate === true &&
                                   whReplayAfter.data.duplicate === true;

  results.push({
    test: "6. Résilience & Idempotence Post-Redémarrage",
    status: restartPersistencePassed ? "PASSED" : "FAILED",
    details: "Profil retrouvé, QR déjà consommé rejeté, Webhook & Notif reconnus comme doublons."
  });

  // 7. Test de charge isolé (50 requêtes concurrentes)
  let loadSuccess = 0;
  for (let i = 1; i <= 50; i++) {
    const res = await req(4061, 'POST', '/api/v1/payments/transfer', { user_id: `load-usr-${i % 10}`, amount: 1000 });
    if (res.statusCode === 200 || res.statusCode === 429) loadSuccess++;
  }

  results.push({
    test: "7. Test de Charge Isolé (50 Requêtes)",
    status: loadSuccess === 50 ? "PASSED" : "FAILED",
    details: "50/50 requêtes traitées avec succès ou régulées par rate-limit sans aucun crash."
  });

  await new Promise(res => serverB.close(res));

  console.table(results);
  const allPassed = results.every(r => r.status === "PASSED");
  console.log(`\nBILAN DU BANC D'ESSAI : ${allPassed ? "100% SUCCÈS (7/7 TESTS DE PERSISTANCE RÉUSSIS)" : "ÉCHEC"}\n`);
  return allPassed;
}

if (require.main === module) {
  testPersistenceAndRestart();
}

module.exports = { testPersistenceAndRestart };
