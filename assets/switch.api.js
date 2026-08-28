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
    OFFLINE_FALLBACK: false,
    DEMO_ONSCREEN_OTP: true
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
     * Helper : Affichage visuel d'un OTP à l'écran (Mode Démo BCEAO sans SMS)
     */
    showOnscreenOtp: function (otpCode, label = "Code de Sécurité") {
      if (cfg.DEMO_ONSCREEN_OTP === false) return;
      
      const existing = document.getElementById('switch-demo-otp-banner');
      if (existing) existing.remove();

      const banner = document.createElement('div');
      banner.id = 'switch-demo-otp-banner';
      banner.style.cssText = 'position:fixed; top:16px; left:50%; transform:translateX(-50%); z-index:99999; width:92%; max-width:440px; background:linear-gradient(135deg, #2D1577 0%, #150E38 100%); color:#ffffff; border-radius:24px; padding:16px; box-shadow:0 20px 40px rgba(0,0,0,0.4); border:2px solid #F59E0B; font-family:sans-serif; display:flex; flex-direction:column; gap:10px;';
      banner.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:between; width:100%;">
          <div style="display:flex; align-items:center; gap:8px; flex:1;">
            <span style="font-size:18px;">🔑</span>
            <span style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#FCD34D; background:rgba(245,158,11,0.2); padding:3px 8px; border-radius:999px; border:1px solid rgba(245,158,11,0.4);">Mode Démo BCEAO • Sans SMS</span>
          </div>
          <button type="button" onclick="document.getElementById('switch-demo-otp-banner').remove()" style="background:rgba(255,255,255,0.15); border:none; color:#ffffff; font-weight:bold; font-size:12px; border-radius:999px; width:24px; height:24px; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.25); border-radius:16px; padding:10px 14px; border:1px solid rgba(255,255,255,0.1);">
          <div style="display:flex; flex-direction:column;">
            <span style="font-size:11px; color:#E0E7FF;">${label} :</span>
            <span style="font-size:24px; font-weight:900; font-family:monospace; letter-spacing:4px; color:#FCD34D; user-select:all;">${otpCode}</span>
          </div>
          <button type="button" onclick="navigator.clipboard.writeText('${otpCode}'); alert('Code OTP copié : ${otpCode}'); if(window.fillTestOtp) fillTestOtp();" style="background:#F59E0B; color:#1E1035; border:none; font-weight:800; font-size:12px; padding:8px 14px; border-radius:12px; cursor:pointer; box-shadow:0 4px 10px rgba(245,158,11,0.3);">
            Copier & Insérer
          </button>
        </div>
        <div style="font-size:10px; color:#C7D2FE; line-height:1.3;">
          Code généré sécurisé (crypto). En production réelle, ce code sera délivré par SMS.
        </div>
      `;
      document.body.appendChild(banner);
    },

    /**
     * 1. Récupère le profil et le solde utilisateur (Synchronisation Supabase RPC en temps réel)
     */
    getWallet: async function (phone) {
      const rawUserPhone = phone || localStorage.getItem('switch_user_phone_raw') || localStorage.getItem('switch_user_phone') || localStorage.getItem('switch_account_number') || "+229 01 90 75 17 86";

      // 1. Appel RPC sécurisé direct PostgreSQL
      try {
        const rpcData = await supabaseRPC('get_user_wallet_data', {
          p_phone: rawUserPhone
        });
        if (rpcData && rpcData.success) {
          if (rpcData.balance !== undefined && rpcData.balance !== null) {
            localStorage.setItem('switch_user_balance', rpcData.balance.toString());
          }
          if (rpcData.vault_balance !== undefined && rpcData.vault_balance !== null) {
            localStorage.setItem('switch_vault_balance', rpcData.vault_balance.toString());
          }
          if (rpcData.full_name) {
            localStorage.setItem('switch_user_fullname', rpcData.full_name);
            localStorage.setItem('switch_user_name', rpcData.full_name);
          }
          if (rpcData.kyc_level) {
            localStorage.setItem('switch_kyc_level', rpcData.kyc_level.toString());
          }
          if (rpcData.transactions && Array.isArray(rpcData.transactions) && rpcData.transactions.length > 0) {
            localStorage.setItem('switch_transactions', JSON.stringify(rpcData.transactions));
          }
          return rpcData;
        }
      } catch (eRpc) {
        console.warn("[SwitchAPI] Synchro RPC get_user_wallet_data info :", eRpc.message);
      }

      // 2. Requête REST directe de repli
      const cleanDigits = rawUserPhone.replace(/\D/g, '');
      let core8 = cleanDigits.length === 14 && cleanDigits.startsWith("01") ? cleanDigits.slice(2, 10) : cleanDigits.slice(-8);

      try {
        const rows = await supabaseFetch(`profiles?select=*&order=balance.desc&limit=1`);
        if (rows && rows.length > 0) {
          const user = rows[0];
          if (user.balance !== undefined && user.balance !== null) {
            localStorage.setItem('switch_user_balance', user.balance.toString());
          }
          if (user.full_name) {
            localStorage.setItem('switch_user_fullname', user.full_name);
            localStorage.setItem('switch_user_name', user.full_name);
          }
          return { success: true, ...user };
        }
      } catch (e) {
        console.info("[SwitchAPI] Synchro REST live info :", e.message);
      }

      // Repli local
      return {
        success: true,
        balance: parseInt(localStorage.getItem('switch_user_balance') || '50000', 10),
        vault_balance: parseInt(localStorage.getItem('switch_vault_balance') || '0', 10),
        full_name: localStorage.getItem('switch_user_fullname') || localStorage.getItem('switch_user_name') || 'Camero Kuassis',
        kyc_level: parseInt(localStorage.getItem('switch_kyc_level') || '2', 10),
        phone: rawUserPhone
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
      const currentBal = parseInt(localStorage.getItem('switch_user_balance') || '50000', 10);
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
      const phone = localStorage.getItem('switch_user_phone') || localStorage.getItem('switch_user_phone_raw') || '+229 01 90 75 17 86';

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
     * 3.1 Demande de Retrait initiée par l'Agent vers le Compte Client (Envoi OTP Sécurisé)
     */
    requestWithdrawalOtp: async function (clientIdentifier, amount) {
      const otpCode = this._generateSecureCode(6);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      try {
        await supabaseFetch('cash_operations', {
          method: 'POST',
          body: JSON.stringify({
            otp_code: otpCode,
            client_phone: clientIdentifier,
            amount: amount,
            fee: Math.max(50, Math.round(amount * 0.005)),
            op_type: 'WITHDRAWAL',
            status: 'pending',
            expires_at: expiresAt
          })
        });
      } catch (e) {
        console.warn("[SwitchAPI] Enregistrement demande retrait OTP :", e.message);
      }

      // Notification immédiate pour le client
      this.addClientNotification({
        id: `OTP-REQ-${Date.now()}`,
        cat: 'sec',
        title: `Code Secret de Retrait : ${otpCode}`,
        time: "À l'instant",
        amount: `-${amount.toLocaleString('fr-FR')} FCFA`,
        description: `Un agent a initié un retrait de ${amount.toLocaleString('fr-FR')} FCFA au Guichet Switch Saint-Michel. Communiquez votre code secret ${otpCode} à l'agent.`,
        extras: {
          amount: `${amount.toLocaleString('fr-FR')} FCFA`,
          source: "Kiosque Switch Saint-Michel (AGT-4092)",
          ref: `OTP #${otpCode}`,
          date: "À l'instant"
        }
      });

      localStorage.setItem('switch_active_withdrawal_otp', otpCode);
      localStorage.setItem('switch_active_withdrawal_amt', amount.toString());
      localStorage.setItem('switch_active_withdrawal_target', clientIdentifier);

      return {
        success: true,
        otp_code: otpCode,
        amount: amount,
        client: clientIdentifier
      };
    },

    /**
     * 3.2 Vérifie si une demande de retrait OTP est en attente pour le client
     */
    checkPendingWithdrawalForClient: async function (clientPhone) {
      const targetPhone = clientPhone || localStorage.getItem('switch_user_phone_raw') || localStorage.getItem('switch_account_number') || '+229 01 90 75 17 86';
      const cleanDigits = targetPhone.replace(/\D/g, '');
      const core8 = cleanDigits.slice(-8);

      try {
        const rows = await supabaseFetch(`cash_operations?status=eq.pending&order=created_at.desc&limit=1`);
        if (rows && rows.length > 0) {
          const op = rows[0];
          return { success: true, hasPending: true, ...op };
        }
      } catch (e) {
        console.info("[SwitchAPI] Info check pending withdrawal :", e.message);
      }

      const localOtp = localStorage.getItem('switch_active_withdrawal_otp');
      if (localOtp) {
        return {
          success: true,
          hasPending: true,
          otp_code: localOtp,
          amount: parseInt(localStorage.getItem('switch_active_withdrawal_amt') || '10000', 10)
        };
      }

      return { success: true, hasPending: false };
    },

    /**
     * 4. Opération Guichet Agent : Dépôt (Cash-In) & Retrait (Cash-Out) via Code OTP ou Compte
     */
    processAgentCash: async function (clientPhoneOrOtp, amount, opType = 'WITHDRAWAL') {
      const curFloat = parseInt((localStorage.getItem('switch_agent_float') || '1500000').replace(/\s/g, ''), 10);
      const curComm = parseInt((localStorage.getItem('switch_agent_commissions') || '48500').replace(/\s/g, ''), 10);
      const commission = Math.max(100, Math.round(amount * 0.008));

      try {
        const data = await supabaseRPC('process_agent_cash_operation', {
          p_client_phone: clientPhoneOrOtp,
          p_amount: amount,
          p_operation_type: opType,
          p_otp_code: (clientPhoneOrOtp && clientPhoneOrOtp.length === 6) ? clientPhoneOrOtp : null
        });

        if (data && data.success) {
          let newFloat = curFloat;
          if (opType === 'DEPOSIT') {
            newFloat = (data.new_agent_float !== undefined) ? parseInt(data.new_agent_float, 10) : Math.max(0, curFloat - amount);
          } else {
            newFloat = (data.new_agent_float !== undefined) ? parseInt(data.new_agent_float, 10) : (curFloat + amount);
          }
          const newComm = (data.new_commissions !== undefined) ? parseInt(data.new_commissions, 10) : (curComm + (data.commission || commission));

          localStorage.setItem('switch_agent_float', newFloat.toString());
          localStorage.setItem('switch_agent_commissions', newComm.toString());
          return { ...data, new_agent_float: newFloat, new_commissions: newComm };
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
      let newFloat = curFloat;
      if (opType === 'DEPOSIT') {
        if (curFloat < amount) {
          return { success: false, message: "Float agent insuffisant pour effectuer ce dépôt." };
        }
        newFloat = Math.max(0, curFloat - amount);
      } else {
        newFloat = curFloat + amount;
      }
      const newComm = curComm + commission;
      localStorage.setItem('switch_agent_float', newFloat.toString());
      localStorage.setItem('switch_agent_commissions', newComm.toString());

      return {
        success: true,
        tx_ref: `TRX-${opType.slice(0, 3)}-` + this._generateSecureCode(5),
        amount: amount,
        commission: commission,
        new_agent_float: newFloat,
        new_commissions: newComm,
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
      const curBal = parseInt(localStorage.getItem('switch_user_balance') || '50000', 10);
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
      const curBal = parseInt(localStorage.getItem('switch_user_balance') || '50000', 10);
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
     * 9. Récupération du Profil Marchand (Solde Boutique, Chiffre d'Affaires du Jour)
     */
    getMerchantDashboard: async function () {
      try {
        const data = await supabaseRPC('get_merchant_dashboard_data', {});
        if (data && data.success) {
          localStorage.setItem('switch_merchant_balance', data.shop_balance.toString());
          localStorage.setItem('switch_merchant_business_name', data.business_name);
          return data;
        }
      } catch (e) {
        console.warn("[SwitchAPI] Merchant Dashboard RPC info :", e.message);
      }

      // Repli local
      const curBal = parseInt((localStorage.getItem('switch_merchant_balance') || '285000').replace(/\s/g, ''), 10);
      return {
        success: true,
        business_name: localStorage.getItem('switch_merchant_business_name') || "Boutique & Restaurant La Plage",
        ifu: "1202019283719",
        phone: "+229 01 95 00 22 33",
        shop_balance: curBal,
        qr_code_id: "SW-MCH-8820",
        today_sales_count: 18,
        today_turnover: 142500
      };
    },

    /**
     * 10. Gestion du Catalogue Produits
     */
    getProducts: async function () {
      try {
        const rows = await supabaseFetch('products?select=*&is_active=eq.true&order=created_at.desc');
        if (rows && Array.isArray(rows) && rows.length > 0) {
          return { success: true, products: rows };
        }
      } catch (e) {
        console.warn("[SwitchAPI] Fetch Products info :", e.message);
      }

      // Repli local
      const stored = localStorage.getItem('switch_merchant_products');
      if (stored) {
        try { return { success: true, products: JSON.parse(stored) }; } catch (e) {}
      }

      return {
        success: true,
        products: [
          { id: "p-01", name: "Jus d'Ananas Naturel 1L", price: 1500, stock_quantity: 45, category: "Boissons" },
          { id: "p-02", name: "Riz Parfumé Local 5kg", price: 4500, stock_quantity: 20, category: "Alimentation" },
          { id: "p-03", name: "Pack 6 Savons Bio Coco", price: 2000, stock_quantity: 35, category: "Hygiène" }
        ]
      };
    },

    /**
     * 11. Encaissement Caisse POS (Décrémentation Stock + Paiement)
     */
    processPosSale: async function (items, paymentMethod = 'switch', customerPhone = null, note = "Vente Caisse POS") {
      try {
        const data = await supabaseRPC('process_pos_sale', {
          p_items: items,
          p_payment_method: paymentMethod,
          p_customer_phone: customerPhone,
          p_note: note
        });
        if (data && data.success) {
          return data;
        } else if (data && data.success === false) {
          return data;
        }
      } catch (e) {
        if (!cfg.OFFLINE_FALLBACK) {
          return { success: false, message: e.message || "Erreur lors de l'encaissement POS." };
        }
        console.warn("[SwitchAPI] POS Sale RPC info :", e.message);
      }

      // Repli local
      const totalAmount = items.reduce((sum, it) => sum + (it.unit_price * it.quantity), 0);
      const curBal = parseInt((localStorage.getItem('switch_merchant_balance') || '285000').replace(/\s/g, ''), 10);
      const newBal = curBal + totalAmount;
      localStorage.setItem('switch_merchant_balance', newBal.toString());

      return {
        success: true,
        tx_ref: "SW-POS-" + this._generateSecureCode(6),
        total_amount: totalAmount,
        payment_method: paymentMethod,
        items_count: items.length
      };
    },

    /**
     * 12. Virement des Encaissements Marchand (Payout vers Compte Personnel)
     */
    withdrawMerchantFunds: async function (amount) {
      try {
        const data = await supabaseRPC('withdraw_merchant_funds', {
          p_amount: amount
        });
        if (data && data.success) {
          localStorage.setItem('switch_merchant_balance', data.remaining_shop_balance.toString());
          return data;
        } else if (data && data.success === false) {
          return data;
        }
      } catch (e) {
        if (!cfg.OFFLINE_FALLBACK) {
          return { success: false, message: e.message || "Erreur lors du virement des encaissements." };
        }
        console.warn("[SwitchAPI] Merchant Payout RPC info :", e.message);
      }

      // Repli local
      const curBal = parseInt((localStorage.getItem('switch_merchant_balance') || '285000').replace(/\s/g, ''), 10);
      if (curBal < amount) {
        return { success: false, message: "Solde de caisse boutique insuffisant." };
      }
      const newBal = curBal - amount;
      localStorage.setItem('switch_merchant_balance', newBal.toString());
      const curUserBal = parseInt(localStorage.getItem('switch_user_balance') || '50000', 10);
      localStorage.setItem('switch_user_balance', (curUserBal + amount).toString());

      return {
        success: true,
        tx_ref: "SW-PAYOUT-" + this._generateSecureCode(6),
        amount: amount,
        remaining_shop_balance: newBal
      };
    },

    /**
     * 13. Gestion du Coffre d'Épargne (Dépôt / Déblocage)
     */
    manageVault: async function (action, amount, title = "Mon Coffre Projet", target = 100000, unlockDate = null) {
      try {
        const data = await supabaseRPC('manage_vault', {
          p_action: action,
          p_amount: amount,
          p_title: title,
          p_target: target,
          p_unlock_date: unlockDate
        });
        if (data && data.success) {
          localStorage.setItem('switch_user_balance', data.new_main_balance.toString());
          localStorage.setItem('switch_user_vault', data.new_vault_locked_total.toString());
          return data;
        } else if (data && data.success === false) {
          return data;
        }
      } catch (e) {
        if (!cfg.OFFLINE_FALLBACK) {
          return { success: false, message: e.message || "Erreur lors de la gestion du coffre." };
        }
        console.warn("[SwitchAPI] Vault RPC info :", e.message);
      }

      // Repli local
      const curBal = parseInt(localStorage.getItem('switch_user_balance') || '50000', 10);
      const curVault = parseInt(localStorage.getItem('switch_user_vault') || '25000', 10);
      let newBal = curBal;
      let newVault = curVault;

      if (action.toLowerCase() === 'deposit') {
        if (curBal < amount) return { success: false, message: "Solde principal insuffisant pour alimenter le coffre." };
        newBal = curBal - amount;
        newVault = curVault + amount;
      } else {
        if (curVault < amount) return { success: false, message: "Solde verrouillé dans le coffre insuffisant." };
        newBal = curBal + amount;
        newVault = curVault - amount;
      }

      localStorage.setItem('switch_user_balance', newBal.toString());
      localStorage.setItem('switch_user_vault', newVault.toString());

      return {
        success: true,
        tx_ref: "SW-VAULT-" + this._generateSecureCode(6),
        action: action.toUpperCase(),
        amount: amount,
        new_vault_locked_total: newVault,
        new_main_balance: newBal
      };
    },

    /**
     * 14. Cotisation Tontine Digitale
     */
    contributeTontine: async function (tontineId, amount) {
      try {
        const data = await supabaseRPC('contribute_tontine', {
          p_tontine_id: tontineId || '00000000-0000-0000-0000-000000000001',
          p_amount: amount
        });
        if (data && data.success) {
          localStorage.setItem('switch_user_balance', data.new_balance.toString());
          return data;
        } else if (data && data.success === false) {
          return data;
        }
      } catch (e) {
        if (!cfg.OFFLINE_FALLBACK) {
          return { success: false, message: e.message || "Erreur lors de la cotisation tontine." };
        }
        console.warn("[SwitchAPI] Tontine RPC info :", e.message);
      }

      // Repli local
      const curBal = parseInt(localStorage.getItem('switch_user_balance') || '50000', 10);
      if (curBal < amount) return { success: false, message: "Solde insuffisant pour cotiser à la tontine." };
      const newBal = curBal - amount;
      localStorage.setItem('switch_user_balance', newBal.toString());

      return {
        success: true,
        tx_ref: "SW-TONTINE-" + this._generateSecureCode(6),
        amount: amount,
        new_balance: newBal
      };
    },

    /**
     * 15. Règlement Factures & Recharges GSM (SBEE, SONEB, Moov, MTN, Celtiis)
     */
    payBillOrAirtime: async function (serviceType, meterOrPhone, amount, operator = "Switch Utility") {
      try {
        const data = await supabaseRPC('process_bill_or_airtime_payment', {
          p_service_type: serviceType,
          p_meter_or_phone: meterOrPhone,
          p_amount: amount,
          p_operator: operator
        });
        if (data && data.success) {
          localStorage.setItem('switch_user_balance', data.new_balance.toString());
          localStorage.setItem('switch_last_bill_token', data.token);
          return data;
        } else if (data && data.success === false) {
          return data;
        }
      } catch (e) {
        if (!cfg.OFFLINE_FALLBACK) {
          return { success: false, message: e.message || "Erreur lors du règlement de la facture." };
        }
        console.warn("[SwitchAPI] Bill Payment RPC info :", e.message);
      }

      // Repli local
      const curBal = parseInt(localStorage.getItem('switch_user_balance') || '50000', 10);
      if (curBal < amount) return { success: false, message: "Solde insuffisant pour régler ce service." };
      const newBal = curBal - amount;
      localStorage.setItem('switch_user_balance', newBal.toString());
      const token = (serviceType === 'sbee') ? "4819 0294 8102 9481 0294" : "REC-" + this._generateSecureCode(6);
      localStorage.setItem('switch_last_bill_token', token);

      return {
        success: true,
        tx_ref: "SW-BILL-" + this._generateSecureCode(6),
        service_type: serviceType.toUpperCase(),
        amount: amount,
        target: meterOrPhone,
        token: token,
        new_balance: newBal
      };
    },

    /**
     * 16. Mise à niveau du Palier KYC
     */
    upgradeKyc: async function (tier, docType = "CIP", docNumber = "0192837465") {
      try {
        const data = await supabaseRPC('upgrade_kyc_tier', {
          p_tier: tier,
          p_doc_type: docType,
          p_doc_number: docNumber
        });
        if (data && data.success) {
          localStorage.setItem('switch_kyc_level', tier.toString());
          return data;
        }
      } catch (e) {
        console.warn("[SwitchAPI] KYC RPC info :", e.message);
      }

      localStorage.setItem('switch_kyc_level', tier.toString());
      return {
        success: true,
        new_kyc_tier: tier,
        doc_type: docType,
        message: "Profil vérifié au Niveau " + tier
      };
    },

    /**
     * 18. Gestion Dynamique des Notifications en Direct (Synchronisation Cloud Supabase)
     */
    fetchClientNotifications: async function () {
      try {
        // 1. Récupérer les données réelles et les transactions depuis Supabase
        const wallet = await this.getWallet();
        const txs = (wallet && wallet.transactions) ? wallet.transactions : [];

        const dynamicNotifs = [];

        // 2. Transformer chaque transaction Supabase en notification
        txs.forEach((t, i) => {
          const isDeposit = t.category === 'agent_deposit' || (t.amount > 0 && (t.title && t.title.toLowerCase().includes('dépôt')));
          const amtVal = Math.abs(t.amount || 0);
          const amtStr = (isDeposit || t.amount > 0 ? "+" : "-") + amtVal.toLocaleString('fr-FR') + " FCFA";

          dynamicNotifs.push({
            id: t.id || `TX-NOTIF-${i}`,
            cat: "trans",
            title: isDeposit ? "Dépôt d'Espèces Reçu avec Succès" : (t.title || "Transaction Switch"),
            time: t.date || "À l'instant",
            unread: i === 0, // La dernière transaction est non-lue
            amount: amtStr,
            description: isDeposit 
              ? `Vous avez reçu un dépôt d'espèces de ${amtStr} au Kiosque Switch Saint-Michel (Agent AGT-4092).`
              : `${t.title || "Opération"}: ${amtStr}. Référence ${t.id}.`,
            extras: {
              amount: amtStr,
              source: isDeposit ? "Kiosque Switch Saint-Michel (AGT-4092)" : "Application Switch Bénin",
              ref: t.id ? (t.id.startsWith('#') ? t.id : '#' + t.id) : "#TRX-SW",
              date: t.date || "Aujourd'hui"
            }
          });
        });

        // Ajouter alertes de sécurité & offres
        dynamicNotifs.push({
          id: "SEC-NOTIF-1",
          cat: "sec",
          title: "Alerte Sécurité Compte",
          time: "Aujourd'hui",
          unread: false,
          description: "Connexion sécurisée et conforme enregistrée sur votre compte Switch Bénin.",
          extras: {
            source: "Système de Sécurité Switch Bénin",
            ref: "#SEC-LOG-9148",
            date: "Aujourd'hui"
          }
        });

        dynamicNotifs.push({
          id: "PROMO-NOTIF-1",
          cat: "promo",
          title: "Dépôts 0% en Kiosques Switch",
          time: "Hier",
          unread: false,
          description: "Profitez de 0% de frais sur tous vos dépôts d'espèces dans les +500 points relais agréés du Bénin.",
          extras: {
            source: "Réseau National Switch Bénin",
            ref: "#OFFER-0PCT",
            date: "Hier"
          }
        });

        localStorage.setItem('switch_user_notifications', JSON.stringify(dynamicNotifs));
        return dynamicNotifs;
      } catch (e) {
        console.warn("[SwitchAPI] Erreur synchro notifications cloud :", e.message);
        return this.getClientNotifications();
      }
    },

    getClientNotifications: function () {
      try {
        const raw = localStorage.getItem('switch_user_notifications');
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return [];
    },

    addClientNotification: function (notif) {
      const list = this.getClientNotifications();
      const newNotif = {
        id: notif.id || `NOTIF-${Date.now()}`,
        cat: notif.cat || "trans",
        title: notif.title || "Notification Switch",
        time: notif.time || "À l'instant",
        unread: true,
        amount: notif.amount || "",
        description: notif.description || "",
        extras: notif.extras || {}
      };
      list.unshift(newNotif);
      localStorage.setItem('switch_user_notifications', JSON.stringify(list));
      localStorage.setItem('switch_user_has_unread_notif', 'true');
      return newNotif;
    },

    fetchAgentNotifications: async function () {
      try {
        const rows = await supabaseFetch(`transactions?order=created_at.desc&limit=15`);
        const dynamicNotifs = [];

        if (rows && rows.length > 0) {
          rows.forEach((t, i) => {
            const isDeposit = t.transaction_type === 'agent_deposit' || (t.title && t.title.toLowerCase().includes('dépôt'));
            const isWithdrawal = t.transaction_type === 'agent_withdrawal' || (t.title && t.title.toLowerCase().includes('retrait'));
            const commVal = t.fee || Math.max(100, Math.round((t.amount || 0) * 0.008));
            const dateStr = t.created_at ? (new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' • ' + new Date(t.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })) : "À l'instant";

            if (isDeposit || isWithdrawal) {
              dynamicNotifs.push({
                id: t.tx_ref || `AGT-TX-${i}`,
                cat: "comm",
                title: isDeposit ? "Dépôt d'espèces client exécuté" : "Retrait d'espèces client validé",
                time: dateStr,
                unread: i === 0,
                amount: `+${commVal.toLocaleString('fr-FR')} FCFA`,
                description: isDeposit
                  ? `Dépôt de ${(t.amount || 0).toLocaleString('fr-FR')} FCFA exécuté avec succès pour ${t.recipient_phone || 'Camero Kuassis'}. Commission : +${commVal} FCFA.`
                  : `Décaissement de ${(t.amount || 0).toLocaleString('fr-FR')} FCFA validé pour ${t.sender_phone || 'Client Switch'}. Commission : +${commVal} FCFA.`,
                extras: {
                  amount: `${(t.amount || 0).toLocaleString('fr-FR')} FCFA`,
                  commission: `+${commVal.toLocaleString('fr-FR')} FCFA`,
                  client: t.recipient_phone || t.sender_phone || 'Camero Kuassis (01907517868150)',
                  ref: t.tx_ref ? (t.tx_ref.startsWith('#') ? t.tx_ref : '#' + t.tx_ref) : `#TRX-DEP-${i}`,
                  date: dateStr
                }
              });
            }
          });
        }

        // Alertes permanentes de trésorerie & sécurité
        dynamicNotifs.push({
          id: "AGT-NOTIF-FLOAT",
          cat: "float",
          title: "Trésorerie Float Guichet Active",
          time: "Aujourd'hui",
          unread: false,
          description: "Votre trésorerie float de caisse est active et opérationnelle pour servir les clients du réseau.",
          extras: {
            source: "Trésorerie Switch Bénin",
            ref: "#FLOAT-OK",
            date: "Aujourd'hui"
          }
        });

        dynamicNotifs.push({
          id: "AGT-NOTIF-SEC",
          cat: "sec",
          title: "Alerte Sécurité Session Guichet",
          time: "Aujourd'hui",
          unread: false,
          description: "Session de caisse active et vérifiée sur terminal agréé Switch Bénin (AGT-4092).",
          extras: {
            source: "Sécurité Switch Bénin",
            ref: "#SEC-AGT-4092",
            date: "Aujourd'hui"
          }
        });

        localStorage.setItem('switch_agent_notifications', JSON.stringify(dynamicNotifs));
        return dynamicNotifs;
      } catch (e) {
        console.warn("[SwitchAPI] Erreur synchro notifications agent cloud :", e.message);
        return this.getAgentNotifications();
      }
    },

    getAgentNotifications: function () {
      try {
        const raw = localStorage.getItem('switch_agent_notifications');
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return [];
    },

    addAgentNotification: function (notif) {
      const list = this.getAgentNotifications();
      const newNotif = {
        id: notif.id || `AGT-NOTIF-${Date.now()}`,
        cat: notif.cat || "comm",
        title: notif.title || "Alerte Guichet",
        time: notif.time || "À l'instant",
        unread: true,
        amount: notif.amount || "",
        description: notif.description || "",
        extras: notif.extras || {}
      };
      list.unshift(newNotif);
      localStorage.setItem('switch_agent_notifications', JSON.stringify(list));
      localStorage.setItem('switch_agent_has_unread_notif', 'true');
      return newNotif;
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
