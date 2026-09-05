const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
const downloadPath = path.join(rootDir, 'download.html');

// 1. Update index.html
let indexContent = fs.readFileSync(indexPath, 'utf-8');

// Update og:image
indexContent = indexContent.replace(
  'assets/images/real_screens/user_dashboard.jpg',
  'assets/images/real_screens/user_dashboard.png'
);

// Update CSS rules for phone-mockup and phone-screen to ensure high-DPI text sharpness
const oldCssPhone = `    .phone-mockup {
      position: relative;
      width: 100%;
      aspect-ratio: 9 / 18.5;`;

const newCssPhone = `    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .phone-mockup {
      position: relative;
      width: 100%;
      aspect-ratio: 9 / 19.4;`;

if (indexContent.includes(oldCssPhone)) {
  indexContent = indexContent.replace(oldCssPhone, newCssPhone);
}

// Add image-rendering sharpness to phone-screen img
const oldPhoneScreen = `    .phone-screen {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 22px;
      overflow: hidden;
      background: #000;
      box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.85);
    }`;

const newPhoneScreen = `    .phone-screen {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 22px;
      overflow: hidden;
      background: #000;
      box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.85);
    }
    .phone-screen img {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }`;

if (indexContent.includes(oldPhoneScreen)) {
  indexContent = indexContent.replace(oldPhoneScreen, newPhoneScreen);
}

// Update User Section Mockups Container & Items
const userMockupBlock = `          <!-- Grille 2x2 propre de smartphones -->
          <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            
            <!-- Smartphone 1 -->
            <div class="flex flex-col items-center group cursor-pointer" onclick="openLightbox('assets/images/real_screens/user_dashboard.jpg', 'Tableau de bord Utilisateur', 'Vue synthétique avec solde courant (110,000 FCFA), coffre Vault (45,000 FCFA), et boutons d\\'accès rapides.')">
              <div class="phone-mockup user-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/user_dashboard.jpg" alt="Tableau de bord Utilisateur" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2 text-center w-full px-1">
                <h4 class="font-black text-white text-xs truncate">1. Accueil & Solde</h4>
                <p class="text-[10px] text-gray-300 truncate">Solde & Vault 45k</p>
              </div>
            </div>

            <!-- Smartphone 2 -->
            <div class="flex flex-col items-center group cursor-pointer" onclick="openLightbox('assets/images/real_screens/user_p2p.jpg', 'Transfert P2P à 0% Frais', 'Envoi d\\'argent instantané et gratuit en renseignant le numéro du destinataire et le montant.')">
              <div class="phone-mockup user-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/user_p2p.jpg" alt="Transfert P2P" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2 text-center w-full px-1">
                <h4 class="font-black text-white text-xs truncate">2. Transfert P2P</h4>
                <p class="text-[10px] text-gray-300 truncate">0 FCFA de frais</p>
              </div>
            </div>

            <!-- Smartphone 3 -->
            <div class="flex flex-col items-center group cursor-pointer" onclick="openLightbox('assets/images/real_screens/user_sbee.jpg', 'Paiement Facture SBEE Électricité', 'Achat direct de recharges d\\'électricité par numéro de compteur avec reçu et code STS instantané.')">
              <div class="phone-mockup user-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/user_sbee.jpg" alt="Paiement SBEE" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2 text-center w-full px-1">
                <h4 class="font-black text-white text-xs truncate">3. Facture SBEE</h4>
                <p class="text-[10px] text-gray-300 truncate">Code STS instantané</p>
              </div>
            </div>

            <!-- Smartphone 4 -->
            <div class="flex flex-col items-center group cursor-pointer" onclick="openLightbox('assets/images/real_screens/user_recharge.jpg', 'Recharge Crédit GSM & Data', 'Recharge de forfaits d\\'appel et internet tous opérateurs béninois en temps réel.')">
              <div class="phone-mockup user-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/user_recharge.jpg" alt="Recharge GSM" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2 text-center w-full px-1">
                <h4 class="font-black text-white text-xs truncate">4. Recharge GSM</h4>
                <p class="text-[10px] text-gray-300 truncate">MTN, Moov & Celtiis</p>
              </div>
            </div>

          </div>`;

