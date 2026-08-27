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
        }
      } catch (e) {
        console.warn("[SwitchAPI] RPC Fallback LocalStorage :", e.message);
      }

      // Repli local sécurisé
      const currentBal = parseInt(localStorage.getItem('switch_user_balance') || '110000', 10);
      const newBal = Math.max(0, currentBal - amount);
      const ref = "SW-TX-" + Math.floor(100000 + Math.random() * 900000);
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
     * 3. Opération Guichet Agent : Dépôt (Cash-In) & Retrait (Cash-Out)
     */
    processAgentCash: async function (clientPhone, amount, opType = 'DEPOSIT') {
      try {
        const data = await supabaseRPC('process_agent_cash_operation', {
          p_client_phone: clientPhone,
          p_amount: amount,
          p_operation_type: opType
        });
        if (data && data.success) {
          return data;
        }
      } catch (e) {
        console.warn("[SwitchAPI] Agent RPC Fallback LocalStorage :", e.message);
      }

      // Repli local
      const curFloat = parseInt((localStorage.getItem('switch_agent_float') || '1500000').replace(/\s/g, ''), 10);
      const commission = Math.max(50, Math.round(amount * 0.007));
      let newFloat = curFloat;

      if (opType === 'DEPOSIT') {
        newFloat = Math.max(0, curFloat - amount);
      } else {
        newFloat = curFloat + amount;
      }
      localStorage.setItem('switch_agent_float', newFloat.toString());

      return {
        success: true,
        tx_ref: `TRX-${opType.slice(0, 3)}-${Math.floor(10000 + Math.random() * 90000)}`,
        amount: amount,
        commission: commission,
        operation: opType,
        client: clientPhone
      };
    },

    /**
     * 4. Récupère les points relais GPS (Carte des Agents)
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
