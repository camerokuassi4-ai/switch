/**
 * tests/beta-phase2-agent-automated-tests.js
 * ══════════════════════════════════════════════════════════════════════════════════
 * HARNAIS DE TEST AUTOMATISÉ — PHASE 2 BÊTA AGENT SWITCH BÉNIN 🇧🇯
 * Tests unitaires, d'intégration et de non-régression du module Agent :
 * - Absence totale de données factices (Amina K., 1 500 000 F, Mariam S., Adele Doe)
 * - Rôle Agent et API SwitchAPI.getAgentDashboard / processAgentCash
 * - Règle de double écriture atomique (Float Agent <-> Solde Client <-> Commissions)
 * - Empty states propres et soldes neutres par défaut (0 FCFA)
 * - Synchronisation binaire SHA-256 Racine <-> www/
 * ══════════════════════════════════════════════════════════════════════════════════
 */

'use strict';

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Helpers ──
function readProjectFile(relPath) {
  const p = join(ROOT, relPath.replace(/\//g, '\\'));
  if (!existsSync(p)) throw new Error(`Fichier introuvable : ${p}`);
  return readFileSync(p, 'utf8');
}

function sha256(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function createIsolatedStorage() {
  const store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    dump: () => ({ ...store })
  };
}

function createSwitchContext(storage) {
  const configCode = readProjectFile('assets/switch.config.js');
  const apiCode = readProjectFile('assets/switch.api.js');

  const context = {
    window: {
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    sessionStorage: createIsolatedStorage(),
    localStorage: storage,
    console: { log: () => {}, info: () => {}, warn: () => {}, error: () => {} },
    CustomEvent: class { constructor(name, opts) { this.name = name; this.detail = opts ? opts.detail : null; } },
    Date, Math, parseInt, parseFloat, JSON, Array, String, Number, Boolean, encodeURIComponent,
    fetch: async () => ({ ok: true, json: async () => ({}) })
  };
  context.window.localStorage = storage;
  context.window.sessionStorage = context.sessionStorage;

  const fn = new Function('ctx', `
    with (ctx) {
      ${configCode}
      ${apiCode}
      return { SwitchAPI: window.SwitchAPI };
    }
  `);
  return fn(context);
}

// ── Collecteur de Résultats ──
const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, pass: true });
    console.log(`  [PASS]  ${name}`);
  } catch (err) {
    results.push({ name, pass: false, error: err.message });
    console.error(`  [FAIL]  ${name} -> ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

async function runPhase2Tests() {
  console.log('====================================================================');
  console.log('  SUITE DE TESTS AUTOMATISÉS -- PHASE 2 BÊTA AGENT SWITCH BÉNIN 🇧🇯');
  console.log('====================================================================\n');

  // ────────────────────────────────────────────────────────────────
  // SUITE 1 : ABSENCE DE DONNÉES FACTICES AGENT
  // ────────────────────────────────────────────────────────────────
  console.log('====================================================================');
  console.log('  SUITE 1 -- ABSENCE DE DONNÉES FACTICES AGENT');
  console.log('====================================================================');

  const agentDashboardHtml = readProjectFile('tableau_de_bord_agent/code.html');
  const agentLoginHtml = readProjectFile('connexion_agent/code.html');
  const agentDepositHtml = readProjectFile('d_p_t_de_fonds_mis_jour_agent/code.html');
  const agentWithdrawHtml = readProjectFile('retrait_de_fonds_mis_jour_agent/code.html');
  const agentValidateHtml = readProjectFile('valider_une_op_ration_client/code.html');
  const agentHistoryHtml = readProjectFile('historique_des_op_rations_agent/code.html');
  const agentSettingsHtml = readProjectFile('param_tres_et_profil_agent/code.html');

  test('T1-DASHBOARD-NO-AMINA: Pas de "Amina K." dans tableau_de_bord_agent', () => {
    assert(!agentDashboardHtml.includes('Amina K.'), 'Présence de "Amina K." dans le dashboard agent');
  });

  test('T1-DASHBOARD-NO-ADELE: Pas de "Adele Doe" dans tableau_de_bord_agent (L.515)', () => {
    assert(!agentDashboardHtml.includes('Adele Doe'), 'Présence de "Adele Doe" dans le modal virement commission');
  });

  test('T1-DASHBOARD-NO-FAKE-FLOAT: Solde Float initial neutre (0 FCFA, pas de 1 500 000 F en dur)', () => {
    assert(!/id="float-balance-amount"[^>]*>\s*1\s*500\s*000/i.test(agentDashboardHtml), 'Float factice 1 500 000 F présent dans le dashboard');
    assert(/id="float-balance-amount"[^>]*>\s*0\s*</i.test(agentDashboardHtml), 'Float initial doit être 0 dans le balisage');
  });

  test('T1-DASHBOARD-NO-FAKE-COMMISSIONS: Commissions initiales neutres (0 FCFA, pas de 48 750 F)', () => {
    assert(!agentDashboardHtml.includes('48 750'), 'Commissions factices 48 750 F présentes dans le dashboard');
  });

  test('T1-LOGIN-NO-DEFAULTS: Connexion Agent sans numéros pré-remplis en dur (9700409215 / AGT-4092)', () => {
    assert(!agentLoginHtml.includes('value="9700409215"'), 'Compte par défaut en dur dans connexion_agent');
    assert(!agentLoginHtml.includes('value="AGT-4092"'), 'Code distributeur par défaut en dur dans connexion_agent');
    assert(!agentLoginHtml.includes('Adele Doe'), 'Adele Doe injectée lors de la connexion agent');
  });

  test('T1-DEPOSIT-NO-FAKE-FLOAT: Dépôt Cash-In sans float en dur (1 500 000 F / 1 475 000 F)', () => {
    assert(!agentDepositHtml.includes('1 500 000 F'), 'Float en dur 1 500 000 F présent dans le badge de dépôt');
    assert(!agentDepositHtml.includes('1 475 000 FCFA'), 'Float restant en dur présent dans le formulaire de dépôt');
  });

  test('T1-VALIDATE-NO-MARIAM: Servir Client sans faux bénéficiaire (Mariam SANNI / 25 000 FCFA)', () => {
    assert(!agentValidateHtml.includes('Mariam SANNI'), 'Mariam SANNI présente en dur dans validation client');
    assert(!agentValidateHtml.includes('14200'), 'Commissions 14200 en dur dans validation client');
  });

  test('T1-HISTORY-NO-HARDCODED-OPS: Historique Agent sans fausses transactions statiques (Koffi / Mariam)', () => {
    assert(!agentHistoryHtml.includes('Koffi MENSAH'), 'Koffi MENSAH présent en dur dans historique agent');
    assert(!agentHistoryHtml.includes('Mariam SANNI'), 'Mariam SANNI présente en dur dans historique agent');
    assert(!agentHistoryHtml.includes('505 000 FCFA'), 'Volume 505 000 F en dur dans historique agent');
  });

  test('T1-SETTINGS-NO-AMINA-IMG: Paramètres Agent sans img_054.jpg ni Amina K.', () => {
    assert(!agentSettingsHtml.includes('img_054.jpg'), 'img_054.jpg présent dans avatar agent');
    assert(!agentSettingsHtml.includes('Amina K.'), 'Amina K. présente dans paramètres agent');
    assert(!agentSettingsHtml.includes('Adele Doe'), 'Adele Doe présente dans paramètres agent');
  });

  // ────────────────────────────────────────────────────────────────
  // SUITE 2 : MÉTHODES ET API DU MODULE AGENT (SwitchAPI)
  // ────────────────────────────────────────────────────────────────
  console.log('\n====================================================================');
  console.log('  SUITE 2 -- MÉTHODES ET API DU MODULE AGENT (SwitchAPI)');
  console.log('====================================================================');

  const testStorage = createIsolatedStorage();
  const { SwitchAPI } = createSwitchContext(testStorage);

  test('T2-API-METHODS-EXIST: Méthodes Agent déclarées dans SwitchAPI', () => {
    assert(typeof SwitchAPI.getAgentProfile === 'function', 'getAgentProfile manquant');
    assert(typeof SwitchAPI.setAgentProfile === 'function', 'setAgentProfile manquant');
    assert(typeof SwitchAPI.getAgentFloat === 'function', 'getAgentFloat manquant');
    assert(typeof SwitchAPI.setAgentFloat === 'function', 'setAgentFloat manquant');
    assert(typeof SwitchAPI.getAgentCommissions === 'function', 'getAgentCommissions manquant');
    assert(typeof SwitchAPI.setAgentCommissions === 'function', 'setAgentCommissions manquant');
    assert(typeof SwitchAPI.getAgentDashboard === 'function', 'getAgentDashboard manquant');
    assert(typeof SwitchAPI.getAgentTransactions === 'function', 'getAgentTransactions manquant');
    assert(typeof SwitchAPI.addAgentTransaction === 'function', 'addAgentTransaction manquant');
    assert(typeof SwitchAPI.clearAgentTransactions === 'function', 'clearAgentTransactions manquant');
    assert(typeof SwitchAPI.processAgentCash === 'function', 'processAgentCash manquant');
  });

  test('T2-API-DEFAULT-BALANCES: Soldes agent par défaut à 0 FCFA', () => {
    testStorage.clear();
    assert(SwitchAPI.getAgentFloat() === 0, 'Float par défaut doit être 0');
    assert(SwitchAPI.getAgentCommissions() === 0, 'Commissions par défaut doivent être 0');
    assert(SwitchAPI.getAgentTransactions().length === 0, 'Transactions par défaut doivent être vides');
  });

  test('T2-API-SET-PROFILE: Configuration et persistance du profil agent', () => {
    SwitchAPI.setAgentProfile({
      business_name: 'Kiosque Saint-Michel',
      manager_name: 'Bio KORA',
      agent_code: 'AGT-9012',
      account_number: '01970090124821',
      phone: '+229 01 97 00 90 12'
    });
    const prof = SwitchAPI.getAgentProfile();
    assert(prof.business_name === 'Kiosque Saint-Michel', 'business_name incorrect');
    assert(prof.manager_name === 'Bio KORA', 'manager_name incorrect');
    assert(prof.agent_code === 'AGT-9012', 'agent_code incorrect');
  });

  // ────────────────────────────────────────────────────────────────
  // SUITE 3 : PROCESSUS DE DOUBLE ÉCRITURE ET LEDGER (Agent <-> Client)
  // ────────────────────────────────────────────────────────────────
  console.log('\n====================================================================');
  console.log('  SUITE 3 -- DOUBLE ÉCRITURE ET LEDGER (Agent <-> Client)');
  console.log('====================================================================');

  // Configuration du scénario
  // Agent démarre avec 200 000 FCFA de float
  SwitchAPI.setAgentFloat(200000);
  SwitchAPI.setAgentCommissions(0);
  SwitchAPI.clearAgentTransactions();

  // Client connecté avec 5 000 FCFA de solde
  testStorage.setItem('switch_user_phone_raw', '+2290197556677');
  testStorage.setItem('switch_user_phone', '+229 01 97 55 66 77');
  SwitchAPI.setBalance(5000);
  SwitchAPI.clearTransactions();

  test('T3-DEPOSIT-SUCCESS: Dépôt d\'espèces Cash-In (Double impact atomique)', async () => {
    const depositAmount = 50000;
    const clientPhone = '0197556677';

    const res = await SwitchAPI.processAgentCash(clientPhone, depositAmount, 'DEPOSIT');
    assert(res.success === true, 'Le dépôt a échoué : ' + res.message);

    // 1. Float Agent doit être diminué de 50 000 F (200 000 -> 150 000)
    assert(SwitchAPI.getAgentFloat() === 150000, `Float Agent incorrect : ${SwitchAPI.getAgentFloat()} attendu 150000`);

    // 2. Solde Client doit être augmenté de 50 000 F (5 000 -> 55 000)
    assert(SwitchAPI.getBalance() === 55000, `Solde Client incorrect : ${SwitchAPI.getBalance()} attendu 55000`);

    // 3. Commissions Agent doivent être créditées (+350 F)
    assert(SwitchAPI.getAgentCommissions() > 0, 'Commissions Agent non créditées');

    // 4. Transaction consignée côté Agent et côté Client
    const agentTxs = SwitchAPI.getAgentTransactions();
    const clientTxs = SwitchAPI.getTransactions();
    assert(agentTxs.length === 1 && agentTxs[0].type === 'depot', 'Transaction agent non enregistrée');
    assert(clientTxs.length === 1 && clientTxs[0].type === 'deposit', 'Transaction client non enregistrée');
  });

  test('T3-DEPOSIT-REJECT-LOW-FLOAT: Rejet immédiat si Float insuffisant', async () => {
    // Float actuel est 150 000 F, on tente un dépôt de 300 000 F
    const res = await SwitchAPI.processAgentCash('0197556677', 300000, 'DEPOSIT');
    assert(res.success === false, 'Le dépôt aurait dû être rejeté pour Float insuffisant');
    assert(res.message.includes('Float') || res.message.includes('insuffisant'), 'Message de rejet explicite requis');
    assert(SwitchAPI.getAgentFloat() === 150000, 'Float modifié malgré rejet');
  });

  test('T3-WITHDRAWAL-SUCCESS: Retrait d\'espèces Cash-Out (Double impact atomique)', async () => {
    const withdrawAmount = 20000;
    const clientPhone = '0197556677';
    const initialFloat = SwitchAPI.getAgentFloat(); // 150 000
    const initialClientBal = SwitchAPI.getBalance(); // 55 000

    const res = await SwitchAPI.processAgentCash(clientPhone, withdrawAmount, 'WITHDRAWAL');
    assert(res.success === true, 'Le retrait a échoué : ' + res.message);

    // 1. Float Agent doit augmenter (réapprovisionné par les espèces reçues du client) : 150 000 -> 170 000
    assert(SwitchAPI.getAgentFloat() === initialFloat + withdrawAmount, 'Float Agent non réapprovisionné');

    // 2. Solde Client doit être débité : 55 000 -> 35 000
    assert(SwitchAPI.getBalance() === initialClientBal - withdrawAmount, 'Solde Client non débité');

    // 3. Commissions Agent augmentent
    assert(SwitchAPI.getAgentCommissions() >= 100, 'Commissions retrait non créditées');
  });

  test('T3-DASHBOARD-DATA: SwitchAPI.getAgentDashboard() retourne des agrégats cohérents', async () => {
    const dash = await SwitchAPI.getAgentDashboard();
    assert(dash.success === true, 'getAgentDashboard failed');
    assert(dash.float_balance === SwitchAPI.getAgentFloat(), 'Float mismatch');
    assert(dash.commissions_balance === SwitchAPI.getAgentCommissions(), 'Commissions mismatch');
    assert(dash.today_volume === 70000, `Volume attendu 70000 (50k+20k), obtenu ${dash.today_volume}`);
    assert(dash.today_ops_count === 2, `Nb opérations attendu 2, obtenu ${dash.today_ops_count}`);
  });

  // ────────────────────────────────────────────────────────────────
  // SUITE 4 : EMPTY STATES ET RENDU ÉPURÉ
  // ────────────────────────────────────────────────────────────────
  console.log('\n====================================================================');
  console.log('  SUITE 4 -- EMPTY STATES ET RENDU INITIAL');
  console.log('====================================================================');

  test('T4-EMPTY-STATE-DASHBOARD: Conteneur empty state dans tableau_de_bord_agent', () => {
    assert(agentDashboardHtml.includes('id="empty-state-agent-ops"'), 'Empty state opérations manquante dans dashboard');
    assert(agentDashboardHtml.includes('Aucune opération aujourd\'hui'), 'Texte empty state manquant dans dashboard');
  });

  test('T4-EMPTY-STATE-HISTORY: Conteneur empty state dans historique_des_op_rations_agent', () => {
    assert(agentHistoryHtml.includes('id="empty-state-agent-history"'), 'Empty state manquant dans historique agent');
    assert(agentHistoryHtml.includes('Aucune opération enregistrée'), 'Texte empty state manquant dans historique');
  });

  // ────────────────────────────────────────────────────────────────
  // SUITE 5 : SYNCHRONISATION RACINE <-> WWW/
  // ────────────────────────────────────────────────────────────────
  console.log('\n====================================================================');
  console.log('  SUITE 5 -- SYNCHRONISATION RACINE <-> WWW/ (SHA-256)');
  console.log('====================================================================');

  const filesToCheck = [
    'assets/switch.api.js',
    'connexion_agent/code.html',
    'tableau_de_bord_agent/code.html',
    'd_p_t_de_fonds_mis_jour_agent/code.html',
    'valider_une_op_ration_client/code.html',
    'retrait_de_fonds_mis_jour_agent/code.html',
    'historique_des_op_rations_agent/code.html',
    'param_tres_et_profil_agent/code.html'
  ];

  filesToCheck.forEach(file => {
    test(`T5-SYNC-${file.replace(/[\/\.]/g, '-')}: Parité binaire ${file}`, () => {
      const rootContent = readProjectFile(file);
      const wwwContent = readProjectFile(`www/${file}`);
      const h1 = sha256(rootContent);
      const h2 = sha256(wwwContent);
      assert(h1 === h2, `Divergence SHA-256 sur ${file} (Racine: ${h1.slice(0,8)} vs www: ${h2.slice(0,8)})`);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // BILAN GÉNÉRAL
  // ────────────────────────────────────────────────────────────────
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = total - passed;

  console.log('\n====================================================================');
  console.log(`  RAPPORT FINAL -- HARNAIS PHASE 2 AGENT : ${passed}/${total} RÉUSSIS`);
  console.log('====================================================================');

  if (failed === 0) {
    console.log('\n🎉 TOUS LES TESTS DE LA PHASE 2 AGENT SONT AU VERT !');
    console.log('Statut final : PHASE_2_AGENT_READY\n');
    process.exit(0);
  } else {
    console.error(`\n❌ ${failed} test(s) en échec.`);
    process.exit(1);
  }
}

runPhase2Tests().catch(e => {
  console.error('Erreur fatale d\'exécution des tests :', e);
  process.exit(2);
});
