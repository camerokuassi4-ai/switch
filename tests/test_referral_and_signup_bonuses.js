const fs = require('fs');
const assert = require('assert');

console.log('=== TEST UNITAIRE ET D\'INTÉGRATION : SYSTÈME DE PARRAINAGE ET INSCRIPTION ===');

// Setup mock environment
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = v.toString(); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
global.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.CustomEvent = class CustomEvent { constructor(name, detail) { this.name = name; this.detail = detail; } };
global.window = {
  localStorage: global.localStorage,
  sessionStorage: global.sessionStorage,
  dispatchEvent: () => {},
  addEventListener: () => {}
};

// Charge le JS API
const apiCode = fs.readFileSync('assets/switch.api.js', 'utf8');
eval(apiCode);
const SwitchAPI = global.window.SwitchAPI;

(async () => {
  // 1. TEST CRÉATION NOUVEAU COMPTE UTILISATEUR
  console.log('\n--- 1. INSCRIPTION NOUVEAU COMPTE UTILISATEUR ---');
  localStorage.clear();
  const regResult = await SwitchAPI.register('0197112233', 'Koffi Dossou', '1234');
  assert.strictEqual(regResult.success, true, 'Inscription doit réussir');

// 2. VÉRIFICATION DU SOLDE APRÈS INSCRIPTION (DOIT ÊTRE 0 FCFA ET NON 500 FCFA)
console.log('\n--- 2. VÉRIFICATION SOLDE INITIAL INSCRIPTION ---');
const initialBal = SwitchAPI.getBalance();
assert.strictEqual(initialBal, 0, 'Le solde après inscription doit être strictement égal à 0 FCFA');
console.log('✔ Solde initial après inscription = 0 FCFA (Pas de prime fictive de 500 FCFA)');

// 3 & 4. INVITATION 1er AMI PAR LE PARRAIN (100 FCFA)
console.log('\n--- 3 & 4. PREMIÈRE INVITATION (100 FCFA POUR LE PARRAIN) ---');
const parrainPhone = '0197102030';
const resRef1 = await global.window.SwitchAPI.processReferralReward(parrainPhone, 'USER-FILLEUL-1');
assert.strictEqual(resRef1.success, true, 'Traitement parrainage 1 doit réussir');
assert.strictEqual(resRef1.reward_parrain, 100, 'La 1ère invitation doit rapporter 100 FCFA au parrain');
assert.strictEqual(resRef1.reward_filleul, 0, 'Le filleul doit recevoir 0 FCFA');

const parrainBal1 = parseInt(localStorage.getItem('switch_user_balance_' + parrainPhone) || '0', 10);
assert.strictEqual(parrainBal1, 100, 'Le solde du parrain doit être de 100 FCFA après la 1ère invitation');
console.log('✔ 1ère invitation : Parrain crédité de +100 FCFA (Solde parrain: 100 FCFA), Filleul crédité de 0 FCFA');

// 5 & 6. INVITATION 2ème AMI PAR LE PARRAIN (50 FCFA)
console.log('\n--- 5 & 6. DEUXIÈME INVITATION (50 FCFA POUR LE PARRAIN) ---');
const resRef2 = await global.window.SwitchAPI.processReferralReward(parrainPhone, 'USER-FILLEUL-2');
assert.strictEqual(resRef2.success, true, 'Traitement parrainage 2 doit réussir');
assert.strictEqual(resRef2.reward_parrain, 50, 'La 2ème invitation doit rapporter 50 FCFA au parrain');
assert.strictEqual(resRef2.reward_filleul, 0, 'Le 2ème filleul doit recevoir 0 FCFA');

const parrainBal2 = parseInt(localStorage.getItem('switch_user_balance_' + parrainPhone) || '0', 10);
assert.strictEqual(parrainBal2, 150, 'Le solde du parrain doit être de 150 FCFA (100 F + 50 F)');
console.log('✔ 2ème invitation : Parrain crédité de +50 FCFA (Cumul parrain: 150 FCFA), Filleul crédité de 0 FCFA');

// 7. VÉRIFICATION PARRAINAGE PAR LE FILLEUL LUI-MÊME
console.log('\n--- 7. LE FILLEUL DEVIENT PARRAIN À SON TOUR ---');
const filleulPhone = '0197112233';
localStorage.setItem('switch_user_phone', filleulPhone);
localStorage.setItem('switch_user_phone_raw', filleulPhone);
assert.strictEqual(SwitchAPI.getBalance(), 0, 'Solde filleul initial = 0 FCFA');

const resFilleulRef = await global.window.SwitchAPI.processReferralReward(filleulPhone, 'USER-SOUS-FILLEUL-1');
assert.strictEqual(resFilleulRef.success, true, 'Le filleul doit pouvoir parrainer à son tour');
assert.strictEqual(resFilleulRef.reward_parrain, 100, 'Sa 1ère invitation lui rapporte 100 FCFA');
assert.strictEqual(SwitchAPI.getBalance(), 100, 'Le solde du nouveau parrain est maintenant de 100 FCFA');
console.log('✔ Le filleul parraine à son tour : Reçoit +100 FCFA pour sa 1ère invitation');

  console.log('\n=== TOUS LES TESTS DE PARRAINAGE ET DE SOLDE INITIAL ONT RÉUSSI (PARRAINAGE_ET_INSCRIPTION_MIS_A_JOUR_FAIT) ===');
})();
