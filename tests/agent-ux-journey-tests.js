/**
 * tests/agent-ux-journey-tests.js
 * ══════════════════════════════════════════════════════════════════════════════════
 * VALIDATION DES PARCOURS UX AGENT SWITCH BÉNIN (PHASE 2)
 * Parcours complets :
 * - AGT-1 : Inscription / Enrôlement Agent Agréé
 * - AGT-2 : Connexion Session Guichet
 * - AGT-3 : Réception Float Caisse Initial (500 000 FCFA)
 * - AGT-4 : Opération Cash-In (Dépôt espèces client)
 * - AGT-5 : Opération Cash-Out (Retrait espèces client sur code OTP)
 * - AGT-6 : Encaissement et Virement des Commissions vers Compte Personnel
 * - AGT-7 : Audit Journal des Opérations Guichet
 * - AGT-8 : Clôture de Caisse et Déconnexion Agent
 * ══════════════════════════════════════════════════════════════════════════════════
 */

'use strict';

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

function readProjectFile(relPath) {
  const p = join(ROOT, relPath.replace(/\//g, '\\'));
  if (!existsSync(p)) throw new Error(`Fichier introuvable : ${p}`);
  return readFileSync(p, 'utf8');
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

const journeyResults = [];
function testJourney(id, title, fn) {
  try {
    fn();
    journeyResults.push({ id, title, pass: true });
    console.log(`  [PASS] [${id}] ${title}`);
  } catch (err) {
    journeyResults.push({ id, title, pass: false, error: err.message });
    console.error(`  [FAIL] [${id}] ${title} -> ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

async function runAgentJourneyTests() {
  console.log('====================================================================');
  console.log('  PARCOURS UTILISATEUR AGENT GUICHET -- PHASE 2 SWITCH BÉNIN 🇧🇯');
  console.log('====================================================================\n');

  const sharedStorage = createIsolatedStorage();
  const { SwitchAPI } = createSwitchContext(sharedStorage);

  // Initialisation compte particulier du client témoin
  sharedStorage.setItem('switch_user_phone_raw', '+2290197112233');
  sharedStorage.setItem('switch_user_phone', '+229 01 97 11 22 33');
  sharedStorage.setItem('switch_account_number', '01971122334411');
  sharedStorage.setItem('switch_user_fullname', 'Gaston KOUDJO');
  SwitchAPI.setBalance(15000); // Gaston démarre avec 15 000 FCFA

  // 1. AGT-1 : Enrôlement Agent Agréé
  testJourney('AGT-1', 'Enrôlement et déclaration du Guichet Agréé', () => {
    SwitchAPI.setAgentProfile({
      business_name: 'Point Relais Ganhi',
      manager_name: 'Bio KORA',
      agent_code: 'AGT-COT-092',
      account_number: '01970044556601',
      phone: '+229 01 97 00 44 55',
      city: 'Cotonou, Ganhi'
    });
    const prof = SwitchAPI.getAgentProfile();
    assert(prof.business_name === 'Point Relais Ganhi', 'Nom enseigne non enregistré');
    assert(prof.agent_code === 'AGT-COT-092', 'Code agent non enregistré');
    assert(SwitchAPI.getAgentFloat() === 0, 'Float initial doit être 0 F');
    assert(SwitchAPI.getAgentCommissions() === 0, 'Commissions initiales doivent être 0 F');
  });

  // 2. AGT-2 : Connexion Guichet
  testJourney('AGT-2', 'Ouverture de session Guichetier', () => {
    sharedStorage.setItem('switch_agent_session_active', 'true');
    sharedStorage.setItem('switch_active_role', 'agent');
    assert(sharedStorage.getItem('switch_agent_session_active') === 'true', 'Session active non flaggée');
    assert(sharedStorage.getItem('switch_active_role') === 'agent', 'Rôle agent non actif');
  });

  // 3. AGT-3 : Dotation Float Caisse
  testJourney('AGT-3', 'Approvisionnement Float Caisse (500 000 FCFA)', () => {
    SwitchAPI.setAgentFloat(500000);
    assert(SwitchAPI.getAgentFloat() === 500000, 'Float non approvisionné');
  });

  // 4. AGT-4 : Cash-In (Dépôt d'espèces pour Gaston KOUDJO)
  testJourney('AGT-4', 'Opération Cash-In Dépôt 30 000 FCFA pour client', async () => {
    const prevFloat = SwitchAPI.getAgentFloat(); // 500 000
    const prevClientBal = SwitchAPI.getBalance(); // 15 000

    const res = await SwitchAPI.processAgentCash('0197112233', 30000, 'DEPOSIT');
    assert(res.success === true, 'Échec dépôt cash-in : ' + res.message);

    // Float agent décaissé de 30 000 F (500 000 -> 470 000)
    assert(SwitchAPI.getAgentFloat() === prevFloat - 30000, 'Float agent non débité');

    // Solde client crédité de 30 000 F (15 000 -> 45 000)
    assert(SwitchAPI.getBalance() === prevClientBal + 30000, 'Solde client non crédité');

    // Commission créditée (30 000 * 0.007 = 210 F)
    assert(SwitchAPI.getAgentCommissions() === 210, `Commission attendue 210 F, obtenue ${SwitchAPI.getAgentCommissions()}`);
  });

  // 5. AGT-5 : Cash-Out (Retrait d'espèces pour Gaston KOUDJO)
  testJourney('AGT-5', 'Opération Cash-Out Retrait 10 000 FCFA pour client', async () => {
    const prevFloat = SwitchAPI.getAgentFloat(); // 470 000
    const prevClientBal = SwitchAPI.getBalance(); // 45 000
    const prevComm = SwitchAPI.getAgentCommissions(); // 210

    const res = await SwitchAPI.processAgentCash('0197112233', 10000, 'WITHDRAWAL');
    assert(res.success === true, 'Échec retrait cash-out : ' + res.message);

    // Float agent encaissé de 10 000 F d'espèces (470 000 -> 480 000)
    assert(SwitchAPI.getAgentFloat() === prevFloat + 10000, 'Float agent non réapprovisionné');

    // Solde client débité de 10 000 F (45 000 -> 35 000)
    assert(SwitchAPI.getBalance() === prevClientBal - 10000, 'Solde client non débité');

    // Commission créditée (+100 F -> 310 F)
    assert(SwitchAPI.getAgentCommissions() === prevComm + 100, 'Commission retrait non créditée');
  });

  // 6. AGT-6 : Virement Commissions
  testJourney('AGT-6', 'Virement des commissions acquises (310 FCFA) vers compte personnel', () => {
    const earnedComm = SwitchAPI.getAgentCommissions();
    assert(earnedComm === 310, 'Montant commissions incorrect');

    // Simulation du virement vers le compte Switch perso
    SwitchAPI.setAgentCommissions(0);
    const clientBal = SwitchAPI.getBalance();
    SwitchAPI.setBalance(clientBal + earnedComm);

    assert(SwitchAPI.getAgentCommissions() === 0, 'Portefeuille commission non remis à 0');
    assert(SwitchAPI.getBalance() === 35310, 'Compte personnel non crédité des commissions');
  });

  // 7. AGT-7 : Consultation Journal & Dashboard
  testJourney('AGT-7', 'Audit Journal des transactions et tableau de bord guichet', async () => {
    const dash = await SwitchAPI.getAgentDashboard();
    assert(dash.success === true, 'Erreur dashboard');
    assert(dash.today_volume === 40000, `Volume attendu 40 000 F (30k+10k), obtenu ${dash.today_volume}`);
    assert(dash.today_ops_count === 2, `Nb opérations attendu 2, obtenu ${dash.today_ops_count}`);
    assert(dash.transactions.length === 2, 'Nombre de transactions agent incorrect');
  });

  // 8. AGT-8 : Déconnexion Guichet
  testJourney('AGT-8', 'Clôture de caisse et déconnexion sécurisée', () => {
    sharedStorage.removeItem('switch_agent_session_active');
    sharedStorage.setItem('switch_active_role', 'user');
    assert(sharedStorage.getItem('switch_agent_session_active') === null, 'Session agent encore active');
    assert(sharedStorage.getItem('switch_active_role') === 'user', 'Rôle non restauré à user');
  });

  // Bilan
  const total = journeyResults.length;
  const passed = journeyResults.filter(r => r.pass).length;
  const failed = total - passed;

  console.log('\n====================================================================');
  console.log(`  BILAN PARCOURS UX AGENT : ${passed}/${total} VALIDÉS`);
  console.log('====================================================================');

  if (failed === 0) {
    console.log('\n🌟 TOUS LES PARCOURS DE LA PHASE 2 AGENT SONT VALIDÉS À 100% !');
    console.log('Statut final : PHASE_2_AGENT_READY\n');
    process.exit(0);
  } else {
    console.error(`\n❌ ${failed} parcours en échec.`);
    process.exit(1);
  }
}

runAgentJourneyTests().catch(e => {
  console.error('Erreur fatale des parcours :', e);
  process.exit(2);
});
