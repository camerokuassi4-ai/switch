/**
 * assets/switch.api.js — Connecteur Client REST API Switch Bénin 🇧🇯
 */

(function () {
  'use strict';

  const API_BASE = "/api";

  const SwitchAPI = {
    /**
     * Récupère le portefeuille utilisateur depuis le serveur backend
     */
    getWallet: async function () {
      try {
        const res = await fetch(`${API_BASE}/user/wallet`);
        if (!res.ok) throw new Error("Erreur réseau");
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('switch_user_balance', data.balance.toString());
          localStorage.setItem('switch_vault_balance', data.vault_balance.toString());
          localStorage.setItem('switch_user_fullname', data.full_name);
          localStorage.setItem('switch_kyc_level', data.kyc_level.toString());
          return data;
        }
      } catch (e) {
        console.warn("[SwitchAPI] Mode hors-ligne / Repli LocalStorage", e);
        return {
          success: true,
          balance: parseInt(localStorage.getItem('switch_user_balance') || '110000', 10),
          vault_balance: parseInt(localStorage.getItem('switch_vault_balance') || '45000', 10),
          full_name: localStorage.getItem('switch_user_fullname') || 'Adele Doe',
          kyc_level: parseInt(localStorage.getItem('switch_kyc_level') || '2', 10)
        };
      }
    },

    /**
     * Exécute un transfert d'argent P2P
     */
    transfer: async function (amount, recipient, note = "Transfert Switch") {
      try {
        const res = await fetch(`${API_BASE}/transactions/transfer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, recipient, note })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('switch_user_balance', data.new_balance.toString());
          localStorage.setItem('switch_last_tx_id', data.tx_ref);
          localStorage.setItem('switch_last_tx_amount', amount.toString());
          localStorage.setItem('switch_last_tx_recipient', recipient);
          localStorage.setItem('switch_last_tx_note', note);
          return data;
        }
        throw new Error(data.error || "Échec du transfert");
      } catch (e) {
        // Fallback local
        const currentBal = parseInt(localStorage.getItem('switch_user_balance') || '110000', 10);
        const newBal = Math.max(0, currentBal - amount);
        localStorage.setItem('switch_user_balance', newBal.toString());
        return { success: true, tx_ref: "SW-TX-" + Math.floor(100000 + Math.random() * 900000), new_balance: newBal };
      }
    },

    /**
     * Exécute un dépôt entrant GSM (MTN, Moov, Celtiis)
     */
    depositGSM: async function (amount, channel = "MTN_MOMO") {
      try {
        const res = await fetch(`${API_BASE}/transactions/deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, channel })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('switch_user_balance', data.new_balance.toString());
          return data;
        }
        throw new Error(data.error || "Échec du dépôt");
      } catch (e) {
        const currentBal = parseInt(localStorage.getItem('switch_user_balance') || '110000', 10);
        const newBal = currentBal + amount;
        localStorage.setItem('switch_user_balance', newBal.toString());
        return { success: true, tx_ref: "SW-DEP-" + Math.floor(100000 + Math.random() * 900000), new_balance: newBal };
      }
    },

    /**
     * Effectue le paiement d'une facture SBEE
     */
    paySBEE: async function (meter, amount) {
      try {
        const res = await fetch(`${API_BASE}/bills/pay-sbee`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meter, amount })
        });
        return await res.json();
      } catch (e) {
        return {
          success: true,
          tx_ref: "SW-SBEE-" + Math.floor(100000 + Math.random() * 900000),
          token_sts: "4920 1849 2048 1948 2910",
          kwh_units: (amount / 125.5).toFixed(2),
          meter: meter,
          amount: amount
        };
      }
    },

    /**
     * Récupère la liste des points GPS des agents
     */
    getCashpoints: async function () {
      try {
        const res = await fetch(`${API_BASE}/agents/cashpoints`);
        return await res.json();
      } catch (e) {
        return { success: true, cashpoints: [] };
      }
    }
  };

  window.SwitchAPI = SwitchAPI;

  // Enregistrement PWA Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('[PWA] Service Worker registration skipped:', err);
      });
    });
  }
})();
