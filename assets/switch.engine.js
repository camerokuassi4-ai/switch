/**
 * switch.engine.js
 * ─────────────────────────────────────────────────────────────
 * Moteur de Réalisme & État Global Interactif — Switch Bénin
 * 
 * Fonctionnalités :
 * 1. Synchronisation automatique des soldes (Compte Principal, Coffre Vault, Carte Visa)
 * 2. Générateur et historique dynamique de transactions réelles
 * 3. Sons d'interface & Retours Haptiques (Web Audio API synth + Vibrate)
 * 4. Toasts / Bannières de notification in-app animées
 * 5. Masquage universel du solde (Mode Confidentialité 👁️)
 * 6. Gestion du niveau KYC (Niveau 1, Niveau 2 Vérifié, Niveau 3 VIP)
 * ─────────────────────────────────────────────────────────────
 */

(function (window) {
  "use strict";

  const DEFAULT_STATE = {
    user: {
      name: "Adele Doe",
      phone: "+229 97 12 34 56",
      avatar: "../assets/images/img_046.jpg",
      tag: "@adele.switch",
      kycLevel: "2", // '1', '2', '3'
      kycVerified: true,
      nin: "12345678901234",
      cip: "229-987654321"
    },
    balances: {
      main: 50000,
      vault: 0,
      card: 0,
      points: 500
    },
    isPrivacyMode: false,
    transactions: [
      {
        id: "SW-8921",
        title: "Transfert à Maman (Awa GBEGNON)",
        category: "transfer",
        amount: -5000,
        fee: 0,
        date: "Aujourd'hui • 14:32",
        timestamp: Date.now() - 3600000 * 2,
        status: "success",
        recipient: "Maman (Awa GBEGNON)",
        phone: "+229 95 00 00 00",
        note: "Dépense de maison",
        icon: "send",
        iconBg: "bg-indigo-50 text-indigo-700"
      },
      {
        id: "SW-8920",
        title: "Recharge Forfait MTN Data 5 Go",
        category: "telecom",
        amount: -2000,
        fee: 0,
        date: "Hier • 19:15",
        timestamp: Date.now() - 3600000 * 20,
        status: "success",
        recipient: "MTN Bénin (+229 97 12 34 56)",
        note: "Forfait Maxi Data 30j",
        icon: "cell_tower",
        iconBg: "bg-amber-50 text-amber-800"
      },
      {
        id: "SW-8919",
        title: "Dépôt Espèces Kiosque Switch Akpakpa",
        category: "deposit",
        amount: 50000,
        fee: 0,
        date: "23 Août • 11:05",
        timestamp: Date.now() - 3600000 * 48,
        status: "success",
        recipient: "Kiosque Switch 042 (Akpakpa)",
        note: "Recharge compte principal",
        icon: "add_circle",
        iconBg: "bg-emerald-50 text-emerald-700"
      },
      {
        id: "SW-8918",
        title: "Recharge SBEE Compteur Électrique",
        category: "utility",
        amount: -10000,
        fee: 0,
        date: "21 Août • 08:40",
        timestamp: Date.now() - 3600000 * 96,
        status: "success",
        recipient: "SBEE Prépayé (1428 5930 192)",
        token: "5829-1940-5821-9402",
        note: "Recharge 45 kWh",
        icon: "bolt",
        iconBg: "bg-amber-50 text-amber-600"
      },
      {
        id: "SW-8917",
        title: "Cotisation Tontine Solidarité+",
        category: "tontine",
        amount: -15000,
        fee: 0,
        date: "18 Août • 17:00",
        timestamp: Date.now() - 3600000 * 140,
        status: "success",
        recipient: "Tontine Solidarité+ (Tour 4)",
        note: "Cotisation mensuelle",
        icon: "groups",
        iconBg: "bg-purple-50 text-purple-700"
      }
    ],
    notifications: [
      {
        id: "notif-1",
        title: "Transfert reçu ⚡",
        message: "Koffi ADEBAYO vous a envoyé 15 000 FCFA sans frais.",
        time: "Il y a 2h",
        read: false,
        icon: "savings",
        iconColor: "text-emerald-600"
      },
      {
        id: "notif-2",
        title: "Intérêts Coffre Vault crédités 📈",
        message: "+187 FCFA d'intérêts mensuels ajoutés à votre coffre (5%/an).",
        time: "Hier",
        read: true,
        icon: "trending_up",
        iconColor: "text-primary"
      },
      {
        id: "notif-3",
        title: "Sécurité & Niveau 2 Actif 🔒",
        message: "Votre compte Switch est vérifié avec un plafond de 2 000 000 FCFA.",
        time: "Il y a 3j",
        read: true,
        icon: "verified_user",
        iconColor: "text-blue-600"
      }
    ]
  };

  class SwitchEngine {
    constructor() {
      this.initStorage();
      this.audioCtx = null;
    }

    initStorage() {
      if (!localStorage.getItem("switch_initialized_v2")) {
        localStorage.setItem("switch_user_name", DEFAULT_STATE.user.name);
        localStorage.setItem("switch_user_phone", DEFAULT_STATE.user.phone);
        localStorage.setItem("switch_user_avatar", DEFAULT_STATE.user.avatar);
        localStorage.setItem("switch_kyc_level", DEFAULT_STATE.user.kycLevel);
        localStorage.setItem("switch_user_balance", DEFAULT_STATE.balances.main.toString());
        localStorage.setItem("switch_vault_balance", DEFAULT_STATE.balances.vault.toString());
        localStorage.setItem("switch_card_balance", DEFAULT_STATE.balances.card.toString());
        localStorage.setItem("switch_user_points", DEFAULT_STATE.balances.points.toString());
        localStorage.setItem("switch_transactions", JSON.stringify(DEFAULT_STATE.transactions));
        localStorage.setItem("switch_notifications", JSON.stringify(DEFAULT_STATE.notifications));
        localStorage.setItem("switch_privacy_mode", "false");
        localStorage.setItem("switch_initialized_v2", "true");
      }
    }

    // ── GESTIONNAIRES UTILISATEUR & SOLDES ──────────────────────

    getMainBalance() {
      return parseInt(localStorage.getItem("switch_user_balance") || "125000", 10);
    }

    getVaultBalance() {
      return parseInt(localStorage.getItem("switch_vault_balance") || "45000", 10);
    }

    getCardBalance() {
      return parseInt(localStorage.getItem("switch_card_balance") || "18500", 10);
    }

    getUser() {
      return {
        name: localStorage.getItem("switch_user_name") || DEFAULT_STATE.user.name,
        phone: localStorage.getItem("switch_user_phone") || DEFAULT_STATE.user.phone,
        avatar: localStorage.getItem("switch_user_avatar") || DEFAULT_STATE.user.avatar,
        tag: localStorage.getItem("switch_user_tag") || DEFAULT_STATE.user.tag,
        kycLevel: localStorage.getItem("switch_kyc_level") || DEFAULT_STATE.user.kycLevel
      };
    }

    updateMainBalance(amountDelta) {
      let current = this.getMainBalance();
      current += amountDelta;
      if (current < 0) current = 0;
      localStorage.setItem("switch_user_balance", current.toString());
      this.syncUI();
      return current;
    }

    // ── TRANSACTIONS RÉELLES ────────────────────────────────────

    getTransactions() {
      try {
        const raw = localStorage.getItem("switch_transactions");
        return raw ? JSON.parse(raw) : DEFAULT_STATE.transactions;
      } catch (e) {
        return DEFAULT_STATE.transactions;
      }
    }

    addTransaction(txData) {
      const txList = this.getTransactions();
      const newTx = {
        id: "SW-" + Math.floor(1000 + Math.random() * 9000),
        title: txData.title || "Opération Switch",
        category: txData.category || "transfer",
        amount: txData.amount || 0,
        fee: txData.fee !== undefined ? txData.fee : 0,
        date: "Aujourd'hui • " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        status: "success",
        recipient: txData.recipient || "Switch Bénin",
        phone: txData.phone || "",
        note: txData.note || "",
        icon: txData.icon || "payments",
        iconBg: txData.iconBg || (txData.amount < 0 ? "bg-purple-50 text-primary" : "bg-emerald-50 text-emerald-700")
      };

      txList.unshift(newTx);
      localStorage.setItem("switch_transactions", JSON.stringify(txList.slice(0, 30)));

      // Mettre à jour le solde
      if (txData.amount) {
        this.updateMainBalance(txData.amount);
      }

      // Déclencher les retours sensoriels
      this.playSound("success");
      this.haptic([40, 60, 40]);
      this.showToast("✓ " + newTx.title + " (" + Math.abs(newTx.amount).toLocaleString("fr-FR") + " F)", "success");

      // Sauvegarder pour l'écran de confirmation
      localStorage.setItem("switch_last_tx_id", newTx.id);
      localStorage.setItem("switch_last_tx_amount", Math.abs(newTx.amount).toString());
      localStorage.setItem("switch_last_tx_recipient", newTx.recipient);
      localStorage.setItem("switch_last_tx_phone", newTx.phone);
      localStorage.setItem("switch_last_tx_note", newTx.note);

      return newTx;
    }

    // ── SONS & HAPTIQUES (Web Audio API Synthèse Native) ────────

    playSound(type = "click") {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        if (!this.audioCtx) this.audioCtx = new AudioContext();
        if (this.audioCtx.state === "suspended") this.audioCtx.resume();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        const now = this.audioCtx.currentTime;

        if (type === "success") {
          // Double note harmonieuse majeure
          osc.type = "sine";
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
        } else if (type === "error") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.linearRampToValueAtTime(160, now + 0.2);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else {
          // Click doux
          osc.type = "sine";
          osc.frequency.setValueAtTime(800, now);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
        }
      } catch (e) {
        // Ignorer silencieusement si bloqué par l'autoplay browser
      }
    }

    haptic(pattern = [25]) {
      if ("vibrate" in navigator) {
        try {
          navigator.vibrate(pattern);
        } catch (e) {}
      }
    }

    // ── TOAST NOTIFICATION FLOTTANTE IN-APP ─────────────────────

    showToast(message, type = "info") {
      let toastContainer = document.getElementById("switch-toast-container");
      if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "switch-toast-container";
        toastContainer.style.cssText = "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:99999;width:92%;max-width:440px;pointer-events:none;display:flex;flex-direction:column;gap:8px;";
        document.body.appendChild(toastContainer);
      }

      const toast = document.createElement("div");
      toast.style.cssText = "background:#1C1A24;color:#FFFFFF;padding:12px 18px;border-radius:18px;font-family:'Hanken Grotesk',sans-serif;font-size:13px;font-weight:700;box-shadow:0 12px 32px rgba(0,0,0,0.25);display:flex;align-items:center;gap:10px;pointer-events:auto;animation:switchToastIn 0.3s cubic-bezier(0.4,0,0.2,1) forwards;border:1px solid rgba(255,255,255,0.12);";

      let icon = "info";
      let iconColor = "#CABEFF";
      if (type === "success") {
        icon = "check_circle";
        iconColor = "#4ADE80";
      } else if (type === "error") {
        icon = "error";
        iconColor = "#F87171";
      }

      toast.innerHTML = `
        <span class="material-symbols-outlined" style="color:${iconColor};font-size:20px;">${icon}</span>
        <span style="flex:1;">${message}</span>
      `;

      toastContainer.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = "switchToastOut 0.3s cubic-bezier(0.4,0,0.2,1) forwards";
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }

    // ── SYNCHRONISATION UNIVERSELLE DU DOM ──────────────────────

    syncUI() {
      const mainBal = this.getMainBalance();
      const isHidden = localStorage.getItem("switch_privacy_mode") === "true";
      const formattedMain = isHidden ? "••••••" : mainBal.toLocaleString("fr-FR");

      // 1. Header pills
      document.querySelectorAll("#user-balance-display, #header-user-balance, .switch-user-balance-pill").forEach(el => {
        el.textContent = formattedMain + (isHidden ? " F" : " F");
      });

      // 2. Main hero balance
      const mainBalText = document.getElementById("main-balance-text");
      if (mainBalText) {
        if (isHidden) {
          mainBalText.innerHTML = "•••••• <span class=\"text-lg sm:text-xl font-bold font-sans text-purple-200\">FCFA</span>";
        } else {
          mainBalText.innerHTML = formattedMain + " <span class=\"text-lg sm:text-xl font-bold font-sans text-purple-200\">FCFA</span>";
        }
      }

      // 3. User name / avatar
      const user = this.getUser();
      document.querySelectorAll(".switch-user-name, [data-user-name]").forEach(el => {
        el.textContent = user.name;
      });
    }
  }

  // Inject CSS animations for Toast
  const style = document.createElement("style");
  style.textContent = `
    @keyframes switchToastIn {
      from { opacity: 0; transform: translateY(-16px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes switchToastOut {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to { opacity: 0; transform: translateY(-16px) scale(0.95); }
    }
  `;
  document.head.appendChild(style);

  // Global instance
  window.SwitchEngine = new SwitchEngine();

  // Auto-sync on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.SwitchEngine.syncUI());
  } else {
    window.SwitchEngine.syncUI();
  }

})(window);
