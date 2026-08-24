/**
 * switch.forms.js
 * ─────────────────────────────────────────────────────────────
 * Correctif de navigation pour les écrans à saisie — App Switch
 *
 * Gère 3 cas non couverts par switch.router.js :
 *  1. Claviers PIN (4 chiffres) → navigation auto au 4e chiffre
 *  2. Saisie OTP (6 champs) → navigation auto quand tous remplis
 *  3. Formulaires avec type="submit" → interception et navigation
 *
 * Ce fichier est auto-détectant : chaque fix s'active uniquement
 * si les éléments cibles existent dans le DOM courant.
 * ─────────────────────────────────────────────────────────────
 */

/* global tailwind */

(function () {
  "use strict";

  // Mapping écran → destination après soumission réussie
  // Clé = dernier segment du pathname (nom du dossier)
  const SUBMIT_TARGETS = {
    // Auth
    "inscription":              "../v_rification_otp/code.html",
    "connexion":                "../tableau_de_bord_mis_jour/code.html",
    "v_rification_otp":         "../cr_ation_code_pin/code.html",
    "cr_ation_code_pin":        "../tableau_de_bord_mis_jour/code.html",
    "verrouillage_pin":         "../tableau_de_bord_mis_jour/code.html",

    // Marchand
    "inscription_marchand":     "../v_rification_marchand/code.html",
    "v_rification_marchand":    "../tableau_de_bord_marchand/code.html",

    // Agent
    "inscription_agent_switch": "../tableau_de_bord_agent/code.html",

    // Formulaires de paramètres / profil
    "modifier_le_profil":       "../profil_utilisateur/code.html",
    "param_tres_et_profil_agent":"../tableau_de_bord_agent/code.html",

    // Formulaires de transactions (montant + soumission)
    "transfert_switch_switch":  "../confirmation_de_l_op_ration_code/code.html",
    "transfert_mobile_money":   "../confirmation_de_l_op_ration_code/code.html",
    "d_p_t_de_fonds":           "../confirmation_de_l_op_ration_code/code.html",
    "d_p_t_de_fonds_mis_jour_agent": "../confirmation_de_l_op_ration_code/code.html",
    "retrait_de_fonds":         "../confirmation_de_l_op_ration_code/code.html",
    "retrait_de_fonds_mis_jour_agent": "../confirmation_de_l_op_ration_code/code.html",
    "retrait_marchand":         "../confirmation_de_l_op_ration_code/code.html",
    "conversion_de_devises":    "../confirmation_de_l_op_ration_code/code.html",
    "confirmation_paiement_qr": "../confirmation_de_succ_s/code.html",
    "cr_er_une_tontine":        "../d_tail_de_la_tontine/code.html",
    "cr_er_une_cagnotte":       "../d_tail_de_la_cagnotte/code.html",
    "demande_de_r_approvisionnement_float": "../confirmation_de_succ_s/code.html",
    "valider_une_op_ration_client": "../confirmation_de_succ_s/code.html",
    "simulateur_de_frais":      "../simulateur_de_frais/code.html",
  };

  // ── UTILITAIRES ────────────────────────────────────────────

  function getCurrentScreen() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i] && parts[i] !== "code.html") return parts[i];
    }
    return null;
  }

  function navigateTo(target) {
    if (!target) return;
    if (typeof window.switchNavigate === "function") {
      window.switchNavigate(target);
    } else {
      window.location.href = target;
    }
  }

  function flashSuccess(elements, callback) {
    if (callback) callback();
  }

  // ── FIX 1 : CLAVIERS PIN ───────────────────────────────────
  // Détecte les claviers numériques (grille de boutons 0-9)
  // et injecte la navigation quand le 4e chiffre est saisi.

  function fixPinKeypad(destination) {
    const dots = document.querySelectorAll(".pin-dot");
    if (!dots || dots.length === 0) return; // Pas un écran PIN

    const keypadBtns = document.querySelectorAll(
      ".grid button, [class*='keypad'] button, .grid > button"
    );
    if (!keypadBtns || keypadBtns.length === 0) return;

    // Compter les points déjà remplis au chargement
    let pinCount = 0;
    dots.forEach(function (dot) {
      if (
        dot.classList.contains("active") ||
        dot.classList.contains("bg-primary") ||
        dot.style.backgroundColor === "rgb(94, 59, 220)"
      ) {
        pinCount++;
      }
    });

    // Observer les changements sur les dots via MutationObserver
    // (le script original de Stitch modifie les classes des dots)
    const observer = new MutationObserver(function () {
      let filled = 0;
      dots.forEach(function (dot) {
        if (
          dot.classList.contains("active") ||
          dot.classList.contains("bg-primary") ||
          dot.style.backgroundColor === "rgb(94, 59, 220)" ||
          dot.style.backgroundColor === "#5e3bdc"
        ) {
          filled++;
        }
      });

      if (filled >= dots.length && dots.length >= 4) {
        observer.disconnect(); // Éviter les déclenchements multiples
        flashSuccess(Array.from(dots), function () {
          navigateTo(destination);
        });
      }
    });

    dots.forEach(function (dot) {
      observer.observe(dot, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    });

    // Fallback : hooker les boutons numériques directement
    // au cas où le MutationObserver ne détecte pas les changements inline
    let hookCount = 0;
    dots.forEach(function (d) {
      if (
        d.classList.contains("active") ||
        d.classList.contains("bg-primary")
      ) hookCount++;
    });

    keypadBtns.forEach(function (btn) {
      btn.addEventListener(
        "click",
        function () {
          // Vérifier après chaque clic si tous les dots sont remplis
          requestAnimationFrame(function () {
            let filled = 0;
            dots.forEach(function (dot) {
              if (
                dot.classList.contains("active") ||
                dot.classList.contains("bg-primary") ||
                dot.style.backgroundColor === "rgb(94, 59, 220)" ||
                dot.style.backgroundColor === "#5e3bdc"
              ) {
                filled++;
              }
            });
            if (filled >= dots.length && dots.length >= 4) {
              observer.disconnect();
              flashSuccess(Array.from(dots), function () {
                navigateTo(destination);
              });
            }
          });
        },
        { capture: true }
      ); // capture:true pour s'exécuter avant le handler Stitch
    });
  }

  // ── FIX 2 : CHAMPS OTP ────────────────────────────────────
  // Écoute le dernier champ OTP : quand il reçoit une valeur,
  // navigue vers la destination.

  function fixOtpInputs(destination) {
    const otpInputs = document.querySelectorAll(
      ".otp-input, input[aria-label*='Chiffre'], #otp-container input"
    );
    if (!otpInputs || otpInputs.length === 0) return;

    const lastInput = otpInputs[otpInputs.length - 1];

    function checkAllFilled() {
      let allFilled = true;
      otpInputs.forEach(function (inp) {
        if (!inp.value || inp.value.trim() === "") allFilled = false;
      });
      return allFilled;
    }

    // Sur le dernier champ input
    lastInput.addEventListener("input", function () {
      if (lastInput.value && checkAllFilled()) {
        lastInput.blur();
        // Flash léger sur tous les champs
        otpInputs.forEach(function (inp) {
          inp.style.borderColor = "#5e3bdc";
          inp.style.backgroundColor = "#f7f1ff";
        });
        navigateTo(destination);
      }
    });

    // Sur le bouton "Vérifier" / "Confirmer" (fallback)
    const verifyBtn = document.querySelector(
      "button[type='button'], form button, .btn-primary"
    );
    if (verifyBtn) {
      const txt = (verifyBtn.textContent || "").trim().toLowerCase();
      if (
        txt.includes("vérif") ||
        txt.includes("verif") ||
        txt.includes("confirm") ||
        txt.includes("continuer") ||
        txt.includes("valider") ||
        txt.includes("suivant")
      ) {
        verifyBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (checkAllFilled()) {
            navigateTo(destination);
          } else {
            // Signaler les champs vides
            otpInputs.forEach(function (inp) {
              if (!inp.value) {
                inp.style.borderColor = "#ba1a1a";
                inp.style.animation = "shake 0.3s ease";
                setTimeout(function () {
                  inp.style.borderColor = "";
                  inp.style.animation = "";
                }, 600);
              }
            });
            otpInputs[0].focus();
          }
        });
      }
    }
  }

  // ── FIX 3 : FORMULAIRES AVEC SUBMIT ───────────────────────
  // Intercepte les soumissions de formulaires et les boutons
  // de type submit/button principaux pour naviguer.

  function fixForms(destination) {
    // Cas A : balises <form> avec onsubmit="event.preventDefault()"
    const forms = document.querySelectorAll("form");
    forms.forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        navigateTo(destination);
      });
    });

    // Cas B : boutons primaires sans form (type="button" ou type="submit")
    // Heuristique : bouton large (w-full), fond primaire, texte d'action
    const ACTION_TEXTS = [
      "suivant", "continuer", "s'inscrire", "créer", "inscription",
      "soumettre", "envoyer", "valider", "confirmer", "connexion",
      "se connecter", "terminer", "finaliser", "payer", "transférer",
      "retirer", "déposer", "simuler", "calculer", "lancer",
    ];

    const allBtns = document.querySelectorAll(
      "button[type='submit'], button.w-full, button[class*='btn-primary'], " +
      "button[class*='bg-primary'], a.w-full[class*='bg-primary']"
    );

    allBtns.forEach(function (btn) {
      const txt = (btn.textContent || "").trim().toLowerCase();
      const matches = ACTION_TEXTS.some(function (t) {
        return txt.includes(t);
      });
      if (matches) {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          navigateTo(destination);
        });
      }
    });
  }

  // ── INITIALISATION ─────────────────────────────────────────

  function init() {
    const screen = getCurrentScreen();
    const destination = SUBMIT_TARGETS[screen];

    if (!destination) {
      // Écran sans destination connue, rien à faire
      return;
    }

    // Appliquer les fixes appropriés selon ce qui est détecté dans le DOM
    fixPinKeypad(destination);
    fixOtpInputs(destination);
    fixForms(destination);
  }

  window.switchInitForms = init;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
