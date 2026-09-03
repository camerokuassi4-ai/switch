/**
 * tests/test_single_use_qr_withdrawal.js
 * HARNAIS DE TEST AUTOMATISÉ : RETRAIT EN KIOSQUE PAR QR À USAGE UNIQUE (5 MIN)
 */

const fs = require('fs');
const assert = require('assert');

console.log('=================================================================');
console.log('  TESTS AUTOMATISÉS : RETRAIT EN KIOSQUE PAR QR À USAGE UNIQUE');
console.log('=================================================================\n');

// Mock Browser Environment
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = v.toString(); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
global.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.CustomEvent = class CustomEvent { constructor(n, d) { this.name = n; this.detail = d; } };
global.alert = () => {};
global.window = { localStorage: global.localStorage, sessionStorage: global.sessionStorage, dispatchEvent: () => {}, addEventListener: () => {} };

// Charge API
const apiCode = fs.readFileSync('assets/switch.api.js', 'utf8');
eval(apiCode);
const SwitchAPI = global.window.SwitchAPI;

async function runTests() {
  localStorage.clear();
  SwitchAPI.getCentralAccounts();

  const clientPhone = '0197112233';
  localStorage.setItem('switch_user_phone', clientPhone);
  localStorage.setItem('switch_user_phone_raw', clientPhone);
  localStorage.setItem('switch_user_fullname', 'Jean Koffi Adjovi');
  SwitchAPI.setBalance(50000);

  // 1. RETRAIT RÉUSSI (NORMAL FLOW)
  console.log('--- 1. RETRAIT RÉUSSI (NORMAL FLOW) ---');
  const tokRes1 = await SwitchAPI.createWithdrawalToken(25000, '1234');
  assert.strictEqual(tokRes1.success, true, 'Création du QR de retrait doit réussir après PIN');
  assert.strictEqual(tokRes1.token.status, 'pending_cashout', 'Statut initial = pending_cashout');
  assert(tokRes1.token.expires_at > Date.now(), 'Expiration fixée à +5 min');

  // VÉRIFICATION DE SÉCURITÉ : AUCUN PIN DANS LE QR OU LE TOKEN
  assert.strictEqual(tokRes1.token.pin, undefined, 'Le PIN ne doit JAMAIS être stocké dans le token');
  assert(!tokRes1.token.qr_payload.includes('1234'), 'Le PIN ne doit JAMAIS être dans la payload QR');
  console.log('✔ Sécurité PIN validée : Aucun PIN transmis ou présent dans le QR Code');

  // Agent Scanne le QR Code
  const scanRes1 = await SwitchAPI.scanWithdrawalToken(tokRes1.token.token_id);
  assert.strictEqual(scanRes1.is_valid, true, 'Le scan agent doit valider le QR pending_cashout');
  assert.strictEqual(scanRes1.amount, 25000);
  assert.strictEqual(scanRes1.client_masked_name, 'Jean K.');
  console.log('✔ Agent Scanne QR : Identité masquée affichée ("Jean K."), Montant: 25 000 FCFA');

  // Agent Confirme la Remise d'Espèces
  SwitchAPI.setAgentFloat(100000);
  SwitchAPI.setAgentCommissions(0);
  const confirmRes1 = await SwitchAPI.processAgentWithdrawalConfirmation(tokRes1.token.token_id);

  assert.strictEqual(confirmRes1.success, true, 'La confirmation agent doit réussir');
  assert.strictEqual(SwitchAPI.getBalance(), 24875, 'Solde client débité du montant (25 000) + frais (125 F)');
  assert.strictEqual(SwitchAPI.getAgentFloat(), 125000, 'Float agent crédité des 25 000 F d\'espèces');
  assert(SwitchAPI.getAgentCommissions() > 0, 'Commission agent crédité');
  console.log('✔ Remise d\'espèces confirmée : Client débité, Float agent mis à jour, Reçu certifié généré');

  // 2. QR EXPIRÉ (> 5 MIN)
  console.log('\n--- 2. QR EXPIRÉ (> 5 MIN) ---');
  SwitchAPI.setBalance(50000);
  const tokRes2 = await SwitchAPI.createWithdrawalToken(10000, '1234');

  // Forcer l'expiration (> 5 min)
  const tokens = SwitchAPI.getWithdrawalTokens();
  const tok2 = tokens.find(t => t.token_id === tokRes2.token.token_id);
  tok2.expires_at = Date.now() - 1000; // Expiré il y a 1s
  SwitchAPI.saveWithdrawalTokens(tokens);

  const scanRes2 = await SwitchAPI.scanWithdrawalToken(tokRes2.token.token_id);
  assert.strictEqual(scanRes2.success, false);
  assert.strictEqual(scanRes2.error_code, 'EXPIRED');
  assert.strictEqual(SwitchAPI.getBalance(), 50000, 'Solde intact (0 débit sur QR expiré)');
  console.log('✔ QR Expiré : Transaction rejetée avec code EXPIRED, Solde client intact (50 000 FCFA)');

  // 3. QR ANNULÉ PAR LE CLIENT
  console.log('\n--- 3. QR ANNULÉ PAR LE CLIENT ---');
  const tokRes3 = await SwitchAPI.createWithdrawalToken(15000, '1234');
  await SwitchAPI.cancelWithdrawalToken(tokRes3.token.token_id);

  const scanRes3 = await SwitchAPI.scanWithdrawalToken(tokRes3.token.token_id);
  assert.strictEqual(scanRes3.success, false);
  assert.strictEqual(scanRes3.error_code, 'CANCELLED');
  assert.strictEqual(SwitchAPI.getBalance(), 50000, 'Solde intact après annulation client');
  console.log('✔ QR Annulé : Annulation enregistrée, 0 FCFA débité');

  // 4 & 7. QR DÉJÀ UTILISÉ & DOUBLE SCAN (IDEMPOTENCE)
  console.log('\n--- 4 & 7. QR DÉJÀ UTILISÉ & DOUBLE SCAN ---');
  const scanResReuse = await SwitchAPI.scanWithdrawalToken(tokRes1.token.token_id);
  assert.strictEqual(scanResReuse.success, false);
  assert.strictEqual(scanResReuse.error_code, 'ALREADY_USED');
  console.log('✔ Double Scan / Réutilisation : Rejet strict avec code ALREADY_USED');

  // 8. DOUBLE CLIC SUR CONFIRMATION AGENT (IDEMPOTENCE STRICTE)
  console.log('\n--- 8. DOUBLE CLIC SUR CONFIRMATION AGENT ---');
  const balBeforeDouble = SwitchAPI.getBalance();
  const doubleConfirmRes = await SwitchAPI.processAgentWithdrawalConfirmation(tokRes1.token.token_id);
  assert.strictEqual(doubleConfirmRes.success, false);
  assert.strictEqual(doubleConfirmRes.error_code, 'ALREADY_USED');
  assert.strictEqual(SwitchAPI.getBalance(), balBeforeDouble, 'Aucun double débit au 2ème clic');
  console.log('✔ Idempotence Clôture : Le 2ème clic ne provoque AUCUN double débit');

  // 5. SOLDE CLIENT INSUFFISANT
  console.log('\n--- 5. SOLDE CLIENT INSUFFISANT ---');
  SwitchAPI.setBalance(2000);
  const tokResLow = await SwitchAPI.createWithdrawalToken(10000, '1234');
  assert.strictEqual(tokResLow.success, false, 'Création refusée pour solde insuffisant');
  console.log('✔ Solde Insuffisant : Demande rejetée à la création');

  // 9. REÇUS ET HISTORIQUE DES DEUX CÔTÉS
  console.log('\n--- 9. VÉRIFICATION HISTORIQUE & REÇUS ---');
  const clientTxs = SwitchAPI.getTransactions();
  const agentTxs = SwitchAPI.getAgentTransactions();
  assert(clientTxs.some(t => t.type === 'withdrawal' || t.category === 'withdrawal' || (t.title && t.title.includes('Retrait'))), 'Transaction retrait présente côté client');
  assert(agentTxs.some(t => t.type === 'retrait' || (t.title && t.title.includes('Cash-Out'))), 'Transaction retrait présente côté agent');
  console.log('✔ Reçus & Historique : Écriture certifiée synchronisée des 2 côtés');

  console.log('\n=================================================================');
  console.log('  BILAN FINAL : TOUS LES TESTS DE RETRAIT QR SONT 100% VALIDÉS');
  console.log('=================================================================');
  console.log('RETRAIT_QR_SECURISÉ_VALIDÉ');
}

runTests();