const newUserMockupBlock = `          <!-- Showcase HD 1080p : 2x2 grand format sur PC, swipe tactile ergonomique 300px sur mobile -->
          <div class="flex sm:grid sm:grid-cols-2 gap-5 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
            
            <!-- Smartphone 1 -->
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/user_dashboard.png', 'Tableau de bord Utilisateur', 'Vue synthétique avec solde courant (110,000 FCFA), coffre Vault (45,000 FCFA), et boutons d\\'accès rapides.')">
              <div class="phone-mockup user-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/user_dashboard.png" alt="Tableau de bord Utilisateur" class="w-full h-full object-cover object-top" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2.5 text-center w-full px-1">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate">1. Accueil & Solde</h4>
                <p class="text-[11px] text-gray-300 truncate">Solde 110k • Vault 45k</p>
              </div>
            </div>

            <!-- Smartphone 2 -->
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/user_p2p.png', 'Transfert P2P à 0% Frais', 'Envoi d\\'argent instantané et gratuit en renseignant le numéro du destinataire et le montant.')">
              <div class="phone-mockup user-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/user_p2p.png" alt="Transfert P2P" class="w-full h-full object-cover object-top" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2.5 text-center w-full px-1">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate">2. Transfert P2P</h4>
                <p class="text-[11px] text-gray-300 truncate">0 FCFA de frais instantané</p>
              </div>
            </div>

            <!-- Smartphone 3 -->
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/user_sbee.png', 'Paiement Facture SBEE Électricité', 'Achat direct de recharges d\\'électricité par numéro de compteur avec reçu et code STS instantané.')">
              <div class="phone-mockup user-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/user_sbee.png" alt="Paiement SBEE" class="w-full h-full object-cover object-top" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2.5 text-center w-full px-1">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate">3. Facture SBEE</h4>
                <p class="text-[11px] text-gray-300 truncate">Code STS d\\'électricité direct</p>
              </div>
            </div>

            <!-- Smartphone 4 -->
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/user_recharge.png', 'Recharge Crédit GSM & Data', 'Recharge de forfaits d\\'appel et internet tous opérateurs béninois en temps réel.')">
              <div class="phone-mockup user-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/user_recharge.png" alt="Recharge GSM" class="w-full h-full object-cover object-top" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2.5 text-center w-full px-1">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate">4. Recharge GSM</h4>
                <p class="text-[11px] text-gray-300 truncate">MTN, Moov & Celtiis Data</p>
              </div>
            </div>

          </div>
          <div class="flex sm:hidden items-center justify-center gap-1.5 mt-2 text-[11px] text-gray-400">
            <span class="material-symbols-outlined text-sm">swipe</span>
            <span>Glissez horizontalement pour voir les 4 écrans</span>
          </div>`;

if (indexContent.includes(userMockupBlock)) {
  indexContent = indexContent.replace(userMockupBlock, newUserMockupBlock);
  console.log('✅ Section Utilisateur mise à jour en grand format HD!');
} else {
  console.log('⚠️ Bloc Section Utilisateur non trouvé exactement, vérification...');
}

// Update Merchant Section Mockups Container & Items
const merchantMockupBlock = `          <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            
            <!-- Smartphone 1 -->
            <div class="flex flex-col items-center group cursor-pointer" onclick="openLightbox('assets/images/real_screens/merchant_dashboard.jpg', 'Tableau de bord Marchand', 'Suivi du solde boutique (385,000 FCFA), chiffre d\\'affaires du jour et raccourcis POS.')">
              <div class="phone-mockup merchant-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/merchant_dashboard.jpg" alt="Tableau de bord Marchand" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2 text-center w-full px-1">
                <h4 class="font-black text-white text-xs truncate">1. Tableau de bord</h4>
                <p class="text-[10px] text-gray-300 truncate">Recettes 385 000 F</p>
              </div>
            </div>

            <!-- Smartphone 2 -->
            <div class="flex flex-col items-center group cursor-pointer" onclick="openLightbox('assets/images/real_screens/merchant_pos.jpg', 'Caisse Tactile POS', 'Encaissement rapide au comptoir, sélection d\\'articles et validation sans friction.')">
              <div class="phone-mockup merchant-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/merchant_pos.jpg" alt="Caisse Tactile POS" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2 text-center w-full px-1">
                <h4 class="font-black text-white text-xs truncate">2. Caisse POS</h4>
                <p class="text-[10px] text-gray-300 truncate">Terminal tactile 0%</p>
              </div>
            </div>

            <!-- Smartphone 3 -->
            <div class="flex flex-col items-center group cursor-pointer" onclick="openLightbox('assets/images/real_screens/merchant_catalog.jpg', 'Catalogue Produits & Services', 'Gestion des articles du commerce avec visuels, prix unitaires et quantités disponibles.')">
              <div class="phone-mockup merchant-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/merchant_catalog.jpg" alt="Catalogue Produits" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2 text-center w-full px-1">
                <h4 class="font-black text-white text-xs truncate">3. Catalogue</h4>
                <p class="text-[10px] text-gray-300 truncate">Articles & Tarifs</p>
              </div>
            </div>

            <!-- Smartphone 4 -->
            <div class="flex flex-col items-center group cursor-pointer" onclick="openLightbox('assets/images/real_screens/merchant_qr.jpg', 'Standee QR Code de Comptoir', 'Standee officiel prêt à poser sur votre comptoir pour laisser les clients scanner et payer.')">
              <div class="phone-mockup merchant-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/merchant_qr.jpg" alt="QR Code Marchand" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2 text-center w-full px-1">
                <h4 class="font-black text-white text-xs truncate">4. QR Comptoir</h4>
                <p class="text-[10px] text-gray-300 truncate">Standee dynamique</p>
              </div>
            </div>

          </div>`;

