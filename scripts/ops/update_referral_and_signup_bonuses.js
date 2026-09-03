const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('=== MISE À JOUR DU SYSTÈME DE PARRAINAGE ET SUPPRESSION DE LA PRIME D\'INSCRIPTION ===');

// 1. Mise à jour de assets/switch.api.js
let apiContent = fs.readFileSync('assets/switch.api.js', 'utf8');

// A. Remplacement des soldes initiaux 50000 / 500 par 0 lors de la création de compte et des fallbacks
apiContent = apiContent.replace(/localStorage\.setItem\('switch_user_balance',\s*'50000'\);/g, "localStorage.setItem('switch_user_balance', '0');");
apiContent = apiContent.replace(/localStorage\.setItem\('switch_user_balance',\s*'500'\);/g, "localStorage.setItem('switch_user_balance', '0');");

// Conserver les fallbacks de calcul s'ils existent sans valeur par défaut élevée
apiContent = apiContent.replace(/parseInt\(localStorage\.getItem\('switch_user_balance'\)\s*\|\|\s*'50000',/g, "parseInt(localStorage.getItem('switch_user_balance') || '0',");
apiContent = apiContent.replace(/parseInt\(localStorage\.getItem\('switch_user_balance'\)\s*\|\|\s*'500',/g, "parseInt(localStorage.getItem('switch_user_balance') || '0',");

// B. Ajout de la méthode processReferralReward
const processReferralRewardCode = `
    /**
     * Traitement de la prime de parrainage (Nouveau Barème Bêta v2.1.0)
     * - 100 FCFA pour la 1ère invitation du parrain
     * - 50 FCFA pour chaque invitation suivante du parrain
     * - 0 FCFA pour le filleul (ne reçoit rien à l'inscription)
     */
    processReferralReward: async function (referrerPhone, newUserId) {
      const rPhone = (referrerPhone || '').replace(/\\D/g, '');
      if (!rPhone) return { success: false, message: "Numéro de parrain invalide." };

      const refKey = 'switch_referrals_' + rPhone;
      const prevRefList = JSON.parse(localStorage.getItem(refKey) || '[]');
      const refCount = prevRefList.length;

      // 100 FCFA pour la 1ère invitation, 50 FCFA pour les suivantes
      const rewardAmt = (refCount === 0) ? 100 : 50;

      // Créditer le solde du parrain
      const parrainBalKey = 'switch_user_balance_' + rPhone;
      const myPhone = (localStorage.getItem('switch_user_phone_raw') || localStorage.getItem('switch_user_phone') || '').replace(/\\D/g, '');

      let curParrainBal = 0;
      if (rPhone === myPhone) {
        curParrainBal = this.getBalance();
        const newParrainBal = curParrainBal + rewardAmt;
        this.setBalance(newParrainBal);
      } else {
        curParrainBal = parseInt(localStorage.getItem(parrainBalKey) || '0', 10);
        const newParrainBal = curParrainBal + rewardAmt;
        localStorage.setItem(parrainBalKey, newParrainBal.toString());
      }

      // Enregistrer le filleul dans l'historique du parrain
      prevRefList.push({ id: newUserId || \`USER-\${Date.now()}\`, date: new Date().toISOString(), reward: rewardAmt });
      localStorage.setItem(refKey, JSON.stringify(prevRefList));

      // Mettre à jour le cumul des primes pour le parrain
      const totalPrimesKey = 'switch_ref_total_primes_' + rPhone;
      const curPrimes = parseInt(localStorage.getItem(totalPrimesKey) || '0', 10);
      localStorage.setItem(totalPrimesKey, (curPrimes + rewardAmt).toString());

      return {
        success: true,
        reward_parrain: rewardAmt,
        reward_filleul: 0,
        referral_count: refCount + 1,
        message: \`Prime de parrainage de \${rewardAmt} FCFA attribuée au parrain (\${refCount === 0 ? '1ère invitation' : 'invitation n°' + (refCount + 1)}). Filleul crédité de 0 FCFA.\`
      };
    },
`;

if (!apiContent.includes('processReferralReward')) {
  const insertMarker = '    /**\n     * Alias Paiement Marchand pour la Marketplace & Checkout\n     */';
  if (apiContent.includes(insertMarker)) {
    apiContent = apiContent.replace(insertMarker, processReferralRewardCode + '\n' + insertMarker);
  } else {
    apiContent = apiContent.replace('  const SwitchAPI = {', '  const SwitchAPI = {\n' + processReferralRewardCode);
  }
}

fs.writeFileSync('assets/switch.api.js', apiContent);
fs.writeFileSync('www/assets/switch.api.js', apiContent);
console.log('✔ assets/switch.api.js & www/assets/switch.api.js mis à jour (Solde initial = 0 FCFA, Barème 100F/50F)');

// 2. Mise à jour de parrainage_recompenses/code.html
let parrainageHtml = fs.readFileSync('parrainage_recompenses/code.html', 'utf8');

// Remplacement du bandeau principal
parrainageHtml = parrainageHtml.replace('500 FCFA par ami invité', 'Primes : 100 F (1er ami) • 50 F (suivants)');
parrainageHtml = parrainageHtml.replace('Gagnez jusqu\'à 50 000 FCFA', 'Invitez vos proches & Gagnez !');
parrainageHtml = parrainageHtml.replace(
  'Invitez vos amis sur Switch. Dès leur première transaction, vous recevez tous les deux 500 FCFA directement sur vos comptes.',
  'Gagnez 100 FCFA pour votre première invitation, puis 50 FCFA pour chaque invitation suivante. Vos amis peuvent à leur tour inviter leurs proches pour gagner !'
);

// Remplacement de la carte explicative
const ruleCardOld = `    <!-- Referral Code Card -->
    <div class="bg-surface-container-lowest rounded-3xl p-6 soft-shadow border border-outline-variant flex flex-col gap-4">
      <span class="text-xs font-bold text-on-surface-variant uppercase">Votre Code de Parrainage</span>`;

const ruleCardNew = `    <!-- RÈGLES DE PARRAINAGE SIMPLIFIÉES -->
    <div class="bg-purple-50/80 border border-purple-200 rounded-3xl p-5 flex flex-col gap-3 text-xs text-on-surface">
      <h3 class="font-extrabold text-sm text-primary flex items-center gap-1.5">
        <span class="material-symbols-outlined text-base">emoji_events</span>
        <span>Comment fonctionner le parrainage ?</span>
      </h3>
      <ul class="space-y-2 font-medium text-gray-700 pl-1">
        <li class="flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-primary text-white font-black text-[10px] flex items-center justify-center shrink-0">1</span>
          <span><b>100 FCFA</b> pour la première invitation réussie</span>
        </li>
        <li class="flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-purple-200 text-primary font-black text-[10px] flex items-center justify-center shrink-0">2</span>
          <span><b>50 FCFA</b> pour chaque invitation suivante</span>
        </li>
        <li class="flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0">3</span>
          <span>Vos amis invités reçoivent <b>0 FCFA</b> mais peuvent gagner à leur tour en parrainant leurs proches !</span>
        </li>
      </ul>
    </div>

    <!-- Referral Code Card -->
    <div class="bg-surface-container-lowest rounded-3xl p-6 soft-shadow border border-outline-variant flex flex-col gap-4">
      <span class="text-xs font-bold text-on-surface-variant uppercase">Votre Code de Parrainage</span>`;

if (!parrainageHtml.includes('Comment fonctionner le parrainage ?')) {
  parrainageHtml = parrainageHtml.replace(ruleCardOld, ruleCardNew);
}

// Mise à jour du script JavaScript de parrainage_recompenses/code.html
const oldScriptPattern = `    function getUserRefCode() {
      const prof = window.SwitchAPI ? window.SwitchAPI.getProfile() : {};
      const phone = (prof.phone || localStorage.getItem('switch_user_phone') || '').replace(/\\D/g, '');
      const suffix = phone ? phone.slice(-4) : (localStorage.getItem('switch_account_suffix') || '500');
      return 'SW' + suffix;
    }

    document.addEventListener('DOMContentLoaded', () => {
      const code = getUserRefCode();
      const codeEl = document.getElementById('ref-code');
      if (codeEl) codeEl.textContent = code;
    });

    function copyRefCode() {
      const code = getUserRefCode();
      navigator.clipboard.writeText(code);
      alert("Code de parrainage copié : " + code);
    }

    function shareReferralWhatsApp() {
      const code = getUserRefCode();
      const msg = encodeURIComponent(
        "👋 Rejoins-moi sur *Switch (Bénin)* pour transférer de l'argent gratuitement et payer tes factures SBEE/SONEB !\\n\\n" +
        "🎁 Utilise mon code *" + code + "* pour recevoir 500 FCFA de bienvenue : https://switch.bj/join/" + code
      );
      window.open("https://wa.me/?text=" + msg, "_blank");
    }`;

const newScriptPattern = `    function getUserRefCode() {
      const prof = window.SwitchAPI ? window.SwitchAPI.getProfile() : {};
      const phone = (prof.phone || localStorage.getItem('switch_user_phone') || '').replace(/\\D/g, '');
      const suffix = phone ? phone.slice(-4) : (localStorage.getItem('switch_account_suffix') || '01');
      return 'SW' + suffix;
    }

    function updateReferralStats() {
      const prof = window.SwitchAPI ? window.SwitchAPI.getProfile() : {};
      const phone = (prof.phone || localStorage.getItem('switch_user_phone') || '').replace(/\\D/g, '');
      const refKey = 'switch_referrals_' + phone;
      const refList = JSON.parse(localStorage.getItem(refKey) || '[]');
      const filleulsCount = refList.length;
      
      let totalPrimes = 0;
      refList.forEach((item, idx) => {
        totalPrimes += (item.reward !== undefined) ? item.reward : (idx === 0 ? 100 : 50);
      });

      const totalKey = 'switch_ref_total_primes_' + phone;
      if (totalPrimes === 0 && localStorage.getItem(totalKey)) {
        totalPrimes = parseInt(localStorage.getItem(totalKey) || '0', 10);
      }

      const primesEl = document.getElementById('ref-primes-val');
      if (primesEl) primesEl.textContent = totalPrimes.toLocaleString('fr-FR') + ' FCFA';

      const filleulsEl = document.getElementById('ref-filleuls-val');
      if (filleulsEl) filleulsEl.textContent = filleulsCount + (filleulsCount > 1 ? ' amis' : ' ami');
    }

    document.addEventListener('DOMContentLoaded', () => {
      const code = getUserRefCode();
      const codeEl = document.getElementById('ref-code');
      if (codeEl) codeEl.textContent = code;
      updateReferralStats();
    });

    function copyRefCode() {
      const code = getUserRefCode();
      navigator.clipboard.writeText(code);
      alert("Code de parrainage copié : " + code);
    }

    function shareReferralWhatsApp() {
      const code = getUserRefCode();
      const msg = encodeURIComponent(
        "👋 Rejoins-moi sur *Switch (Bénin)* pour transférer de l'argent gratuitement et payer tes factures SBEE/SONEB !\\n\\n" +
        "🎁 Utilise mon code *" + code + "* à l'inscription puis invite tes amis pour gagner 100 FCFA (1ère invitation) puis 50 FCFA par ami : https://switch.bj/join/" + code
      );
      window.open("https://wa.me/?text=" + msg, "_blank");
    }`;

parrainageHtml = parrainageHtml.replace(oldScriptPattern, newScriptPattern);

fs.writeFileSync('parrainage_recompenses/code.html', parrainageHtml);
fs.writeFileSync('www/parrainage_recompenses/code.html', parrainageHtml);
console.log('✔ parrainage_recompenses/code.html & www/parrainage_recompenses/code.html mis à jour');

// 3. Mise à jour de tableau_de_bord_mis_jour/code.html
let dashHtml = fs.readFileSync('tableau_de_bord_mis_jour/code.html', 'utf8');
dashHtml = dashHtml.replace('Gagnez 500 FCFA par ami', 'Gagnez 100 F puis 50 F par ami');
fs.writeFileSync('tableau_de_bord_mis_jour/code.html', dashHtml);
fs.writeFileSync('www/tableau_de_bord_mis_jour/code.html', dashHtml);
console.log('✔ tableau_de_bord_mis_jour/code.html & www/tableau_de_bord_mis_jour/code.html mis à jour');

// 4. Mise à jour de bienvenue_succes_onboarding/code.html
let welcomeHtml = fs.readFileSync('bienvenue_succes_onboarding/code.html', 'utf8');
welcomeHtml = welcomeHtml.replace('<!-- Welcome Gift Card (500 FCFA Bonus) -->', '<!-- Account Ready Card (0 FCFA Bonus) -->');
welcomeHtml = welcomeHtml.replace('+500 FCFA Offerts', 'Solde Initial : 0 FCFA');
welcomeHtml = welcomeHtml.replace('Cadeau de Bienvenue', 'Compte Actif');
welcomeHtml = welcomeHtml.replace('<span class="bg-white text-primary text-xs font-black px-3 py-1 rounded-full shadow-sm">\n        Crédité\n      </span>', '<span class="bg-white text-primary text-xs font-black px-3 py-1 rounded-full shadow-sm">\n        Prêt (0% Frais)\n      </span>');
fs.writeFileSync('bienvenue_succes_onboarding/code.html', welcomeHtml);
fs.writeFileSync('www/bienvenue_succes_onboarding/code.html', welcomeHtml);
console.log('✔ bienvenue_succes_onboarding/code.html & www/bienvenue_succes_onboarding/code.html mis à jour');

// 5. Parité SHA-256
const filesToVerify = ['assets/switch.api.js', 'parrainage_recompenses/code.html', 'tableau_de_bord_mis_jour/code.html', 'bienvenue_succes_onboarding/code.html'];
filesToVerify.forEach(f => {
  const hash1 = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  const hash2 = crypto.createHash('sha256').update(fs.readFileSync('www/' + f)).digest('hex');
  if (hash1 === hash2) {
    console.log(`✔ SHA-256 Parity OK: ${f}`);
  } else {
    console.error(`❌ SHA-256 Mismatch: ${f}`);
  }
});

console.log('\n=== MISES À JOUR EFFECTUÉES AVEC SUCCÈS ===');
