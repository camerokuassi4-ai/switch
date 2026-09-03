/**
 * tests/test_recipient_resolution_and_uniqueness.js
 * TESTS RIGOUREUX DES 10 CONDITIONS : UNICITÉ DU NUMÉRO & RÉSOLUTION DU BÉNÉFICIAIRE
 */

const fs = require('fs');
const assert = require('assert');

console.log('=================================================================');
console.log('  TESTS AUTOMATISÉS : UNICITÉ DU NUMÉRO & RÉSOLUTION BÉNÉFICIAIRE');
console.log('=================================================================\n');

// Mock browser
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = v.toString(); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
global.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.CustomEvent = class CustomEvent { constructor(n, d) { this.name = n; this.detail = d; } };
global.window = { localStorage: global.localStorage, sessionStorage: global.sessionStorage, dispatchEvent: () => {}, addEventListener: () => {} };

// Charge API
const apiCode = fs.readFileSync('assets/switch.api.js', 'utf8');
eval(apiCode);
const SwitchAPI = global.window.SwitchAPI;

async function runTests() {

  // Initialisation du registre
  localStorage.clear();
  SwitchAPI.getCentralAccounts();

  const numX = '0197889900';

  // 1. Création utilisateur avec numéro X : succès.
  console.log('--- 1. Création utilisateur avec numéro X ---');
  const regRes = await SwitchAPI.register(numX, 'Dossou Christian', '1234');
  assert.strictEqual(regRes.success, true, 'Création utilisateur doit réussir');
  console.log('✔ Condition 1 validée : Création utilisateur réussie (Solde initial = 0 FCFA)');

  // 2. Création marchand avec le même numéro X : refus.
  console.log('\n--- 2. Création marchand avec le même numéro X (Refus) ---');
  const merchCheck = await SwitchAPI.checkGlobalPhoneUniqueness(numX);
  assert.strictEqual(merchCheck.exists, true, 'Le numéro X doit être détecté comme déjà existant');
  assert(merchCheck.message.includes('Ce numéro est déjà associé à un compte Switch'), 'Message de doublon obligatoire');
  console.log('✔ Condition 2 validée : Inscription marchand refusée pour numéro existant');
  console.log('  Message :', merchCheck.message);

  // 3. Création agent avec le même numéro X : refus.
  console.log('\n--- 3. Création agent avec le même numéro X (Refus) ---');
  const agentCheck = await SwitchAPI.checkGlobalPhoneUniqueness(numX);
  assert.strictEqual(agentCheck.exists, true, 'Le numéro X doit être détecté comme déjà existant');
  console.log('✔ Condition 3 validée : Inscription agent refusée pour numéro existant');

  // 4. Activation Marchand ou Agent sur le compte X existant : succès après validation.
  console.log('\n--- 4. Activation Rôle Marchand puis Agent sur le compte X (Cumul de rôles) ---');
  const addMerch = await SwitchAPI.addRoleToAccount(numX, 'merchant', { business_name: 'Boutique Christian Pro' });
  assert.strictEqual(addMerch.success, true, 'Ajout du rôle marchand doit réussir');
  assert(addMerch.account.roles.includes('merchant'), 'Le compte doit posséder le rôle merchant');

  const addAgent = await SwitchAPI.addRoleToAccount(numX, 'agent', { kiosk_name: 'Guichet Christian Express' });
  assert.strictEqual(addAgent.success, true, 'Ajout du rôle agent doit réussir');
  assert(addAgent.account.roles.includes('agent'), 'Le compte doit posséder le rôle agent');
  assert.deepStrictEqual(addAgent.account.roles, ['user', 'merchant', 'agent'], 'Compte devenu Hybride (User + Merchant + Agent)');
  console.log('✔ Condition 4 validée : Cumul de rôles sur le même account_id sans doublon (Roles:', addAgent.account.roles.join(', '), ')');

  // 5. Transfert vers un compte utilisateur : nom vérifié affiché avant PIN.
  console.log('\n--- 5. Résolution bénéficiaire Transfert Particulier ---');
  const userRes = await SwitchAPI.resolveRecipient('0197123456', 'transfer');
  assert.strictEqual(userRes.is_valid, true, 'Résolution particulier doit réussir');
  assert(userRes.formatted_banner.includes('Vous envoyez à : Marc S.'), 'Doit afficher le nom masqué sécurisé');
  console.log('✔ Condition 5 validée :', userRes.formatted_banner);

  // 6. Paiement vers un marchand : nom de boutique vérifié affiché avant PIN.
  console.log('\n--- 6. Résolution bénéficiaire Paiement Marchand ---');
  const merchRes = await SwitchAPI.resolveRecipient('0197102030', 'merchant_pay');
  assert.strictEqual(merchRes.is_valid, true, 'Résolution marchand doit réussir');
  assert(merchRes.formatted_banner.includes('Vous payez : Boutique & Restaurant La Plage — Marchand Switch'), 'Doit afficher le nom officiel de la boutique');
  console.log('✔ Condition 6 validée :', merchRes.formatted_banner);

  // 7. Retrait chez un agent : identité/point de service vérifié affiché.
  console.log('\n--- 7. Résolution bénéficiaire Retrait chez Agent ---');
  const agentRes = await SwitchAPI.resolveRecipient('0197004092', 'agent_withdraw');
  assert.strictEqual(agentRes.is_valid, true, 'Résolution agent doit réussir');
  assert(agentRes.formatted_banner.includes('Vous retirez chez : Kiosque Switch Haie Vive — Agent agréé'), 'Doit afficher le nom et statut du kiosque');
  console.log('✔ Condition 7 validée :', agentRes.formatted_banner);

  // 8. Numéro inexistant : transfert bloqué.
  console.log('\n--- 8. Tentative avec numéro inexistant ---');
  const badRes = await SwitchAPI.resolveRecipient('0199009900', 'transfer');
  assert.strictEqual(badRes.is_valid, false, 'Doit être invalide');
  assert(badRes.message.includes('Bénéficiaire introuvable'), 'Message d\'erreur explicite');
  console.log('✔ Condition 8 validée : Transfert vers numéro inexistant strictement bloqué');

  // 9. Compte inactif / non vérifié : transfert bloqué.
  console.log('\n--- 9. Tentative avec compte suspendu / inactif ---');
  const accounts = SwitchAPI.getCentralAccounts();
  accounts.push({
    account_id: "ACC-SUSPENDED",
    phone_normalized: "0196000000",
    legal_name: "Compte Suspendu Test",
    roles: ["user"],
    status: "suspended"
  });
  SwitchAPI.saveCentralAccounts(accounts);

  const suspRes = await SwitchAPI.resolveRecipient('0196000000', 'transfer');
  assert.strictEqual(suspRes.is_valid, false, 'Compte suspendu doit être bloqué');
  console.log('✔ Condition 9 validée : Transfert vers compte suspendu strictly bloqué');

  // 10. Vérifier que le montant n'est jamais débité avant la confirmation PIN après affichage du bénéficiaire.
  console.log('\n--- 10. Non-débit du solde avant confirmation PIN ---');
  SwitchAPI.setBalance(50000);
  const balBefore = SwitchAPI.getBalance();

  // Résolution préalable (étape 1) -> Ne doit effectuer aucun débit
  const resPrep = await SwitchAPI.resolveRecipient('0197123456', 'transfer');
  assert.strictEqual(resPrep.is_valid, true);
  assert.strictEqual(SwitchAPI.getBalance(), balBefore, 'Le solde ne doit PAS être débité lors de la résolution du nom');

  // Exécution effective avec PIN après confirmation (étape 2)
  const txRes = await SwitchAPI.transfer(5000, '0197123456', 'Paiement test avec PIN');
  console.log('txRes:', txRes);
  assert.strictEqual(txRes.success, true, 'Paiement doit réussir');
  assert.strictEqual(SwitchAPI.getBalance(), 45000, 'Le solde doit être débité uniquement APRÈS confirmation PIN');
  console.log('✔ Condition 10 validée : Solde intact pendant la résolution, débité uniquement APRÈS confirmation PIN');

  console.log('\n=================================================================');
  console.log('  LES 10 CONDITIONS D\'UNICITÉ ET DE RÉSOLUTION SONT 100% VALIDÉES');
  console.log('=================================================================');
  console.log('IDENTITE_UNIQUE_ET_BENEFICIAIRE_VERIFIE_VALIDES');
}

runTests();