const newMerchantMockupBlock = `          <!-- Showcase HD 1080p : 2x2 grand format sur PC, swipe tactile ergonomique 300px sur mobile -->
          <div class="flex sm:grid sm:grid-cols-2 gap-5 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
            
            <!-- Smartphone 1 -->
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/merchant_dashboard.png', 'Tableau de bord Marchand', 'Suivi du solde boutique (385,000 FCFA), chiffre d\\'affaires du jour et raccourcis POS.')">
              <div class="phone-mockup merchant-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/merchant_dashboard.png" alt="Tableau de bord Marchand" class="w-full h-full object-cover object-top" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2.5 text-center w-full px-1">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate">1. Tableau de bord</h4>
                <p class="text-[11px] text-gray-300 truncate">Recettes boutique 385 000 F</p>
              </div>
            </div>

            <!-- Smartphone 2 -->
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/merchant_pos.png', 'Caisse Tactile POS', 'Encaissement rapide au comptoir, sélection d\\'articles et validation sans friction.')">
              <div class="phone-mockup merchant-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/merchant_pos.png" alt="Caisse Tactile POS" class="w-full h-full object-cover object-top" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2.5 text-center w-full px-1">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate">2. Caisse POS</h4>
                <p class="text-[11px] text-gray-300 truncate">Terminal tactile 0% frais</p>
              </div>
            </div>

            <!-- Smartphone 3 -->
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/merchant_catalog.png', 'Catalogue Produits & Services', 'Gestion des articles du commerce avec visuels, prix unitaires et quantités disponibles.')">
              <div class="phone-mockup merchant-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/merchant_catalog.png" alt="Catalogue Produits" class="w-full h-full object-cover object-top" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2.5 text-center w-full px-1">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate">3. Catalogue Articles</h4>
                <p class="text-[11px] text-gray-300 truncate">Gestion du stock & tarifs</p>
              </div>
            </div>

            <!-- Smartphone 4 -->
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/merchant_qr.png', 'Standee QR Code de Comptoir', 'Standee officiel prêt à poser sur votre comptoir pour laisser les clients scanner et payer.')">
              <div class="phone-mockup merchant-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/merchant_qr.png" alt="QR Code Marchand" class="w-full h-full object-cover object-top" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2.5 text-center w-full px-1">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate">4. Standee QR Code</h4>
                <p class="text-[11px] text-gray-300 truncate">Paiement sans contact comptoir</p>
              </div>
            </div>

          </div>
          <div class="flex sm:hidden items-center justify-center gap-1.5 mt-2 text-[11px] text-gray-400">
            <span class="material-symbols-outlined text-sm">swipe</span>
            <span>Glissez horizontalement pour voir les 4 écrans</span>
          </div>`;

if (indexContent.includes(merchantMockupBlock)) {
  indexContent = indexContent.replace(merchantMockupBlock, newMerchantMockupBlock);
  console.log('✅ Section Marchand mise à jour en grand format HD!');
} else {
  console.log('⚠️ Bloc Section Marchand non trouvé exactement, vérification...');
}

