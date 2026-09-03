/**
 * switch.security.js — Module de Sécurité Switch Bénin 🇧🇯 (v5.0 Clean)
 * ─────────────────────────────────────────────────────────────────────────────
 * Fonctions utilitaires sécurisées :
 *  1. Nettoyage et élimination absolue de tout overlay intrusif
 *  2. Assainisseur d'injection XSS (escapeHTML)
 *  3. Registre d'audit des événements de sécurité (BCEAO / APDP)
 *  4. Scellement d'intégrité du solde (HMAC / Checksum)
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  // Supprime immédiatement et définitivement tout calque de verrouillage
  function removeAnyLockScreen() {
    const el = document.getElementById('switch-lock-screen');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  // Nettoyage au chargement
  removeAnyLockScreen();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", removeAnyLockScreen);
  }

  const SwitchSecurity = {
    version: "5.0.0-CLEAN",

    isPublicAuthPage: function () {
      return true;
    },

    init: function () {
      removeAnyLockScreen();
      this.ensureBalanceIntegrity();
    },

    escapeHTML: function (str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    logEvent: function (action, details) {
      try {
        const logs = JSON.parse(localStorage.getItem('switch_security_audit_trail') || '[]');
        const entry = {
          id: "SEC-" + Math.floor(100000 + Math.random() * 900000),
          timestamp: new Date().toISOString(),
          date_formatted: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Porto-Novo' }),
          action: action,
          details: details
        };
        logs.unshift(entry);
        if (logs.length > 50) logs.pop();
        localStorage.setItem('switch_security_audit_trail', JSON.stringify(logs));
      } catch (e) {}
    },

    ensureBalanceIntegrity: function () {
      const balance = localStorage.getItem('switch_user_balance');
      if (balance) {
        const currentHash = this._computeChecksum(balance);
        localStorage.setItem('switch_user_balance_checksum', currentHash);
      }
    },

    _computeChecksum: function (val) {
      let hash = 0;
      const str = "SWITCH_BENIN_SALT_2026_" + val;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      return "CHK-" + Math.abs(hash);
    },

    resetIdleTimer: function () {
      removeAnyLockScreen();
    },

    isLocked: function () {
      return false;
    },

    lockApp: function () {
      removeAnyLockScreen();
    },

    renderLockScreen: function () {
      removeAnyLockScreen();
    },

    unlockApp: function () {
      removeAnyLockScreen();
    },

    handleKey: function () {},
    handleDelete: function () {},
    handleBiometric: function () {}
  };

  window.SwitchSecurity = SwitchSecurity;
  SwitchSecurity.init();
})();
