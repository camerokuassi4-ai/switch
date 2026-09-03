/**
 * tests/merchant-ux-journey-tests.js
 * ══════════════════════════════════════════════════════════════════════════════════
 * HARNAIS DE TEST DES PARCOURS UX MARCHAND — PHASE 3 BÊTA SWITCH BÉNIN 🇧🇯
 *
 * Simule les 8 parcours UX complets d'un commerçant :
 *  - MCH-1 : Enrôlement / Inscription du point de vente
 *  - MCH-2 : Tableau de bord initial (Solde caisse 0 FCFA, empty states)
 *  - MCH-3 : Ajout d'un article au catalogue et mise à jour vitrine
 *  - MCH-4 : Réception d'un paiement client par QR Code Switch Pay (15 000 F)
 *  - MCH-5 : Consultation du journal des ventes et reçu certifié
 *  - MCH-6 : Encaissement panier via la Caisse POS
 *  - MCH-7 : Virement des recettes vers le compte personnel du gérant
 *  - MCH-8 : Échange dans la messagerie client
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

const results = [];
async function runJourney(id, title, fn) {
  console.log(`\n▶ Parcours ${id} : ${title}`);
  try {
    const details = await fn();
    results.push({ id, title, pass: true, details });
    console.log(`  \x1b[32m✔ SUCCÈS\x1b[0m : ${id} validé.`);
    if (details) console.log(`    ↳ ${details}`);
  } catch (err) {
    results.push({ id, title, pass: false, error: err.message });
    console.error(`  \x1b[31m✘ ÉCHEC\x1b[0m : ${id} -> ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

async function runAllJourneys() {
  console.log("==================================================================");
  console.log(" 🛍️  SIMULATION DES 8 PARCOURS UX MARCHAND — PHASE 3 BÊTA 🇧🇯");
  console.log("==================================================================");

  const storage = createIsolatedStorage();
  const { SwitchAPI: api } = createSwitchContext(storage);

  // MCH-1 : Enrôlement / Initialisation Profil Commerçant
  await runJourney("MCH-1", "Enrôlement & Initialisation du point de vente", async () => {
    storage.clear();
    const prof = api.setMerchantProfile({
      business_name: "Épicerie Bio de Ganhi",
      manager_name: "Koffi ADANHOUN",
      phone: "+229 01 97 00 11 22",
      city: "Cotonou (Littoral)",
      ifu: "1202489102938",
      rccm: "RB/COT/24 A 99120",
      category: "Alimentation Générale"
    });

    assert(prof.business_name === "Épicerie Bio de Ganhi", "Nom enseigne enregistré");
    assert(prof.manager_name === "Koffi ADANHOUN", "Nom du promoteur enregistré");
    assert(prof.ifu === "1202489102938", "IFU conforme");
    return `Enseigne '${prof.business_name}' créée par ${prof.manager_name} à ${prof.city}.`;
  });

  // MCH-2 : Tableau de bord initial neutre
  await runJourney("MCH-2", "Tableau de bord initial (Solde caisse 0 FCFA, 0 vente)", async () => {
    const dash = await api.getMerchantDashboard();
    assert(dash.shop_balance === 0, "Solde de caisse = 0 FCFA");
    assert(dash.today_sales_count === 0, "Ventes du jour = 0");
    assert(dash.today_turnover === 0, "Chiffre d'affaires = 0 F");
    return `Dashboard initialisé avec Caisse = 0 FCFA, 0 vente, Nom boutique = '${dash.business_name}'.`;
  });

  // MCH-3 : Ajout d'articles au catalogue produits
  await runJourney("MCH-3", "Publication d'articles dans la vitrine du magasin", async () => {
    const p1 = api.addMerchantProduct({
      name: "Savon Artisanal Bio Coco",
      price: 1500,
      category: "Hygiène",
      stock_quantity: 40
    });
    const p2 = api.addMerchantProduct({
      name: "Riz Parfumé Jasmin 5kg",
      price: 4500,
      category: "Vivres",
      stock_quantity: 25
    });

    assert(p1.success && p2.success, "2 produits ajoutés");
    const prods = api.getMerchantProducts().products;
    assert(prods.length === 2, "2 produits disponibles dans le catalogue");
    return `2 produits en stock : '${prods[0].name}' (${prods[0].price} F) et '${prods[1].name}' (${prods[1].price} F).`;
  });

  // MCH-4 : Réception d'un paiement client par QR Code (15 000 FCFA)
  await runJourney("MCH-4", "Encaissement direct Client via QR Code Switch Pay (15 000 FCFA)", async () => {
    api.setBalance(60000); // Solde particulier client
    api.setMerchantBalance(0);

    const pay = await api.processMerchantPayment(
      "0195001122",
      15000,
      [{ name: "Riz Jasmin + Savons", qty: 1 }],
      "Achat Provisions Ganhi"
    );

    assert(pay.success === true, "Paiement validé");
    assert(pay.new_client_balance === 45000, "Client débité de 15 000 F");
    assert(pay.new_merchant_balance === 15000, "Caisse marchande créditée de 15 000 F");
    return `Transaction validée #${pay.ref} : Débit client 15 000 F, Crédit caisse 15 000 F (0% frais).`;
  });

  // MCH-5 : Journal des ventes et consultation du reçu
  await runJourney("MCH-5", "Consultation du journal des ventes et certification", async () => {
    const sales = api.getMerchantSales();
    assert(sales.length === 1, "1 vente enregistrée");
    const s = sales[0];
    assert(s.amount === 15000, "Montant de vente conforme");
    assert(s.channel === 'qr', "Canal QR Switch certifié");
    return `Vente #${s.ref} enregistrée au journal : ${s.amount.toLocaleString('fr-FR')} FCFA (${s.payment_method}).`;
  });

  // MCH-6 : Encaissement panier via Caisse POS Tactile
  await runJourney("MCH-6", "Encaissement d'un panier client via la Caisse POS (6 000 FCFA)", async () => {
    const posItems = [
      { id: "p1", name: "Savon Artisanal Bio Coco", unit_price: 1500, quantity: 1 },
      { id: "p2", name: "Riz Parfumé Jasmin 5kg", unit_price: 4500, quantity: 1 }
    ];

    const curBal = api.getMerchantBalance(); // 15 000 F
    const posRes = await api.processPosSale(posItems, 'switch', '0197000000', 'Vente Caisse POS #01');
    assert(posRes.success === true, "Vente POS réussie");
    assert(posRes.total_amount === 6000, "Total panier = 6 000 F");

    const newBal = api.getMerchantBalance();
    assert(newBal === curBal + 6000, "Caisse marchande créditée de 6 000 F (21 000 F au total)");
    return `Panier POS de ${posRes.total_amount} F encaissé. Solde caisse cumulé = ${newBal.toLocaleString('fr-FR')} FCFA.`;
  });

  // MCH-7 : Virement des recettes vers le compte personnel du gérant
  await runJourney("MCH-7", "Virement de 10 000 FCFA de la caisse vers le compte personnel", async () => {
    const initMerchBal = api.getMerchantBalance(); // 21 000 F
    const initUserBal = api.getBalance(); // 45 000 F

    const payout = await api.withdrawMerchantFunds(10000);
    assert(payout.success === true, "Virement validé");
    assert(payout.remaining_shop_balance === initMerchBal - 10000, "Caisse marchande débitée");
    assert(payout.new_user_balance === initUserBal + 10000, "Compte particulier crédité");
    return `Virement de 10 000 F réussi : Reste en caisse = ${payout.remaining_shop_balance.toLocaleString('fr-FR')} F, Solde perso = ${payout.new_user_balance.toLocaleString('fr-FR')} F.`;
  });

  // MCH-8 : Messagerie Marchand - Clients
  await runJourney("MCH-8", "Messagerie interactive avec les acheteurs", async () => {
    const res = api.sendMerchantMessage("conv-client-01", "Bonjour ! Votre commande de riz jasmin est emballée et disponible au comptoir.");
    assert(res.success === true, "Message commerçant envoyé");
    assert(res.conversation.last_message.includes("riz jasmin"), "Dernier message mis à jour");

    const convs = api.getMerchantConversations();
    assert(convs.length === 1, "1 conversation active");
    return `Message envoyé à l'acheteur. Conversation active avec horodatage (${res.conversation.last_time}).`;
  });

  // ─────────────────────────────────────────────────────────────
  // BILAN DES PARCOURS
  // ─────────────────────────────────────────────────────────────
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = total - passed;

  console.log("\n==================================================================");
  console.log(` 📊 BILAN DES PARCOURS UX MARCHAND : ${passed}/${total} PARCOURS VALIDÉS`);
  console.log("==================================================================");

  if (failed === 0) {
    console.log("\x1b[32m\x1b[1m🎉 100% DES PARCOURS UX MARCHAND SONT VALIDÉS AVEC SUCCÈS !\x1b[0m\n");
    process.exit(0);
  } else {
    console.error(`\x1b[31m\x1b[1m❌ ATTENTION : ${failed} parcours ont échoué.\x1b[0m\n`);
    process.exit(1);
  }
}

runAllJourneys().catch(err => {
  console.error("Erreur critique :", err);
  process.exit(1);
});
