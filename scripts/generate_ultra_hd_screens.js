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
  // 📱 Catégorie 1 : Profil Utilisateur
  {
    id: 'user_dashboard',
    category: 'user',
    title: 'Tableau de bord Utilisateur',
    url: '/tableau_de_bord_mis_jour/code.html',
    desc: 'Vue synthétique avec solde courant (110,000 FCFA), coffre Vault (45,000 FCFA), et boutons d\'accès rapides.'
  },
  {
    id: 'user_p2p',
    category: 'user',
    title: 'Transfert P2P à 0% Frais',
    url: '/transfert_switch_switch/code.html',
    desc: 'Envoi d\'argent instantané et gratuit en renseignant le numéro du destinataire et le montant.'
  },
  {
    id: 'user_sbee',
    category: 'user',
    title: 'Paiement Facture SBEE Électricité',
    url: '/paiement_sbee_electricite/code.html',
    desc: 'Achat direct de recharges d\'électricité par numéro de compteur avec reçu et code STS instantané.'
  },
  {
    id: 'user_recharge',
    category: 'user',
    title: 'Recharge Crédit GSM & Data',
    url: '/recharge_credit_data/code.html',
    desc: 'Recharge de forfaits d\'appel et internet tous opérateurs béninois en temps réel.'
  },

  // 🏪 Catégorie 2 : Profil Marchand
  {
    id: 'merchant_dashboard',
    category: 'merchant',
    title: 'Tableau de bord Marchand',
    url: '/tableau_de_bord_marchand/code.html',
    desc: 'Suivi du solde boutique (385,000 FCFA), chiffre d\'affaires du jour et raccourcis POS.'
  },
  {
    id: 'merchant_pos',
    category: 'merchant',
    title: 'Caisse Tactile POS',
    url: '/caisse_marchand_pos/code.html',
    desc: 'Encaissement rapide au comptoir, sélection d\'articles et validation sans friction.'
  },
  {
    id: 'merchant_catalog',
    category: 'merchant',
    title: 'Catalogue Produits & Services',
    url: '/catalogue_produits_services/code.html',
    desc: 'Gestion des articles du commerce avec visuels, prix unitaires et quantités disponibles.'
  },
  {
    id: 'merchant_qr',
    category: 'merchant',
    title: 'Standee QR Code de Comptoir',
    url: '/g_n_rer_qr_code_de_r_ception/code.html',
    desc: 'Standee officiel prêt à poser sur votre comptoir pour laisser les clients scanner et payer.'
  },

  // 🏦 Catégorie 3 : Profil Agent
  {
    id: 'agent_dashboard',
    category: 'agent',
    title: 'Tableau de bord Agent Guichetier',
    url: '/tableau_de_bord_agent/code.html',
    desc: 'Solde Float (1,475,000 FCFA), commissions acquises (48,500 FCFA) et raccourcis Cash-In / Cash-Out.'
  },
  {
    id: 'agent_cashin',
    category: 'agent',
    title: 'Opération Cash-In (Dépôt Client)',
    url: '/code_depot_especes_agent/code.html',
    desc: 'Saisie du numéro téléphone du client, montant à créditer et confirmation instantanée.'
  },
  {
    id: 'agent_cashout',
    category: 'agent',
    title: 'Opération Cash-Out (Retrait QR)',
    url: '/code_retrait_especes_agent/code.html',
    desc: 'Scan du QR code 5 minutes présenté par l\'utilisateur pour lui remettre ses espèces.'
  },
  {
    id: 'agent_closure',
    category: 'agent',
    title: 'Clôture de Caisse (Rapport Z)',
    url: '/cloture_de_caisse_agent/code.html',
    desc: 'Arrêt journalier certifié avec décompte des encaissements, décaissements et commissions.'
  },

  // 🏪🏦 Catégorie 4 : Profil Hybride
  {
    id: 'hybrid_dashboard',
    category: 'hybrid',
    title: 'Commutateur Mode Hybride Dual',
    url: '/tableau_de_bord_agent_mixte/code.html',
    desc: 'Interface unifiée permettant de basculer instantanément entre la caisse commerce et le guichet agent.'
  },
  {
    id: 'hybrid_caisse',
    category: 'hybrid',
    title: 'Opérations Caisse Boutique',
    url: '/operations_caisse_marchand/code.html',
    desc: 'Gestion séparée des ventes du magasin sans mélanger les flux avec la trésorerie float.'
  },
  {
    id: 'hybrid_float',
    category: 'hybrid',
    title: 'Contrôle Float Guichetier',
    url: '/agent_verification_caution/code.html',
    desc: 'Supervision de la liquidité dédiée aux dépôts et retraits avec alertes de seuil minimum.'
  },
  {
    id: 'hybrid_closure',
    category: 'hybrid',
    title: 'Rapport Z Clôture Hybride Consolidé',
    url: '/cloture_de_caisse_hybride/code.html',
    desc: 'Bilan de fin de journée séparant distinctement le chiffre d\'affaires boutique et les commissions agent.'
  }
];

