import os
import re

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
index_path = os.path.join(root_dir, 'index.html')
download_path = os.path.join(root_dir, 'download.html')

with open(index_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Normalize to LF for easy replacement
original_crlf = '\r\n' in content
content = content.replace('\r\n', '\n')

# 1. Update og:image and CSS
content = content.replace('assets/images/real_screens/user_dashboard.jpg', 'assets/images/real_screens/user_dashboard.png')

old_css = """.phone-mockup {
      position: relative;
      width: 100%;
      aspect-ratio: 9 / 18.5;"""

new_css = """.no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .phone-mockup {
      position: relative;
      width: 100%;
      aspect-ratio: 9 / 19.4;"""

if old_css in content:
    content = content.replace(old_css, new_css)
    print("✅ CSS phone-mockup aspect-ratio mis à jour.")

old_screen_css = """.phone-screen {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 22px;
      overflow: hidden;
      background: #000;
      box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.85);
    }"""

new_screen_css = """.phone-screen {
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
    }"""

if old_screen_css in content:
    content = content.replace(old_screen_css, new_screen_css)
    print("✅ CSS phone-screen image-rendering mis à jour.")

# 2. Upgrade the 4 profile sections with HD PNGs and responsive large layout (2x2 on desktop, swipe 300px on mobile)
# USER SECTION
user_grid_pattern = re.compile(
    r'(<!-- 4 Écrans Clés dans leurs CADRES DE SMARTPHONES \(Droite / 7 cols\) -->\s*<div class="lg:col-span-7">[\s\S]*?<div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">[\s\S]*?</div>\s*</div>\s*</div>\s*</div>\s*</section>)',
    re.MULTILINE
)

new_user_section = """<!-- 4 Écrans Clés dans leurs CADRES DE SMARTPHONES (Droite / 7 cols) -->
        <div class="lg:col-span-7">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xs sm:text-sm uppercase font-black text-gray-200 tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base text-emerald-400">smartphone</span>
              4 Écrans Clés HD (1080p FHD+ • Lisibles directement)
            </h3>
            <span class="text-[11px] text-purple-300 font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-sm">zoom_in</span> Tapez pour agrandir</span>
          </div>

          <!-- Showcase HD 1080p : 2x2 grand format sur PC, swipe tactile ergonomique 300px sur mobile -->
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
                <p class="text-[11px] text-gray-300 truncate">Solde 110k • Coffre Vault 45k</p>
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
                <p class="text-[11px] text-gray-300 truncate">Code STS électricité direct</p>
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
          </div>
        </div>

      </div>
    </div>
  </section>"""

# MERCHANT SECTION
new_merchant_section = """<!-- 4 Écrans Clés dans leurs CADRES DE SMARTPHONES (Droite / 7 cols) -->
        <div class="lg:col-span-7">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xs sm:text-sm uppercase font-black text-gray-200 tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base text-blue-400">smartphone</span>
              4 Écrans Clés HD (1080p FHD+ • Lisibles directement)
            </h3>
            <span class="text-[11px] text-purple-300 font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-sm">zoom_in</span> Tapez pour agrandir</span>
          </div>

          <!-- Showcase HD 1080p : 2x2 grand format sur PC, swipe tactile ergonomique 300px sur mobile -->
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
          </div>
        </div>

      </div>
    </div>
  </section>"""

# AGENT SECTION
new_agent_section = """<!-- 4 Écrans Clés dans leurs CADRES DE SMARTPHONES (Droite / 7 cols) -->
        <div class="lg:col-span-7">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xs sm:text-sm uppercase font-black text-gray-200 tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base text-amber-400">smartphone</span>
              4 Écrans Clés HD (1080p FHD+ • Lisibles directement)
            </h3>
            <span class="text-[11px] text-purple-300 font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-sm">zoom_in</span> Tapez pour agrandir</span>
          </div>

          <!-- Showcase HD 1080p : 2x2 grand format sur PC, swipe tactile ergonomique 300px sur mobile -->
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
            <div class="flex flex-col items-center group cursor-pointer w-[285px] xs:w-[315px] sm:w-auto shrink-0 sm:shrink snap-center" onclick="openLightbox('assets/images/real_screens/agent_closure.jpg', 'Clôture de Caisse (Rapport Z)', 'Arrêt journalier certifié avec décompte des encaissements, décaissements et commissions.')">
              <div class="phone-mockup agent-phone">
                <div class="phone-dynamic-island">
                  <div class="phone-camera-lens"></div>
                  <div class="phone-speaker"></div>
                </div>
                <div class="phone-screen">
                  <img src="assets/images/real_screens/agent_closure.jpg" alt="Rapport Z Clôture" class="w-full h-full object-cover object-top" loading="lazy">
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
          </div>
        </div>

      </div>
    </div>
  </section>"""

# HYBRID SECTION
new_hybrid_section = """<!-- 4 Écrans Clés dans leurs CADRES DE SMARTPHONES (Droite / 7 cols) -->
        <div class="lg:col-span-7">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xs sm:text-sm uppercase font-black text-gray-200 tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base text-teal-400">smartphone</span>
              4 Écrans Clés HD (1080p FHD+ • Lisibles directement)
            </h3>
            <span class="text-[11px] text-purple-300 font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-sm">zoom_in</span> Tapez pour agrandir</span>
          </div>

          <!-- Showcase HD 1080p : 2x2 grand format sur PC, swipe tactile ergonomique 300px sur mobile -->
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
          </div>
        </div>

      </div>
    </div>
  </section>"""

# Find sections by ID and replace
# Profil Utilisateur
m_user = re.search(r'(<!-- Profil 1 : Utilisateur[\s\S]*?<section id="profil-utilisateur"[\s\S]*?)(<!-- 4 Écrans Clés[\s\S]*?</div>\s*</div>\s*</div>\s*</section>)', content)
if m_user:
    content = content[:m_user.start(2)] + new_user_section + content[m_user.end(2):]
    print("✅ Profil Utilisateur remplacé avec succès.")
else:
    print("❌ Profil Utilisateur non trouvé!")

# Profil Marchand
m_merch = re.search(r'(<!-- Profil 2 : Marchand[\s\S]*?<section id="profil-marchand"[\s\S]*?)(<!-- 4 Écrans Clés[\s\S]*?</div>\s*</div>\s*</div>\s*</section>)', content)
if m_merch:
    content = content[:m_merch.start(2)] + new_merchant_section + content[m_merch.end(2):]
    print("✅ Profil Marchand remplacé avec succès.")
else:
    print("❌ Profil Marchand non trouvé!")

# Profil Agent
m_agent = re.search(r'(<!-- Profil 3 : Agent[\s\S]*?<section id="profil-agent"[\s\S]*?)(<!-- 4 Écrans Clés[\s\S]*?</div>\s*</div>\s*</div>\s*</section>)', content)
if m_agent:
    content = content[:m_agent.start(2)] + new_agent_section + content[m_agent.end(2):]
    print("✅ Profil Agent remplacé avec succès.")
else:
    print("❌ Profil Agent non trouvé!")

# Profil Hybride
m_hyb = re.search(r'(<!-- Profil 4 : Hybride[\s\S]*?<section id="profil-hybride"[\s\S]*?)(<!-- 4 Écrans Clés[\s\S]*?</div>\s*</div>\s*</div>\s*</section>)', content)
if m_hyb:
    content = content[:m_hyb.start(2)] + new_hybrid_section + content[m_hyb.end(2):]
    print("✅ Profil Hybride remplacé avec succès.")
else:
    print("❌ Profil Hybride non trouvé!")

# Lightbox phone-mockup update
content = content.replace(
    '<div class="phone-mockup w-full max-h-[78vh] shadow-2xl">',
    '<div class="phone-mockup w-full max-w-[340px] sm:max-w-[380px] max-h-[82vh] shadow-2xl mx-auto">'
)

# Convert back to CRLF
if original_crlf:
    content = content.replace('\n', '\r\n')

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("🎉 index.html enregistré avec succès!")

# DOWNLOAD.HTML update
with open(download_path, 'r', encoding='utf-8') as f:
    dl_content = f.read()

dl_content = re.sub(r'assets/images/real_screens/([a-zA-Z0-9_]+)\.jpg', r'assets/images/real_screens/\1.png', dl_content)

with open(download_path, 'w', encoding='utf-8') as f:
    f.write(dl_content)
print("🎉 download.html enregistré avec succès!")
