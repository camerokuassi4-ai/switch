const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('=== IMPLÉMENTATION PARCOURS RETRAIT KIOSQUE PAR QR À USAGE UNIQUE (5 MIN) ===');

// 1. Mise à jour de assets/switch.api.js avec la gestion des jetons de retrait QR à usage unique
let apiCode = fs.readFileSync('assets/switch.api.js', 'utf8');

const qrWithdrawalCode = `
    // =========================================================================
    // PARCOURS RETRAIT KIOSQUE PAR QR À USAGE UNIQUE (EXPIRATION 5 MIN & SANS PIN TRANSMIS)
    // =========================================================================

    /**
     * Récupère la liste des jetons de retrait d'espèces
     */
    getWithdrawalTokens: function () {
      try {
        const raw = localStorage.getItem('switch_withdrawal_tokens');
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return [];
    },

    /**
     * Sauvegarde la liste des jetons de retrait
     */
    saveWithdrawalTokens: function (tokens) {
      localStorage.setItem('switch_withdrawal_tokens', JSON.stringify(tokens));
    },

    /**
     * Création d'une demande de retrait d'espèces avec confirmation PIN préalable
     */
    createWithdrawalToken: async function (amount, pin) {
      const amt = parseInt(amount, 10);
      if (!amt || amt < 500) {
        return { success: false, message: "Le montant minimum de retrait en agence est de 500 FCFA." };
      }

      // Confirmation PIN uniquement dans l'application utilisateur (jamais transmis au QR)
      const pinOk = await this.verifyPin(pin);
      if (!pinOk) {
        return { success: false, message: "Code PIN incorrect. Veuillez réayer." };
      }

      const fee = Math.max(50, Math.round(amt * 0.005));
      const totalDebit = amt + fee;
      const curBal = this.getBalance();

      if (curBal < totalDebit) {
        return {
          success: false,
          message: \`Solde insuffisant dans votre Compte Switch (\${curBal.toLocaleString('fr-FR')} FCFA disponible, \${totalDebit.toLocaleString('fr-FR')} FCFA requis avec frais).\`
        };
      }

      const userPhone = (localStorage.getItem('switch_user_phone_raw') || localStorage.getItem('switch_user_phone') || '0197000000').replace(/\\D/g, '');
      const userName = localStorage.getItem('switch_user_fullname') || localStorage.getItem('switch_user_name') || 'Utilisateur Switch';
      const parts = userName.trim().split(/\\s+/);
      const maskedName = parts[0] + (parts.length > 1 ? ' ' + parts[1][0].toUpperCase() + '.' : '');

      const tokenId = 'SW-CASH-' + this._generateSecureCode(6);
      const otpCode = this._generateSecureCode(6);
      const now = Date.now();
      const expiresAt = now + (5 * 60 * 1000); // 5 minutes d'expiration stricte

      const tokenObj = {
        token_id: tokenId,
        otp_code: otpCode,
        user_phone: userPhone,
        user_masked_name: maskedName,
        amount: amt,
        fee: fee,
        status: "pending_cashout",
        created_at: now,
        expires_at: expiresAt,
        qr_payload: \`SW-CASHOUT:\${tokenId}:\${amt}:\${userPhone}\`
      };

      const tokens = this.getWithdrawalTokens();
      tokens.unshift(tokenObj);
      this.saveWithdrawalTokens(tokens);

      // Stocker les détails pour la vue active de l'utilisateur
      localStorage.setItem('switch_active_withdraw_token_id', tokenId);
      localStorage.setItem('switch_pending_withdrawal_amount', amt.toString());
      localStorage.setItem('switch_pending_withdrawal_fee', fee.toString());
      localStorage.setItem('switch_pending_withdraw_otp', otpCode);
      localStorage.setItem('switch_pending_withdraw_expires_at', expiresAt.toString());

      return {
        success: true,
        token: tokenObj,
        message: "Code PIN confirmé. QR Code de retrait généré (valide 5 minutes)."
      };
    },

    /**
     * Annulation de la demande par le client (0 débit)
     */
    cancelWithdrawalToken: async function (tokenId) {
      const tokens = this.getWithdrawalTokens();
      const tok = tokens.find(t => t.token_id === tokenId || t.otp_code === tokenId);
      if (tok && tok.status === 'pending_cashout') {
        tok.status = 'cancelled';
        tok.cancelled_at = Date.now();
        this.saveWithdrawalTokens(tokens);
      }
      return { success: true, message: "Demande de retrait annulée. Aucun solde n'a été débité." };
    },

    /**
     * Scan / Vérification du QR de retrait côté Agent
     */
    scanWithdrawalToken: async function (identifier) {
      const raw = String(identifier || '').trim();
      const tokens = this.getWithdrawalTokens();
      const tok = tokens.find(t => t.token_id === raw || t.otp_code === raw || t.qr_payload === raw || raw.includes(t.token_id));

      if (!tok) {
        return { success: false, message: "QR Code ou code de retrait introuvable." };
      }

      const now = Date.now();
      if (tok.status === 'completed') {
        return { success: false, error_code: 'ALREADY_USED', message: "Ce QR Code de retrait a déjà été utilisé." };
      }

      if (tok.status === 'cancelled') {
        return { success: false, error_code: 'CANCELLED', message: "Cette demande de retrait a été annulée par le client." };
      }

      if (now > tok.expires_at || tok.status === 'expired') {
        tok.status = 'expired';
        this.saveWithdrawalTokens(tokens);
        return { success: false, error_code: 'EXPIRED', message: "Ce QR Code de retrait a expiré (limite 5 minutes dépassée)." };
      }

      // Vérification du solde du client au moment du scan
      const clientBalKey = 'switch_user_balance_' + tok.user_phone;
      const clientBal = parseInt(localStorage.getItem(clientBalKey) || (tok.user_phone === (localStorage.getItem('switch_user_phone_raw') || '').replace(/\\D/g, '') ? localStorage.getItem('switch_user_balance') : '0') || '0', 10);
      const totalRequired = tok.amount + tok.fee;

      if (clientBal < totalRequired) {
        return { success: false, error_code: 'INSUFFICIENT_CLIENT_BALANCE', message: "Solde client insuffisant pour valider ce retrait." };
      }

      const remainingSec = Math.max(0, Math.floor((tok.expires_at - now) / 1000));

      return {
        success: true,
        is_valid: true,
        token_id: tok.token_id,
        otp_code: tok.otp_code,
        amount: tok.amount,
        fee: tok.fee,
        client_masked_name: tok.user_masked_name,
        client_phone: tok.user_phone,
        expires_in_sec: remainingSec,
        status: tok.status
      };
    },

    /**
     * Confirmation définitive du retrait par l'agent (Remise des espèces + Débit atomique)
     */
    processAgentWithdrawalConfirmation: async function (tokenId) {
      const tokens = this.getWithdrawalTokens();
      const tok = tokens.find(t => t.token_id === tokenId || t.otp_code === tokenId);

      if (!tok) {
        return { success: false, message: "Code ou jeton de retrait introuvable." };
      }

      // GARANTIE D'IDEMPOTENCE : Unicité stricte
      if (tok.status === 'completed') {
        return { success: false, error_code: 'ALREADY_USED', message: "Ce retrait a déjà été validé et les espèces remises." };
      }

      if (Date.now() > tok.expires_at || tok.status === 'expired') {
        tok.status = 'expired';
        this.saveWithdrawalTokens(tokens);
        return { success: false, message: "Le QR Code de retrait a expiré." };
      }

      // Débit atomique du solde client
      const myPhone = (localStorage.getItem('switch_user_phone_raw') || localStorage.getItem('switch_user_phone') || '').replace(/\\D/g, '');
      const isSelf = (tok.user_phone === myPhone);

      let clientBal = isSelf ? this.getBalance() : parseInt(localStorage.getItem('switch_user_balance_' + tok.user_phone) || '0', 10);
      const totalDebit = tok.amount + tok.fee;

      if (clientBal < totalDebit) {
        return { success: false, message: "Solde client insuffisant au moment de la confirmation." };
      }

      const newClientBal = clientBal - totalDebit;
      if (isSelf) {
        this.setBalance(newClientBal);
      } else {
        localStorage.setItem('switch_user_balance_' + tok.user_phone, newClientBal.toString());
      }

      // Marquage définitif à COMPLETED (Idempotent)
      tok.status = 'completed';
      tok.completed_at = Date.now();
      this.saveWithdrawalTokens(tokens);

      // Crédit du float & commissions agent (0.7% commission guichetier)
      const agentComm = Math.min(1500, Math.max(150, Math.round(tok.amount * 0.007)));
      const curFloat = this.getAgentFloat();
      const curComms = this.getAgentCommissions();

      this.setAgentFloat(curFloat + tok.amount);
      this.setAgentCommissions(curComms + agentComm);

      const ref = 'SW-AG-CASH-' + tok.otp_code;

      // Historique côté Agent
      this.addAgentTransaction({
        type: 'retrait',
        title: "Retrait d'espèces (Cash-Out)",
        amount: tok.amount,
        commission: agentComm,
        client: tok.user_masked_name,
        phone: tok.user_phone,
        ref: ref
      });

      // Historique côté Utilisateur
      if (isSelf) {
        this.addTransaction({
          type: 'withdrawal',
          category: 'withdrawal',
          title: "Retrait d'espèces (Kiosque Switch)",
          amount: -tok.amount,
          fee: tok.fee,
          recipient: "Kiosque Switch Agréé",
          icon: "local_atm",
          iconBg: "bg-amber-50 text-amber-700"
        });
      }

      // Données de reçu
      const receiptData = {
        tx_ref: ref,
        amount: tok.amount,
        fee: tok.fee,
        client_name: tok.user_masked_name,
        client_phone: tok.user_phone,
        agent_code: this.getAgentProfile().agent_code,
        agent_kiosk: this.getAgentProfile().business_name,
        date: new Date().toISOString()
      };
      localStorage.setItem('switch_last_agent_receipt', JSON.stringify(receiptData));

      return {
        success: true,
        tx_ref: ref,
        amount: tok.amount,
        fee: tok.fee,
        new_client_balance: newClientBal,
        receipt: receiptData,
        message: "Espèces remises. Retrait validé avec succès."
      };
    },
`;

