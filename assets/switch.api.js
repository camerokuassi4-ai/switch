/**
 * assets/switch.api.js — Connecteur Supabase & Offline Grand Livre Switch Bénin 🇧🇯
 * ─────────────────────────────────────────────────────────────────────────────
 * Intègre le support natif de PostgreSQL Supabase (Auth, Tables, RLS, RPCs)
 * avec bascule automatique transparente sur localStorage en mode hors-ligne.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  const cfg = window.SWITCH_CONFIG || {
    SUPABASE_URL: "https://votre-projet.supabase.co",
    SUPABASE_ANON_KEY: "",
    OFFLINE_FALLBACK: true
  };

  const isConfigured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("votre-projet") && cfg.SUPABASE_ANON_KEY && cfg.SUPABASE_ANON_KEY.length > 20;

  // Client Supabase REST Helper
  async function supabaseFetch(endpoint, options = {}) {
    if (!isConfigured) {
      throw new Error("Supabase credentials not set. Falling back to local offline mode.");
    }

    const url = `${cfg.SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
      'apikey': cfg.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${sessionStorage.getItem('switch_auth_token') || cfg.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {})
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Supabase HTTP ${res.status}`);
    }
    return await res.json();
  }

  // RPC Helper (Procédures Stockées SECURITY DEFINER)
  async function supabaseRPC(functionName, params = {}) {
    return await supabaseFetch(`rpc/${functionName}`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  const SwitchAPI = {
    isOnlineBackend: isConfigured,

    /**
     * 1. Récupère le profil et le solde utilisateur
     */
    getWallet: async function (phone = "+229 97 12 34 56") {
      try {
        const rows = await supabaseFetch(`profiles?phone=eq.${encodeURIComponent(phone)}&select=*`);
        if (rows && rows.length > 0) {
          const user = rows[0];
          localStorage.setItem('switch_user_balance', user.balance.toString());
          localStorage.setItem('switch_vault_balance', user.vault_balance.toString());
          localStorage.setItem('switch_user_fullname', user.full_name);
          localStorage.setItem('switch_kyc_level', user.kyc_level.toString());
          return { success: true, ...user };
        }
      } catch (e) {
        console.info("[SwitchAPI] Mode LocalStorage actif :", e.message);
      }

      // Repli local
      return {
        success: true,
        balance: parseInt(localStorage.getItem('switch_user_balance') || '110000', 10),
        vault_balance: parseInt(localStorage.getItem('switch_vault_balance') || '45000', 10),
        full_name: localStorage.getItem('switch_user_fullname') || 'Adele Doe',
        kyc_level: parseInt(localStorage.getItem('switch_kyc_level') || '2', 10),
        phone: phone
      };
    },

    /**
     * Helper : Générateur cryptographique sécurisé
     */
    _generateSecureCode: function (length = 6) {
      if (window.crypto && window.crypto.getRandomValues) {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length) - 1;
        return (min + (array[0] % (max - min + 1))).toString();
      }
      return Math.floor(100000 + Math.random() * 900000).toString();
    },

    /**
     * 2. Transfert P2P Sécurisé (Appelle la fonction RPC PostgreSQL process_p2p_transfer)
     */
    transfer: async function (amount, recipientPhone, note = "Transfert Switch") {
      try {
        const data = await supabaseRPC('process_p2p_transfer', {
          p_recipient_phone: recipientPhone,
          p_amount: amount,
          p_note: note
        });

        if (data && data.success) {
          localStorage.setItem('switch_user_balance', data.new_balance.toString());
          localStorage.setItem('switch_last_tx_id', data.tx_ref);
          localStorage.setItem('switch_last_tx_amount', amount.toString());
          localStorage.setItem('switch_last_tx_recipient', recipientPhone);
          localStorage.setItem('switch_last_tx_note', note);
          return data;
        } else if (data && data.success === false) {
          return data;
        }
      } catch (e) {
        if (!cfg.OFFLINE_FALLBACK) {
          return { success: false, message: e.message || "Erreur de connexion au serveur." };
        }
        console.warn("[SwitchAPI] RPC Fallback LocalStorage :", e.message);
      }

      // Repli local sécurisé
      const currentBal = parseInt(localStorage.getItem('switch_user_balance') || '125000', 10);
      if (currentBal < amount) {
        return { success: false, message: "Solde insuffisant dans votre Compte Switch." };
      }

      const newBal = Math.max(0, currentBal - amount);
      const ref = "SW-TX-" + this._generateSecureCode(6);
      localStorage.setItem('switch_user_balance', newBal.toString());
      localStorage.setItem('switch_last_tx_id', ref);
      localStorage.setItem('switch_last_tx_amount', amount.toString());
      localStorage.setItem('switch_last_tx_recipient', recipientPhone);
      localStorage.setItem('switch_last_tx_note', note);

      return {
        success: true,
        tx_ref: ref,
        amount: amount,
        new_balance: newBal,
        recipient: recipientPhone
      };
    },

    /**
     * 3. Génération d'un Code OTP Express de Retrait (Code à 6 chiffres, cryptographique, validité 15 min)
     */
    generateWithdrawalOtp: async function (amount, fee = 0) {
      const otpCode = this._generateSecureCode(6);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const phone = localStorage.getItem('switch_user_phone') || '+229 01 22 90 19 07';

      try {
        await supabaseFetch('cash_operations', {
          method: 'POST',
          body: JSON.stringify({
            otp_code: otpCode,
            client_phone: phone,
            amount: amount,
            fee: fee,
            op_type: 'WITHDRAWAL',
            status: 'pending',
            expires_at: expiresAt
          })
        });
      } catch (e) {
        console.info("[SwitchAPI] OTP enregistré en local :", e.message);
      }

      localStorage.setItem('switch_pending_withdraw_otp', otpCode);
      localStorage.setItem('switch_pending_withdraw_amt', amount.toString());
      localStorage.setItem('switch_pending_withdraw_fee', fee.toString());
      localStorage.setItem('switch_pending_withdraw_expires', expiresAt);

      return {
        success: true,
        otp_code: otpCode,
        amount: amount,
        fee: fee,
        expires_at: expiresAt
      };
    },

    /**
     * 4. Opération Guichet Agent : Dépôt (Cash-In) & Retrait (Cash-Out) via Code OTP ou Compte
     */
    processAgentCash: async function (clientPhoneOrOtp, amount, opType = 'WITHDRAWAL') {
      try {
        const data = await supabaseRPC('process_agent_cash_operation', {
          p_client_phone: clientPhoneOrOtp,
          p_amount: amount,
          p_operation_type: opType,
          p_otp_code: (clientPhoneOrOtp && clientPhoneOrOtp.length === 6) ? clientPhoneOrOtp : null
        });
        if (data && data.success) {
          return data;
        } else if (data && data.success === false) {
          return data;
        }
      } catch (e) {
        if (!cfg.OFFLINE_FALLBACK) {
          return { success: false, message: e.message || "Erreur lors de l'opération guichet." };
        }
        console.warn("[SwitchAPI] Agent RPC Fallback LocalStorage :", e.message);
      }

      // Repli local
      const curFloat = parseInt((localStorage.getItem('switch_agent_float') || '1500000').replace(/\s/g, ''), 10);
      const commission = Math.max(100, Math.round(amount * 0.008));
      let newFloat = curFloat;

      if (opType === 'DEPOSIT') {
        if (curFloat < amount) {
          return { success: false, message: "Float agent insuffisant pour effectuer ce dépôt." };
        }
        newFloat = Math.max(0, curFloat - amount);
      } else {
        newFloat = curFloat + amount;
      }
      localStorage.setItem('switch_agent_float', newFloat.toString());

      return {
        success: true,
        tx_ref: `TRX-${opType.slice(0, 3)}-` + this._generateSecureCode(5),
        amount: amount,
        commission: commission,
        operation: opType,
        client: clientPhoneOrOtp
      };
    },

    /**
     * 5. Paiement Marchand (Scan QR / Caisse POS)
     */
    payMerchant: async function (merchantIdentifier, amount, note = "Paiement Marchand Switch") {
      try {
        const data = await supabaseRPC('process_merchant_payment', {
          p_merchant_identifier: merchantIdentifier,
          p_amount: amount,
          p_note: note
        });

        if (data && data.success) {
          localStorage.setItem('switch_user_balance', data.new_balance.toString());
          localStorage.setItem('switch_last_tx_id', data.tx_ref);
          localStorage.setItem('switch_last_tx_amount', amount.toString());
          localStorage.setItem('switch_last_tx_recipient', merchantIdentifier);
          return data;
        } else if (data && data.success === false) {
          return data;
        }
      } catch (e) {
        if (!cfg.OFFLINE_FALLBACK) {
          return { success: false, message: e.message || "Erreur lors du paiement marchand." };
        }
        console.warn("[SwitchAPI] Merchant Payment RPC Fallback :", e.message);
      }

      // Repli local
      const curBal = parseInt(localStorage.getItem('switch_user_balance') || '125000', 10);
      if (curBal < amount) {
        return { success: false, message: "Solde insuffisant pour payer ce marchand." };
      }
      const newBal = Math.max(0, curBal - amount);
      const ref = "SW-PAY-" + this._generateSecureCode(6);
      localStorage.setItem('switch_user_balance', newBal.toString());
      localStorage.setItem('switch_last_tx_id', ref);
      localStorage.setItem('switch_last_tx_amount', amount.toString());
      localStorage.setItem('switch_last_tx_recipient', merchantIdentifier);

      return {
        success: true,
        tx_ref: ref,
        amount: amount,
        new_balance: newBal,
        merchant: merchantIdentifier
      };
    },

    /**
     * 6. Récupération du Profil & Soldes Agent (Float, Commissions, Stats du jour)
     */
    getAgentDashboard: async function () {
      try {
        const data = await supabaseRPC('get_agent_dashboard_data', {});
        if (data && data.success) {
          localStorage.setItem('switch_agent_float', data.float_balance.toString());
          localStorage.setItem('switch_agent_commissions', data.commissions_balance.toString());
          localStorage.setItem('switch_agent_code', data.agent_code);
          return data;
        }
      } catch (e) {
        console.warn("[SwitchAPI] Agent Dashboard RPC info :", e.message);
      }

      // Repli local
      const curFloat = parseInt((localStorage.getItem('switch_agent_float') || '1500000').replace(/\s/g, ''), 10);
      const curComm = parseInt((localStorage.getItem('switch_agent_commissions') || '48500').replace(/\s/g, ''), 10);
      return {
        success: true,
        business_name: "Kiosque Switch Saint-Michel",
        agent_code: localStorage.getItem('switch_agent_code') || "AGT-4092",
        float_balance: curFloat,
        commissions_balance: curComm,
        today_transactions_count: 14,
        today_volume: 385000
      };
    },

    /**
     * 7. Retrait des Commissions Agent vers Solde Personnel
     */
    withdrawAgentCommissions: async function (amount) {
      try {
        const data = await supabaseRPC('withdraw_agent_commissions', {
          p_amount: amount
        });
        if (data && data.success) {
          localStorage.setItem('switch_agent_commissions', data.remaining_commissions.toString());
          return data;
        } else if (data && data.success === false) {
          return data;
        }
      } catch (e) {
        if (!cfg.OFFLINE_FALLBACK) {
          return { success: false, message: e.message || "Erreur lors du retrait de commissions." };
        }
        console.warn("[SwitchAPI] Commission Payout RPC info :", e.message);
      }

      // Repli local
      const curComm = parseInt((localStorage.getItem('switch_agent_commissions') || '48500').replace(/\s/g, ''), 10);
      if (curComm < amount) {
        return { success: false, message: "Solde de commissions insuffisant." };
      }
      const newComm = curComm - amount;
      localStorage.setItem('switch_agent_commissions', newComm.toString());
      const curBal = parseInt(localStorage.getItem('switch_user_balance') || '125000', 10);
      localStorage.setItem('switch_user_balance', (curBal + amount).toString());

      return {
        success: true,
        tx_ref: "SW-COMM-" + this._generateSecureCode(6),
        amount: amount,
        remaining_commissions: newComm
      };
    },

    /**
     * 8. Clôture de Caisse Journalière (Rapport Z)
     */
    closeCashierSession: async function (notes = "Clôture journalière") {
      try {
        const data = await supabaseRPC('close_cashier_session', {
          p_notes: notes
        });
        if (data && data.success) {
          return data;
        }
      } catch (e) {
        console.warn("[SwitchAPI] Close Session RPC info :", e.message);
      }

      // Repli local
      const curFloat = parseInt((localStorage.getItem('switch_agent_float') || '1500000').replace(/\s/g, ''), 10);
      const curComm = parseInt((localStorage.getItem('switch_agent_commissions') || '48500').replace(/\s/g, ''), 10);
      return {
        success: true,
        session_id: "sess-" + this._generateSecureCode(6),
        closing_float: curFloat,
        total_cash_in: 250000,
        total_cash_out: 135000,
        total_commissions: curComm,
        closed_at: new Date().toISOString()
      };
    },

    /**
     * 9. Récupère les points relais GPS (Carte des Agents)
     */
    getCashpoints: async function () {
      try {
        const rows = await supabaseFetch('cashpoints?select=*&is_open=eq.true');
        if (rows && rows.length > 0) {
          return { success: true, cashpoints: rows };
        }
      } catch (e) {
        console.info("[SwitchAPI] Chargement des cashpoints locaux");
      }

      return {
        success: true,
        cashpoints: [
          { name: "Kiosque Switch Saint-Michel", agent_code: "AGT-4092", city: "Cotonou", neighborhood: "Saint-Michel", phone: "+229 97 12 34 56", lat: 6.3683, lng: 2.4289 },
          { name: "Agence Relais Switch Akpakpa", agent_code: "AGT-1021", city: "Cotonou", neighborhood: "Akpakpa Dodomè", phone: "+229 96 11 22 33", lat: 6.3650, lng: 2.4450 },
          { name: "Point Service Switch Calavi", agent_code: "AGT-5541", city: "Abomey-Calavi", neighborhood: "Arconville", phone: "+229 95 44 55 66", lat: 6.4485, lng: 2.3556 }
        ]
      };
    }
  };

  window.SwitchAPI = SwitchAPI;

  // Enregistrement PWA Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('../sw.js').catch(err => {
        console.log('[PWA] Service Worker registration info:', err);
      });
    });
  }
})();
