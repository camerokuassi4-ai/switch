/**
 * tests/beta-phase3-merchant-automated-tests.js
 * ══════════════════════════════════════════════════════════════════════════════════
 * HARNAIS DE TEST AUTOMATISÉ — PHASE 3 BÊTA MARCHAND SWITCH BÉNIN 🇧🇯
 * Tests unitaires, d'intégration et de non-régression du module Marchand :
 * 1. Absence totale de données factices (Boutique La Plage, 2 450 000, 385 000, 18 articles)
 * 2. Présence et conformité des Empty States propres
 * 3. Cohérence du solde de caisse neutre (0 FCFA par défaut)
 * 4. Méthodes du module Marchand dans SwitchAPI (CRUD Produits, Profil, Ventes, Messagerie)
 * 5. Moteur de double écriture atomique (Paiement Client -> Caisse Marchand)
 * 6. Moteur de virement des encaissements (Caisse Marchand -> Compte Personnel)
 * 7. Synchronisation binaire SHA-256 Racine <-> www/
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
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, pass: true });
    console.log(`  \x1b[32m[PASS]\x1b[0m  ${name}`);
  } catch (err) {
    results.push({ name, pass: false, error: err.message });
    console.error(`  \x1b[31m[FAIL]\x1b[0m  ${name} -> ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

async function runAllTests() {
  console.log("==================================================================");
  console.log(" 🧪 SUITE DE TESTS AUTOMATISÉS — PHASE 3 : ESPACE MARCHAND 🇧🇯");
  console.log("==================================================================\n");

  const merchantFiles = [
    'tableau_de_bord_marchand/code.html',
    'catalogue_produits_services/code.html',
    'messagerie_marchand_clients/code.html',
    'historique_des_ventes/code.html',
    'profil_de_l_entreprise/code.html',
    'inscription_marchand/code.html',
    'retrait_marchand/code.html',
    'caisse_marchand_pos/code.html'
  ];

  // ─────────────────────────────────────────────────────────────
  // 1. ABSENCE DE DONNÉES FACTICES
  // ─────────────────────────────────────────────────────────────
  console.log("--- Groupe 1 : Éradication des données factices ---");

  const forbiddenStrings = [
    { query: '2 450 000', label: 'Solde fictif 2 450 000 FCFA' },
    { query: 'Boutique & Restaurant La Plage', label: 'Nom enseigne fictif Boutique & Restaurant La Plage' },
    { query: 'Kossivi Jean DOSSOU', label: 'Nom gérant fictif Kossivi Jean DOSSOU' },
    { query: '385 000 FCFA', label: 'Chiffre d affaires fictif 385 000 FCFA' },
    { query: '18 Articles avec Photos', label: 'Compteur statique 18 Articles' },
    { query: '1202019283719', label: 'IFU factice 1202019283719' },
    { query: 'contact@boutiquelaplage.bj', label: 'Email factice contact@boutiquelaplage.bj' }
  ];

  for (const fb of forbiddenStrings) {
    await test(`Absence de ${fb.label} dans tous les écrans Marchand`, () => {
      merchantFiles.forEach(f => {
        const content = readProjectFile(f);
        assert(!content.includes(fb.query), `Trouvé dans ${f} !`);
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 2. CONFORMITÉ DES EMPTY STATES
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Groupe 2 : Présence des Empty States propres ---");

  const emptyStates = [
    { file: 'tableau_de_bord_marchand/code.html', id: 'empty-state-merchant-sales', desc: 'Empty state encaissements dashboard' },
    { file: 'catalogue_produits_services/code.html', id: 'empty-state-products', desc: 'Empty state catalogue 0 produit' },
    { file: 'messagerie_marchand_clients/code.html', id: 'empty-state-merchant-messages', desc: 'Empty state messagerie sans discussion' },
    { file: 'historique_des_ventes/code.html', id: 'empty-state-sales', desc: 'Empty state journal des ventes' }
  ];

  for (const es of emptyStates) {
    await test(`Présence de ${es.desc} (#${es.id})`, () => {
      const content = readProjectFile(es.file);
      assert(content.includes(`id="${es.id}"`), `Élément #${es.id} introuvable dans ${es.file}`);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 3. API SWITCHAPI MARCHAND & DOUBLE ÉCRITURE
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Groupe 3 : Méthodes SwitchAPI Marchand & Double Ledger ---");

  const storage = createIsolatedStorage();
  const { SwitchAPI: api } = createSwitchContext(storage);

  await test("SwitchAPI expose toutes les méthodes du module Marchand", () => {
    assert(typeof api.getMerchantProfile === 'function', 'getMerchantProfile');
    assert(typeof api.setMerchantProfile === 'function', 'setMerchantProfile');
    assert(typeof api.getMerchantBalance === 'function', 'getMerchantBalance');
    assert(typeof api.setMerchantBalance === 'function', 'setMerchantBalance');
    assert(typeof api.getMerchantProducts === 'function', 'getMerchantProducts');
    assert(typeof api.addMerchantProduct === 'function', 'addMerchantProduct');
    assert(typeof api.deleteMerchantProduct === 'function', 'deleteMerchantProduct');
    assert(typeof api.getMerchantSales === 'function', 'getMerchantSales');
    assert(typeof api.addMerchantSale === 'function', 'addMerchantSale');
    assert(typeof api.getMerchantConversations === 'function', 'getMerchantConversations');
    assert(typeof api.sendMerchantMessage === 'function', 'sendMerchantMessage');
    assert(typeof api.processMerchantPayment === 'function', 'processMerchantPayment');
    assert(typeof api.withdrawMerchantFunds === 'function', 'withdrawMerchantFunds');
  });

  await test("Solde Marchand neutre par défaut (0 FCFA)", () => {
    storage.clear();
    const bal = api.getMerchantBalance();
    assert(bal === 0, `Solde reçu: ${bal}`);
  });

  await test("Catalogue produits vide par défaut (0 produit)", () => {
    storage.clear();
    const res = api.getMerchantProducts();
    assert(Array.isArray(res.products) && res.products.length === 0, `Produits trouvés: ${res.products.length}`);
  });

  await test("Journal des ventes vide par défaut (0 vente)", () => {
    storage.clear();
    const sales = api.getMerchantSales();
    assert(Array.isArray(sales) && sales.length === 0, `Ventes trouvées: ${sales.length}`);
  });

  await test("CRUD Catalogue Produits Marchand", () => {
    const addRes = api.addMerchantProduct({
      name: 'Savon Bio Artisanal Coco',
      price: 1500,
      category: 'hygiene'
    });
    assert(addRes.success === true, 'Ajout réussi');
    assert(addRes.total === 1, 'Total = 1');

    const prods = api.getMerchantProducts().products;
    assert(prods.length === 1 && prods[0].name === 'Savon Bio Artisanal Coco', 'Persistance du produit');

    const delRes = api.deleteMerchantProduct(addRes.product.id);
    assert(delRes.success === true && delRes.total === 0, 'Suppression du produit');
  });

  await test("Double écriture atomique : Achat Client (50 000 F) -> Marchand (15 000 F)", async () => {
    api.setBalance(50000);
    api.setMerchantBalance(0);
    api.setMerchantProfile({ business_name: "Superette Saint-Jean" });

    const payRes = await api.processMerchantPayment("0197001122", 15000, [{ name: "Panier Epicerie", qty: 1 }], "Achat Produits");
    assert(payRes.success === true, 'Paiement réussi');
    assert(payRes.new_client_balance === 35000, `Nouveau solde client: ${payRes.new_client_balance}`);
    assert(payRes.new_merchant_balance === 15000, `Nouvelle caisse marchand: ${payRes.new_merchant_balance}`);

    const clientTx = api.getTransactions();
    assert(clientTx[0] && clientTx[0].amount === -15000, 'Débit dans transactions client');

    const merchSales = api.getMerchantSales();
    assert(merchSales[0] && merchSales[0].amount === 15000, 'Vente dans journal marchand');
  });

  await test("Refus de paiement si solde client insuffisant", async () => {
    api.setBalance(5000);
    const payRes = await api.processMerchantPayment("0197001122", 10000);
    assert(payRes.success === false, 'Doit être rejeté');
  });

  await test("Virement des encaissements (Caisse Marchand -> Compte Particulier)", async () => {
    api.setMerchantBalance(15000);
    api.setBalance(35000);

    const payout = await api.withdrawMerchantFunds(10000);
    assert(payout.success === true, 'Virement validé');
    assert(payout.remaining_shop_balance === 5000, `Caisse restante: ${payout.remaining_shop_balance}`);
    assert(payout.new_user_balance === 45000, `Nouveau solde particulier: ${payout.new_user_balance}`);
  });

  await test("Refus de virement si solde de caisse insuffisant", async () => {
    api.setMerchantBalance(2000);
    const payout = await api.withdrawMerchantFunds(5000);
    assert(payout.success === false, 'Doit être rejeté');
  });

  await test("Messagerie Marchand - Clients (Envoi et persistance)", () => {
    const sendRes = api.sendMerchantMessage("conv-test-01", "Bonjour, votre commande est prête.");
    assert(sendRes.success === true, 'Message envoyé');
    const convs = api.getMerchantConversations();
    assert(convs.length === 1 && convs[0].last_message === "Bonjour, votre commande est prête.", 'Conversation persistée');
  });

  // ─────────────────────────────────────────────────────────────
  // 4. PARITÉ BINAIRE 100% SHA-256 AVEC WWW/
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Groupe 4 : Parité binaire SHA-256 (Racine <-> www/) ---");

  const allSyncFiles = [
    ...merchantFiles,
    'assets/switch.api.js'
  ];

  for (const f of allSyncFiles) {
    await test(`Parité SHA-256 exacte pour ${f}`, () => {
      const rootContent = readProjectFile(f);
      const wwwContent = readProjectFile(join('www', f));
      const hRoot = sha256(rootContent);
      const hWww = sha256(wwwContent);
      assert(hRoot === hWww, `Mismatch! Root: ${hRoot} vs Www: ${hWww}`);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // BILAN DES TESTS
  // ─────────────────────────────────────────────────────────────
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = total - passed;

  console.log("\n==================================================================");
  console.log(` 📊 RÉSULTAT DU HARNAIS PHASE 3 : ${passed}/${total} TESTS PASSÉS`);
  console.log("==================================================================");

  if (failed === 0) {
    console.log("\x1b[32m\x1b[1m🎉 100% DES TESTS AUTOMATISÉS DE LA PHASE 3 SONT PASSÉS AVEC SUCCÈS !\x1b[0m\n");
    process.exit(0);
  } else {
    console.error(`\x1b[31m\x1b[1m❌ ATTENTION : ${failed} test(s) ont échoué.\x1b[0m\n`);
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error("Erreur critique :", err);
  process.exit(1);
});