// Update Agent Section Mockups Container & Items
const agentMockupBlock = `          <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            
            <!-- Smartphone 1 -->
            <div class="flex flex-col items-center group cursor-pointer" onclick="openLightbox('assets/images/real_screens/agent_dashboard.jpg', 'Tableau de bord Agent Guichetier', 'Solde Float (1,475,000 FCFA), commissions acquises (48,500 FCFA) et raccourcis Cash-In / Cash-Out.')">
              <div class="phone-mockup agent-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/agent_dashboard.jpg" alt="Tableau de bord Agent" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2 text-center w-full px-1">
                <h4 class="font-black text-white text-xs truncate">1. Tableau de bord</h4>
                <p class="text-[10px] text-gray-300 truncate">Float 1 475 000 F</p>
              </div>
            </div>

            <!-- Smartphone 2 -->
            <div class="flex flex-col items-center group cursor-pointer" onclick="openLightbox('assets/images/real_screens/agent_cashin.jpg', 'Opération Cash-In (Dépôt Client)', 'Saisie du numéro téléphone du client, montant à créditer et confirmation instantanée.')">
              <div class="phone-mockup agent-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/agent_cashin.jpg" alt="Cash-In Dépôt" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2 text-center w-full px-1">
                <h4 class="font-black text-white text-xs truncate">2. Cash-In Dépôt</h4>
                <p class="text-[10px] text-gray-300 truncate">Crédit client direct</p>
              </div>
            </div>

            <!-- Smartphone 3 -->
            <div class="flex flex-col items-center group cursor-pointer" onclick="openLightbox('assets/images/real_screens/agent_cashout.jpg', 'Opération Cash-Out (Retrait QR)', 'Scan du QR code 5 minutes présenté par l\\'utilisateur pour lui remettre ses espèces.')">
              <div class="phone-mockup agent-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/agent_cashout.jpg" alt="Cash-Out Retrait" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2 text-center w-full px-1">
                <h4 class="font-black text-white text-xs truncate">3. Retrait QR</h4>
                <p class="text-[10px] text-gray-300 truncate">Validation sécurisée</p>
              </div>
            </div>

            <!-- Smartphone 4 -->
            <div class="flex flex-col items-center group cursor-pointer" onclick="openLightbox('assets/images/real_screens/agent_dashboard.png', 'Tableau de Bord Agent', 'Gestion globale des opérations de dépôt, retrait et suivi du float.')">
              <div class="phone-mockup agent-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/agent_dashboard.png" alt="Tableau de Bord Agent" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2 text-center w-full px-1">
                <h4 class="font-black text-white text-xs truncate">4. Rapport Z</h4>
                <p class="text-[10px] text-gray-300 truncate">Clôture certifiée</p>
              </div>
            </div>

          </div>`;

const newAgentMockupBlock = `          <!-- Showcase HD 1080p : 2x2 grand format sur PC, swipe tactile ergonomique 300px sur mobile -->
          <div class="flex sm:grid sm:grid-cols-2 gap-5 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
            
            <!-- Smartphone 1 -->
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/agent_dashboard.png', 'Tableau de bord Agent Guichetier', 'Solde Float (1,475,000 FCFA), commissions acquises (48,500 FCFA) et raccourcis Cash-In / Cash-Out.')">
              <div class="phone-mockup agent-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/agent_dashboard.png" alt="Tableau de bord Agent" class="w-full h-full object-cover object-top" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2.5 text-center w-full px-1">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate">1. Tableau de bord</h4>
                <p class="text-[11px] text-gray-300 truncate">Float 1 475 000 F • Commissions</p>
              </div>
            </div>

            <!-- Smartphone 2 -->
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/agent_cashin.png', 'Opération Cash-In (Dépôt Client)', 'Saisie du numéro téléphone du client, montant à créditer et confirmation instantanée.')">
              <div class="phone-mockup agent-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/agent_cashin.png" alt="Cash-In Dépôt" class="w-full h-full object-cover object-top" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2.5 text-center w-full px-1">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate">2. Cash-In Dépôt</h4>
                <p class="text-[11px] text-gray-300 truncate">Dépôt espèces instantané</p>
              </div>
            </div>

            <!-- Smartphone 3 -->
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/agent_cashout.png', 'Opération Cash-Out (Retrait QR)', 'Scan du QR code 5 minutes présenté par l\\'utilisateur pour lui remettre ses espèces.')">
              <div class="phone-mockup agent-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/agent_cashout.png" alt="Cash-Out Retrait" class="w-full h-full object-cover object-top" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2.5 text-center w-full px-1">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate">3. Retrait QR</h4>
                <p class="text-[11px] text-gray-300 truncate">Remise cash sécurisée 5 min</p>
              </div>
            </div>

            <!-- Smartphone 4 -->
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/agent_dashboard.png', 'Tableau de Bord Agent', 'Gestion globale des opérations de dépôt, retrait et suivi du float.')">
              <div class="phone-mockup agent-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/agent_dashboard.png" alt="Tableau de Bord Agent" class="w-full h-full object-cover object-top" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2.5 text-center w-full px-1">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate">4. Rapport Z</h4>
                <p class="text-[11px] text-gray-300 truncate">Clôture de caisse certifiée</p>
              </div>
            </div>

          </div>
          <div class="flex sm:hidden items-center justify-center gap-1.5 mt-2 text-[11px] text-gray-400">
            <span class="material-symbols-outlined text-sm">swipe</span>
            <span>Glissez horizontalement pour voir les 4 écrans</span>
          </div>`;

