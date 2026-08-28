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
        balance: parseInt(localStorage.getItem('switch_user_balance') || '50000', 10),
        vault_balance: parseInt(localStorage.getItem('switch_vault_balance') || '0', 10),
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
      const curUserBal = parseInt(localStorage.getItem('switch_user_balance') || '125000', 10);
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
      const curBal = parseInt(localStorage.getItem('switch_user_balance') || '125000', 10);
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
      const curBal = parseInt(localStorage.getItem('switch_user_balance') || '125000', 10);
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
      const curBal = parseInt(localStorage.getItem('switch_user_balance') || '125000', 10);
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
     * 17. Récupère les points relais GPS (Carte des Agents)
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
