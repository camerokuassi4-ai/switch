/**
 * assets/switch.config.js — Configuration Supabase Cloud Switch Bénin 🇧🇯
 * ─────────────────────────────────────────────────────────────────────────────
 * Renseignez ici l'URL de votre projet Supabase et votre clé publique anonyme (anon key).
 * Vous pouvez retrouver ces informations sur votre dashboard Supabase :
 * 👉 https://supabase.com/dashboard/project/_/settings/api
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  window.SWITCH_CONFIG = {
    // 1. URL de votre projet Supabase (dfzyyawclnxcgykktrbr)
    SUPABASE_URL: window.localStorage.getItem('switch_supabase_url') || "https://dfzyyawclnxcgykktrbr.supabase.co",

    // 2. Clé d'API publique anonyme (anon public key)
    SUPABASE_ANON_KEY: "sb_publishable_w1Bk1r74psAg-e03Xn4Wog_RhepjXG5",

    // 3. Mode de fonctionnement
    OFFLINE_FALLBACK: false, // Strictement bloquant : les erreurs Supabase RPC affichent de vraies erreurs et ne basculent plus sur localStorage
    DEMO_ONSCREEN_OTP: true, // Mode démo BCEAO : affiche l'OTP sécurisé généré directement à l'écran (sans SMS réel)
    INITIAL_TEST_BALANCE: 0, // Solde initial de départ réel pour les nouveaux comptes (0 FCFA)
    ENV: "production"
  };
})();

/* Identité de l'application mobile */
window.SWITCH_APP_PACKAGE = "merchant";