if (indexContent.includes(agentMockupBlock)) {
  indexContent = indexContent.replace(agentMockupBlock, newAgentMockupBlock);
  console.log('✅ Section Agent mise à jour en grand format HD!');
} else {
  console.log('⚠️ Bloc Section Agent non trouvé exactement, vérification...');
}

// Update Hybrid Section Mockups Container & Items
const hybridMockupBlock = `          <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            
            <!-- Smartphone 1 -->
            <div class="flex flex-col items-center group cursor-pointer" onclick="openLightbox('assets/images/real_screens/hybrid_dashboard.jpg', 'Commutateur Mode Hybride Dual', 'Bascule instantanée entre le Mode Boutique et le Mode Agent Guichetier avec double jauge de solde.')">
              <div class="phone-mockup hybrid-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/hybrid_dashboard.jpg" alt="Commutateur Hybride" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2 text-center w-full px-1">
                <h4 class="font-black text-white text-xs truncate">1. Commutateur Dual</h4>
                <p class="text-[10px] text-gray-300 truncate">Bascule 1 tap</p>
              </div>
            </div>

            <!-- Smartphone 2 -->
            <div class="flex flex-col items-center group cursor-pointer" onclick="openLightbox('assets/images/real_screens/hybrid_caisse.jpg', 'Caisse Boutique Hybride', 'Gestion de l\\'activité magasin avec suivi des encaissements caisse (385,000 FCFA).')">
              <div class="phone-mockup hybrid-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/hybrid_caisse.jpg" alt="Caisse Boutique" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2 text-center w-full px-1">
                <h4 class="font-black text-white text-xs truncate">2. Caisse Boutique</h4>
                <p class="text-[10px] text-gray-300 truncate">Recettes magasin</p>
              </div>
            </div>

            <!-- Smartphone 3 -->
            <div class="flex flex-col items-center group cursor-pointer" onclick="openLightbox('assets/images/real_screens/hybrid_float.jpg', 'Float Agent Hybride', 'Contrôle distinct de la trésorerie float (1,475,000 FCFA) dédiée aux opérations guichetier.')">
              <div class="phone-mockup hybrid-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/hybrid_float.jpg" alt="Float Agent Hybride" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2 text-center w-full px-1">
                <h4 class="font-black text-white text-xs truncate">3. Float Guichet</h4>
                <p class="text-[10px] text-gray-300 truncate">Trésorerie agent</p>
              </div>
            </div>

            <!-- Smartphone 4 -->
            <div class="flex flex-col items-center group cursor-pointer" onclick="openLightbox('assets/images/real_screens/hybrid_closure.jpg', 'Rapport Z Clôture Hybride', 'Rapprochement comptable consolidant les ventes du commerce et les commissions du guichet.')">
              <div class="phone-mockup hybrid-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/hybrid_closure.jpg" alt="Rapport Z Hybride" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-2xl drop-shadow-md">zoom_in</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2 text-center w-full px-1">
                <h4 class="font-black text-white text-xs truncate">4. Rapport Z Mixte</h4>
                <p class="text-[10px] text-gray-300 truncate">Bilan consolidé</p>
              </div>
            </div>

          </div>`;

