const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../assets/images/real_screens');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const screens = [
  // 📱 Utilisateur
  { id: 'user_dashboard', category: 'user', title: 'Tableau de bord Utilisateur', url: 'http://localhost:3000/tableau_de_bord_mis_jour/code.html' },
  { id: 'user_p2p', category: 'user', title: 'Transfert d\'argent P2P 0%', url: 'http://localhost:3000/transfert_switch_switch/code.html' },
  { id: 'user_sbee', category: 'user', title: 'Paiement Facture SBEE Électricité', url: 'http://localhost:3000/paiement_sbee_electricite/code.html' },
  { id: 'user_recharge', category: 'user', title: 'Recharge Crédit GSM & Data', url: 'http://localhost:3000/recharge_credit_data/code.html' },
  { id: 'user_qr', category: 'user', title: 'Paiement Marchand par QR Code', url: 'http://localhost:3000/scanner_qr_code/code.html' },
  { id: 'user_history', category: 'user', title: 'Historique des Transactions', url: 'http://localhost:3000/historique_des_transactions/code.html' },
  { id: 'user_referral', category: 'user', title: 'Parrainage & Récompenses', url: 'http://localhost:3000/parrainage_recompenses/code.html' },

  // 🏪 Marchand
  { id: 'merchant_dashboard', category: 'merchant', title: 'Tableau de bord Marchand', url: 'http://localhost:3000/tableau_de_bord_marchand/code.html' },
  { id: 'merchant_catalog', category: 'merchant', title: 'Catalogue Produits & Services', url: 'http://localhost:3000/catalogue_produits_services/code.html' },
  { id: 'merchant_pos', category: 'merchant', title: 'Caisse Tactile POS 0% Frais', url: 'http://localhost:3000/caisse_marchand_pos/code.html' },
  { id: 'merchant_qr', category: 'merchant', title: 'Standee QR Code de Comptoir', url: 'http://localhost:3000/g_n_rer_qr_code_de_r_ception/code.html' },
  { id: 'merchant_sales', category: 'merchant', title: 'Historique des Ventes', url: 'http://localhost:3000/historique_des_ventes/code.html' },
  { id: 'merchant_withdraw', category: 'merchant', title: 'Retrait des Recettes vers Compte Perso', url: 'http://localhost:3000/retrait_marchand/code.html' },

  // 🏦 Agent
  { id: 'agent_dashboard', category: 'agent', title: 'Tableau de bord Agent Guichetier', url: 'http://localhost:3000/tableau_de_bord_agent/code.html' },
  { id: 'agent_cashin', category: 'agent', title: 'Opération Cash-In (Dépôt Client)', url: 'http://localhost:3000/code_depot_especes_agent/code.html' },
  { id: 'agent_cashout', category: 'agent', title: 'Opération Cash-Out (Retrait Client QR)', url: 'http://localhost:3000/code_retrait_especes_agent/code.html' },
  { id: 'agent_history', category: 'agent', title: 'Historique des Opérations Guichet', url: 'http://localhost:3000/historique_des_op_rations_agent/code.html' },
  { id: 'agent_closure', category: 'agent', title: 'Clôture de Caisse (Rapport Z)', url: 'http://localhost:3000/cloture_de_caisse_agent/code.html' },
  { id: 'agent_float', category: 'agent', title: 'Réapprovisionnement du Float Agent', url: 'http://localhost:3000/demande_de_r_approvisionnement_float/code.html' },

  // 🏪🏦 Hybride
  { id: 'hybrid_dashboard', category: 'hybrid', title: 'Commutateur Mode Hybride', url: 'http://localhost:3000/tableau_de_bord_agent_mixte/code.html' },
  { id: 'hybrid_caisse', category: 'hybrid', title: 'Opérations Caisse Boutique', url: 'http://localhost:3000/operations_caisse_marchand/code.html' },
  { id: 'hybrid_float', category: 'hybrid', title: 'Suivi & Caution Float Agent', url: 'http://localhost:3000/agent_verification_caution/code.html' },
  { id: 'hybrid_closure', category: 'hybrid', title: 'Rapport Z Clôture Hybride', url: 'http://localhost:3000/cloture_de_caisse_hybride/code.html' }
];

async function captureAll() {
  console.log('🚀 Lancement du navigateur Playwright (Edge) pour capturer les 23 vrais écrans...');
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 412, height: 870 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  for (const item of screens) {
    try {
      const page = await context.newPage();
      await page.goto(item.url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);

      const filename = `${item.id}.jpg`;
      const savePath = path.join(outputDir, filename);

      await page.screenshot({ path: savePath, type: 'jpeg', quality: 90 });
      console.log(` ✅ Capture réussie: [${item.category.toUpperCase()}] ${item.title} -> ${filename}`);
      await page.close();
    } catch (err) {
      console.error(` ❌ Erreur capture ${item.id}:`, err.message);
    }
  }

  await browser.close();
  console.log('🎉 TOUTES LES CAPTURES D\'ÉCRAN RÉELLES ONT ÉTÉ GÉNÉRÉES DANS assets/images/real_screens/ !');
}

captureAll();