if (!apiCode.includes('createWithdrawalToken')) {
  apiCode = apiCode.replace('  const SwitchAPI = {', '  const SwitchAPI = {\n' + qrWithdrawalCode);
}

fs.writeFileSync('assets/switch.api.js', apiCode);
fs.writeFileSync('www/assets/switch.api.js', apiCode);
console.log('✔ assets/switch.api.js mis à jour avec le parcours de retrait QR à usage unique (5 min)');

// 2. Mise à jour de code_retrait_especes_agent/code.html
let codeRetraitHtml = fs.readFileSync('code_retrait_especes_agent/code.html', 'utf8');

// Mise à jour de la bannière et des instructions
codeRetraitHtml = codeRetraitHtml.replace('Présentez ce code à votre agent', 'Confirmez avec votre code PIN, puis présentez le QR à l\'agent');
codeRetraitHtml = codeRetraitHtml.replace('Donnez ce code ou présentez le QR Code à l\'agent Switch.', 'Confirmez avec votre code PIN, puis présentez le QR à l\'agent.');

// Ajout du bouton d'annulation client
if (!codeRetraitHtml.includes('cancelWithdrawal')) {
  const cancelBtnHtml = `
    <!-- Bouton d'annulation de la demande -->
    <button onclick="cancelWithdrawal()" class="w-full border border-rose-200 bg-rose-50 text-rose-700 font-bold py-3 rounded-full hover:bg-rose-100 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer my-2">
      <span class="material-symbols-outlined text-sm">cancel</span>
      <span>Annuler la demande de retrait</span>
    </button>
  `;
  codeRetraitHtml = codeRetraitHtml.replace('<!-- Actions -->', cancelBtnHtml + '\n    <!-- Actions -->');
}

