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
      name: "",
      phone: "",
      avatar: null,
      tag: "",
      kycLevel: "1",
      kycVerified: false,
      nin: "",
      cip: ""
    },
    balances: {
      main: 0,
      vault: 0,
      card: 0,
      points: 0
    },
    isPrivacyMode: false,
    transactions: [],
    notifications: []
  };

  class SwitchEngine {
    constructor() {
      this.initStorage();
      this.audioCtx = null;
    }

    initStorage() {
      // Désactivation complète de l'auto-injection de fausses données
      if (!localStorage.getItem("switch_engine_clean_v1")) {
        // Si d'anciennes données factices d'Adele Doe sont présentes, les assainir
        if (localStorage.getItem("switch_user_name") === "Adele Doe") {
          localStorage.removeItem("switch_user_name");
          localStorage.removeItem("switch_user_avatar");
        }
        if (!localStorage.getItem("switch_user_balance")) {
          localStorage.setItem("switch_user_balance", "0");
        }
        if (!localStorage.getItem("switch_vault_balance")) {
          localStorage.setItem("switch_vault_balance", "0");
        }
        if (!localStorage.getItem("switch_card_balance")) {
          localStorage.setItem("switch_card_balance", "0");
        }
        const currentTx = localStorage.getItem("switch_transactions");
        if (!currentTx || currentTx.includes("SW-8921") || currentTx.includes("Maman")) {
          localStorage.setItem("switch_transactions", "[]");
        }
        localStorage.setItem("switch_engine_clean_v1", "true");
      }
    }

    // ── GESTIONNAIRES UTILISATEUR & SOLDES ──────────────────────

    getMainBalance() {
      return parseInt(localStorage.getItem("switch_user_balance") || "0", 10);
    }

    getVaultBalance() {
      return parseInt(localStorage.getItem("switch_vault_balance") || "0", 10);
    }

    getCardBalance() {
      return parseInt(localStorage.getItem("switch_card_balance") || "0", 10);
    }

    getUser() {
      return {
        name: localStorage.getItem("switch_user_fullname") || localStorage.getItem("switch_user_name") || "",
        phone: localStorage.getItem("switch_user_phone") || "",
        avatar: localStorage.getItem("switch_user_avatar") || null,
        tag: localStorage.getItem("switch_user_tag") || "",
        kycLevel: localStorage.getItem("switch_kyc_level") || "1"
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
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        // Filtre de sécurité anti-mock résiduel
        if (Array.isArray(parsed)) {
          return parsed.filter(t => !t.id || (!t.id.startsWith("SW-892") && !t.id.startsWith("SW-891")));
        }
        return [];
      } catch (e) {
        return [];
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