async function generateUltraHdScreens() {
  const PORT = 3028;
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`🌐 Serveur local HD actif sur http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });

  // Viewport 390 x 884 avec Scale 3.0 => 1170 x 2652 px (Ultra-HD Retina 3x)
  // Ratio 390 / 884 = 0.441 (parfait pour le ratio de l'écran du mockup réaliste)
  const context = await browser.newContext({
    viewport: { width: 390, height: 884 },
    deviceScaleFactor: 3.0,
    isMobile: true,
    hasTouch: true
  });

  console.log(`\n🚀 Lancement de la génération Ultra-HD (1170 x 2652 px) pour les ${screens.length} écrans Switch Bénin...`);

  let count = 0;
  for (const item of screens) {
    count++;
    try {
      const page = await context.newPage();

      // Injection préalable de toutes les données réalistes (anti-redirection + soldes réels)
      await page.addInitScript(() => {
        // Profil Utilisateur
        localStorage.setItem('switch_profile_completed', 'true');
        localStorage.setItem('switch_user_profile', JSON.stringify({
          full_name: 'Camero Kuassis',
          phone: '0197123456',
          kyc_level: '2',
          account_number: '9500000012'
        }));
        localStorage.setItem('switch_user_balance', '110000');
        localStorage.setItem('switch_vault_balance', '45000');
        localStorage.setItem('switch_kyc_level', '2');

        // Profil Marchand
        localStorage.setItem('switch_merchant_profile', JSON.stringify({
          business_name: 'Boutique Élite Cotonou',
          merchant_id: 'MCH-98214',
          phone: '0197000018',
          pos_id: 'POS-01'
        }));
        localStorage.setItem('switch_merchant_balance', '385000');

        // Profil Agent
        localStorage.setItem('switch_agent_profile', JSON.stringify({
          agency_name: 'Kiosque Switch Akpakpa',
          agent_id: 'AGT-44021',
          phone: '0196000034'
        }));
        localStorage.setItem('switch_agent_balance', '1475000');
        localStorage.setItem('switch_agent_commissions', '48500');

        // Profil Hybride
        localStorage.setItem('switch_hybrid_mode', 'merchant');
      });

      const pageUrl = `http://127.0.0.1:${PORT}${item.url}`;
      await page.goto(pageUrl, { waitUntil: 'load', timeout: 15000 });

      // Attendre que les polices web et icônes soient 100% chargées
      await page.evaluate(async () => {
        await document.fonts.ready;
        // Optimisation rendu des textes
        document.documentElement.style.webkitFontSmoothing = 'antialiased';
        document.documentElement.style.textRendering = 'optimizeLegibility';
        // Masquer d'éventuels toasts temporaires qui masqueraient l'UI
        const toasts = document.querySelectorAll('.toast, [role="alert"], #toast-container');
        toasts.forEach(t => t.remove());
      });

      await page.waitForTimeout(800);

      // 1. Capture Lossless PNG Ultra-HD
      const pngName = `${item.id}.png`;
      const pngPath = path.join(outputDir, pngName);
      await page.screenshot({ path: pngPath, type: 'png' });
      const statPng = fs.statSync(pngPath);
      const kbPng = Math.round(statPng.size / 1024);

      // 2. Conversion en WebP optimisé qualité 0.95
      const webpName = `${item.id}.webp`;
      const webpPath = path.join(outputDir, webpName);
      const b64Data = fs.readFileSync(pngPath).toString('base64');
      const webpB64 = await page.evaluate(async (b64) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/webp', 0.95);
            resolve(dataUrl.split(',')[1]);
          };
          img.src = 'data:image/png;base64,' + b64;
        });
      }, b64Data);

      fs.writeFileSync(webpPath, Buffer.from(webpB64, 'base64'));
      const statWebp = fs.statSync(webpPath);
      const kbWebp = Math.round(statWebp.size / 1024);

      console.log(`[${count}/${screens.length}] ✅ Écran HD généré : ${item.id} -> PNG: ${kbPng} KB | WebP: ${kbWebp} KB (${item.title})`);

      await page.close();
    } catch (err) {
      console.error(` ❌ Erreur capture ${item.id}:`, err.message);
    }
  }

  await browser.close();
  server.close();
  console.log(`\n🎉 SUCCÈS : 16 écrans Ultra-HD générés avec succès en PNG et WebP dans ${outputDir}`);
}

generateUltraHdScreens().catch(err => {
  console.error('Erreur fatale:', err);
  server.close();
  process.exit(1);
});