// Mise à jour du script du timer (5 minutes = 300 s)
const newTimerScript = `
    let timerInterval = null;
    let expiresAt = parseInt(localStorage.getItem('switch_pending_withdraw_expires_at') || '0', 10);
    if (!expiresAt) expiresAt = Date.now() + (5 * 60 * 1000);

    function updateCountdown() {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      const countEl = document.getElementById('countdown');
      if (countEl) countEl.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');

      if (remaining <= 0) {
        clearInterval(timerInterval);
        if (countEl) countEl.textContent = "QR Expiré";
        alert("Ce QR Code de retrait a expiré (limite 5 minutes). Aucune somme n'a été débitée.");
      }
    }

    async function cancelWithdrawal() {
      const tokenId = localStorage.getItem('switch_active_withdraw_token_id');
      if (window.SwitchAPI && window.SwitchAPI.cancelWithdrawalToken) {
        await window.SwitchAPI.cancelWithdrawalToken(tokenId);
      }
      alert("Demande de retrait annulée avec succès. Aucun solde débité.");
      if (window.switchNavigate) window.switchNavigate('../tableau_de_bord_mis_jour/code.html');
      else window.location.href = '../tableau_de_bord_mis_jour/code.html';
    }

    document.addEventListener('DOMContentLoaded', () => {
      updateCountdown();
      timerInterval = setInterval(updateCountdown, 1000);
    });
`;

codeRetraitHtml = codeRetraitHtml.replace(/let withdrawAmt = 50000;[\s\S]*?renderWithdrawalDetails\(\);/m, newTimerScript);

fs.writeFileSync('code_retrait_especes_agent/code.html', codeRetraitHtml);
fs.writeFileSync('www/code_retrait_especes_agent/code.html', codeRetraitHtml);
console.log('✔ code_retrait_especes_agent/code.html mis à jour (5 min timer & annulation client)');

console.log('=== IMPLÉMENTATION DES MODULES EFFECTUÉE ===');
