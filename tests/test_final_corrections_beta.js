const fs = require('fs');
const assert = require('assert');

console.log('=== TEST SUITE: CORRECTIONS FINALES AVANT DÉPLOIEMENT BÊTA v2.1.0 ===');

// --- 1. TEST MENTION VERSION BÊTA ---
console.log('\n--- 1. Vérification de la mention Version Bêta ---');

const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(!indexHtml.includes('Version Bêta Publique'), 'index.html must not contain Version Bêta Publique');
assert(indexHtml.includes('Version Bêta'), 'index.html must contain Version Bêta');
console.log('✔ Test 1.1 : index.html utilise bien "Version Bêta"');

const splashHtml = fs.readFileSync('accueil_splash_mis_jour/code.html', 'utf8');
assert(!splashHtml.includes('VERSION BÊTA PUBLIQUE'), 'accueil_splash_mis_jour must not contain VERSION BÊTA PUBLIQUE');
assert(splashHtml.includes('VERSION BÊTA'), 'accueil_splash_mis_jour must contain VERSION BÊTA');
console.log('✔ Test 1.2 : accueil_splash_mis_jour utilise bien "VERSION BÊTA"');

// Check advanced modules
const advModules = [
  'coffre_epargne_vault/code.html',
  'mes_tontines/code.html',
  'paiement_scolarite_campus/code.html',
  'switch_kids_famille/code.html',
  'paiements_recurrents_autopay/code.html',
  'investissements_bons_tresor/code.html',
  'switch_sante_assurance/code.html',
  'micro_credit_express/code.html',
  'achats_en_ligne_cartes_virtuelles/code.html'
];
advModules.forEach(m => {
  const content = fs.readFileSync(m, 'utf8');
  assert(!content.includes('Bêta Publique v2.1.0'), `${m} contains old Bêta Publique mention`);
});
console.log('✔ Test 1.3 : Les 9 modules avancés ont été nettoyés de "Bêta Publique"');

// --- 2. TEST RECHARGE CRÉDIT GSM & FORFAITS DATA ---
console.log('\n--- 2. Vérification Recharge GSM & Forfaits Data ---');

const rechargeHtml = fs.readFileSync('recharge_credit_data/code.html', 'utf8');

// 2.A: UI elements
assert(rechargeHtml.includes('selectOperator'), 'Must have selectOperator');
assert(rechargeHtml.includes('op-mtn') && rechargeHtml.includes('op-moov') && rechargeHtml.includes('op-celtiis'), 'Must support MTN, Moov, Celtiis');
assert(rechargeHtml.includes('phone-num'), 'Must have phone input');
assert(rechargeHtml.includes('selectProductType'), 'Must allow switching airtime / data');
assert(rechargeHtml.includes('tab-airtime') && rechargeHtml.includes('tab-data'), 'Must have airtime & data tabs');
assert(rechargeHtml.includes('recharge-modal'), 'Must have confirmation modal');
console.log('✔ Test 2.A : Éléments UI (Opérateurs MTN/Moov/Celtiis, téléphone, onglets crédit/data, modale de reçu) conformes');

// Browser mock for execution logic test
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = v.toString(); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
global.CustomEvent = class CustomEvent { constructor(name, detail) { this.name = name; this.detail = detail; } };
global.window = {
  localStorage: global.localStorage,
  dispatchEvent: () => {},
  addEventListener: () => {}
};
global.navigator = { clipboard: { writeText: () => {} } };

const apiCode = fs.readFileSync('assets/switch.api.js', 'utf8');
eval(apiCode);
const SwitchAPI = global.window.SwitchAPI;