const newHybridMockupBlock = `          <!-- Showcase HD 1080p : 2x2 grand format sur PC, swipe tactile ergonomique 300px sur mobile -->
          <div class="flex sm:grid sm:grid-cols-2 gap-5 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
            
            <!-- Smartphone 1 -->
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/hybrid_dashboard.png', 'Commutateur Mode Hybride Dual', 'Bascule instantanée entre le Mode Boutique et le Mode Agent Guichetier avec double jauge de solde.')">
              <div class="phone-mockup hybrid-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/hybrid_dashboard.png" alt="Commutateur Hybride" class="w-full h-full object-cover object-top" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2.5 text-center w-full px-1">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate">1. Commutateur Dual</h4>
                <p class="text-[11px] text-gray-300 truncate">Bascule mono-clic boutique/agent</p>
              </div>
            </div>

            <!-- Smartphone 2 -->
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/hybrid_caisse.png', 'Caisse Boutique Hybride', 'Gestion de l\\'activité magasin avec suivi des encaissements caisse (385,000 FCFA).')">
              <div class="phone-mockup hybrid-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/hybrid_caisse.png" alt="Caisse Boutique" class="w-full h-full object-cover object-top" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2.5 text-center w-full px-1">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate">2. Caisse Boutique</h4>
                <p class="text-[11px] text-gray-300 truncate">Recettes magasin 385 000 F</p>
              </div>
            </div>

            <!-- Smartphone 3 -->
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/hybrid_float.png', 'Float Agent Hybride', 'Contrôle distinct de la trésorerie float (1,475,000 FCFA) dédiée aux opérations guichetier.')">
              <div class="phone-mockup hybrid-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/hybrid_float.png" alt="Float Agent Hybride" class="w-full h-full object-cover object-top" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2.5 text-center w-full px-1">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate">3. Float Guichet</h4>
                <p class="text-[11px] text-gray-300 truncate">Trésorerie agent 1 475 000 F</p>
              </div>
            </div>

            <!-- Smartphone 4 -->
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/hybrid_closure.png', 'Rapport Z Clôture Hybride', 'Rapprochement comptable consolidant les ventes du commerce et les commissions du guichet.')">
              <div class="phone-mockup hybrid-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/hybrid_closure.png" alt="Rapport Z Hybride" class="w-full h-full object-cover object-top" loading="lazy">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-white text-3xl drop-shadow-md">zoom_in</span>
                    <span class="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Agrandir HD</span>
                  </div>
                </div>
                <div class="phone-home-indicator"></div>
              </div>
              <div class="mt-2.5 text-center w-full px-1">
                <h4 class="font-bold text-white text-xs sm:text-sm truncate">4. Rapport Z Mixte</h4>
                <p class="text-[11px] text-gray-300 truncate">Bilan consolidé boutique & agent</p>
              </div>
            </div>

          </div>
          <div class="flex sm:hidden items-center justify-center gap-1.5 mt-2 text-[11px] text-gray-400">
            <span class="material-symbols-outlined text-sm">swipe</span>
            <span>Glissez horizontalement pour voir les 4 écrans</span>
          </div>`;

if (indexContent.includes(hybridMockupBlock)) {
  indexContent = indexContent.replace(hybridMockupBlock, newHybridMockupBlock);
  console.log('✅ Section Hybride mise à jour en grand format HD!');
} else {
  console.log('⚠️ Bloc Section Hybride non trouvé exactement, vérification...');
}

// Update Lightbox phone-mockup sizing for high-res sharpness
indexContent = indexContent.replace(
  '<div class="phone-mockup w-full max-h-[78vh] shadow-2xl">',
  '<div class="phone-mockup w-full max-w-[340px] sm:max-w-[380px] max-h-[82vh] shadow-2xl mx-auto">'
);

fs.writeFileSync(indexPath, indexContent, 'utf-8');
console.log('🎉 index.html mis à jour avec succès avec les images HD et le nouveau layout !');

// 2. Update download.html
let downloadContent = fs.readFileSync(downloadPath, 'utf-8');
downloadContent = downloadContent.replace(/assets\/images\/real_screens\/([a-zA-Z0-9_]+)\.jpg/g, 'assets/images/real_screens/$1.png');
fs.writeFileSync(downloadPath, downloadContent, 'utf-8');
console.log('🎉 download.html mis à jour avec succès avec les images PNG HD !');
