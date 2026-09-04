const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'assets/images/real_screens');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(rootDir, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found: ' + reqPath);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

const screens = [
  // 📱 Utilisateur (4 clés + secondaires)
  { id: 'user_dashboard', category: 'user', title: 'Tableau de bord Utilisateur', url: '/tableau_de_bord_mis_jour/code.html' },
  { id: 'user_p2p', category: 'user', title: 'Transfert d\'argent P2P 0%', url: '/transfert_switch_switch/code.html' },
  { id: 'user_sbee', category: 'user', title: 'Paiement Facture SBEE Électricité', url: '/paiement_sbee_electricite/code.html' },
  { id: 'user_recharge', category: 'user', title: 'Recharge Crédit GSM & Data', url: '/recharge_credit_data/code.html' },
  { id: 'user_qr', category: 'user', title: 'Paiement Marchand par QR Code', url: '/scanner_qr_code/code.html' },
  { id: 'user_history', category: 'user', title: 'Historique des Transactions', url: '/historique_des_transactions/code.html' },
  { id: 'user_referral', category: 'user', title: 'Parrainage & Récompenses', url: '/parrainage_recompenses/code.html' },

  // 🏪 Marchand (4 clés + secondaires)
  { id: 'merchant_dashboard', category: 'merchant', title: 'Tableau de bord Marchand', url: '/tableau_de_bord_marchand/code.html' },
  { id: 'merchant_pos', category: 'merchant', title: 'Caisse Tactile POS 0% Frais', url: '/caisse_marchand_pos/code.html' },
  { id: 'merchant_catalog', category: 'merchant', title: 'Catalogue Produits & Services', url: '/catalogue_produits_services/code.html' },
  { id: 'merchant_qr', category: 'merchant', title: 'Standee QR Code de Comptoir', url: '/g_n_rer_qr_code_de_r_ception/code.html' },
  { id: 'merchant_sales', category: 'merchant', title: 'Historique des Ventes', url: '/historique_des_ventes/code.html' },
  { id: 'merchant_withdraw', category: 'merchant', title: 'Retrait des Recettes vers Compte Perso', url: '/retrait_marchand/code.html' },

  // 🏦 Agent (4 clés + secondaires)
  { id: 'agent_dashboard', category: 'agent', title: 'Tableau de bord Agent Guichetier', url: '/tableau_de_bord_agent/code.html' },
  { id: 'agent_cashin', category: 'agent', title: 'Opération Cash-In (Dépôt Client)', url: '/code_depot_especes_agent/code.html' },
  { id: 'agent_cashout', category: 'agent', title: 'Opération Cash-Out (Retrait Client QR)', url: '/code_retrait_especes_agent/code.html' },
  { id: 'agent_closure', category: 'agent', title: 'Clôture de Caisse (Rapport Z)', url: '/cloture_de_caisse_agent/code.html' },
  { id: 'agent_history', category: 'agent', title: 'Historique des Opérations Guichet', url: '/historique_des_op_rations_agent/code.html' },
  { id: 'agent_float', category: 'agent', title: 'Réapprovisionnement du Float Agent', url: '/demande_de_r_approvisionnement_float/code.html' },

  // 🏪🏦 Hybride (4 clés)
  { id: 'hybrid_dashboard', category: 'hybrid', title: 'Commutateur Mode Hybride Dual', url: '/tableau_de_bord_agent_mixte/code.html' },
  { id: 'hybrid_caisse', category: 'hybrid', title: 'Opérations Caisse Boutique', url: '/operations_caisse_marchand/code.html' },
  { id: 'hybrid_float', category: 'hybrid', title: 'Contrôle Float Guichetier', url: '/agent_verification_caution/code.html' },
  { id: 'hybrid_closure', category: 'hybrid', title: 'Rapport Z Clôture Hybride Consolidé', url: '/cloture_de_caisse_hybride/code.html' }
];

async function generateAll() {
  const PORT = 3012;
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`🌐 Serveur local actif sur http://127.0.0.1:${PORT}`);

  console.log('🚀 Lancement de Microsoft Edge en haute fidélité (1080p FHD+ mobile)...');
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });

  // Viewport 412x890 avec scale factor 2.625 => Résolution 1082 x 2336 (FHD+ net, sans flou)
  const context = await browser.newContext({
    viewport: { width: 412, height: 890 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true
  });

  console.log(`📸 Début des captures HD pour ${screens.length} écrans Switch...`);

  let count = 0;
  for (const item of screens) {
    count++;
    try {
      const page = await context.newPage();
      const pageUrl = `http://127.0.0.1:${PORT}${item.url}`;
      await page.goto(pageUrl, { waitUntil: 'load', timeout: 15000 });
      // Attendre que les polices et styles soient appliqués
      await page.waitForTimeout(650);

      const pngName = `${item.id}.png`;
      const pngPath = path.join(outputDir, pngName);

      // Capture lossless PNG haute fidélité
      await page.screenshot({ path: pngPath, type: 'png' });
      const statPng = fs.statSync(pngPath);
      const kb = Math.round(statPng.size / 1024);

      console.log(`[${count}/${screens.length}] ✅ Capture HD réussie: ${item.id} -> ${pngName} (${kb} KB) - ${item.title}`);
      await page.close();
    } catch (err) {
      console.error(` ❌ Erreur capture ${item.id}:`, err.message);
    }
  }

  await browser.close();
  server.close();
  console.log(`\n🎉 TERMINÉ : Toutes les captures d'écran en Haute Résolution PNG (1082x2336) ont été générées dans ${outputDir}`);
}

generateAll().catch(err => {
  console.error('Erreur fatale:', err);
  server.close();
  process.exit(1);
});