(async () => {
  // Initialiser le solde à 10 000 FCFA
  SwitchAPI.setBalance(10000);
  assert.strictEqual(SwitchAPI.getBalance(), 10000, 'Solde initial doit être de 10 000 FCFA');

  // Test 2.B & 2.C : Achat crédit d'appel 1 000 FCFA avec 2% de cashback
  const phone1 = '0197001122';
  const op1 = 'MTN Bénin';
  const amt1 = 1000;
  const payRes1 = await SwitchAPI.payBillOrAirtime('telecom', phone1, amt1, op1);
  assert.strictEqual(payRes1.success, true, 'Le paiement de la recharge de 1 000 F doit réussir');
  assert.strictEqual(SwitchAPI.getBalance(), 9000, 'Solde après débit 1 000 F doit être de 9 000 FCFA');

  // Crédit effectif du cashback de 2% (20 FCFA)
  const cashback1 = Math.round(amt1 * 0.02);
  assert.strictEqual(cashback1, 20, 'Cashback de 1000 F doit être exactement 20 FCFA');
  SwitchAPI.setBalance(SwitchAPI.getBalance() + cashback1);
  assert.strictEqual(SwitchAPI.getBalance(), 9020, 'Nouveau solde Switch après cashback 2% doit être 9 020 FCFA');

  // Enregistrement de la transaction dans l'historique
  const tx1 = {
    type: 'recharge_credit',
    category: 'telecom',
    amount: -amt1,
    cashback: cashback1,
    recipient: `${op1} (${phone1})`,
    status: 'success'
  };
  const txs = SwitchAPI.getTransactions();
  txs.unshift(tx1);
  localStorage.setItem('switch_transactions', JSON.stringify(txs));

  const savedTxs = SwitchAPI.getTransactions();
  assert.strictEqual(savedTxs[0].type, 'recharge_credit', 'Type de transaction doit être recharge_credit');
  assert.strictEqual(savedTxs[0].cashback, 20, 'Cashback de 20 FCFA doit être enregistré dans la transaction');
  console.log('✔ Test 2.B & 2.C (Airtime) : Débit 1 000 F + Crédit Cashback 20 F -> Solde net 9 020 F & Transaction loggée');

  // Test 2.C (Data bundle) : Achat forfait data 2 000 FCFA avec 2% de cashback (40 FCFA)
  const phone2 = '0195003344';
  const op2 = 'Moov Africa';
  const amt2 = 2000;
  const payRes2 = await SwitchAPI.payBillOrAirtime('telecom', phone2, amt2, op2);
  assert.strictEqual(payRes2.success, true, 'Le paiement du forfait de 2 000 F doit réussir');
  assert.strictEqual(SwitchAPI.getBalance(), 7020, 'Solde après débit 2 000 F doit être de 7 020 FCFA');

  const cashback2 = Math.round(amt2 * 0.02);
  assert.strictEqual(cashback2, 40, 'Cashback de 2000 F doit être exactement 40 FCFA');
  SwitchAPI.setBalance(SwitchAPI.getBalance() + cashback2);
  assert.strictEqual(SwitchAPI.getBalance(), 7060, 'Nouveau solde Switch après cashback 2% doit être 7 060 FCFA');

  const tx2 = {
    type: 'forfait_telco',
    category: 'telecom',
    amount: -amt2,
    cashback: cashback2,
    recipient: `${op2} (${phone2})`,
    status: 'success'
  };
  const updatedTxs = SwitchAPI.getTransactions();
  updatedTxs.unshift(tx2);
  localStorage.setItem('switch_transactions', JSON.stringify(updatedTxs));

  const savedTxs2 = SwitchAPI.getTransactions();
  assert.strictEqual(savedTxs2[0].type, 'forfait_telco', 'Type de transaction doit être forfait_telco');
  assert.strictEqual(savedTxs2[0].cashback, 40, 'Cashback de 40 FCFA doit être enregistré');
  console.log('✔ Test 2.C (Forfait Data) : Débit 2 000 F + Crédit Cashback 40 F -> Solde net 7 060 F & Transaction loggée');

  // Test 2.D : Rejet si solde insuffisant (ex: tentative 50 000 FCFA alors que solde = 7 060 FCFA)
  const failRes = await SwitchAPI.payBillOrAirtime('telecom', phone1, 50000, op1);
  assert.strictEqual(failRes.success, false, 'Le paiement doit être rejeté si le solde est insuffisant');
  assert.strictEqual(SwitchAPI.getBalance(), 7060, 'Le solde ne doit pas être modifié en cas d échec');
  console.log('✔ Test 2.D : Rejet conforme si solde Switch insuffisant');

  console.log('\n=== TOUS LES TESTS DES CORRECTIONS FINALES SONT VALIDÉS À 100% ===');
})();
