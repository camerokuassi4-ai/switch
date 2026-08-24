/**
 * switch.config.js
 * ─────────────────────────────────────────────────────────────
 * Configuration Tailwind CSS centralisée — App Switch (Bénin)
 * Couvre les 3 espaces : Utilisateur, Marchand, Agent
 *
 * Usage dans chaque écran :
 *   <script src="../../assets/switch.config.js"></script>
 *   (à charger APRÈS le CDN tailwindcss)
 *
 * Note : `tailwind` est un global injecté par le CDN Tailwind.
 * Le commentaire ci-dessous supprime l'avertissement de linter.
 * ─────────────────────────────────────────────────────────────
 */

/* global tailwind */

// Garde-fou : ne rien faire si le CDN n'est pas chargé
if (typeof tailwind === "undefined") {
  console.warn("[Switch] switch.config.js chargé avant le CDN Tailwind — config ignorée.");
} else {
  tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {

      // ── COULEURS ─────────────────────────────────────────────
      colors: {
        // Surfaces
        "background":                 "#fdf8ff",
        "surface":                    "#fdf8ff",
        "surface-bright":             "#fdf8ff",
        "surface-dim":                "#ddd8e5",
        "surface-variant":            "#e6e0ee",
        "surface-container-lowest":   "#ffffff",
        "surface-container-low":      "#f7f1ff",
        "surface-container":          "#f1ebf9",
        "surface-container-high":     "#ebe6f3",
        "surface-container-highest":  "#e6e0ee",
        "surface-tint":               "#613ede",

        // On-surfaces
        "on-background":              "#1c1a24",
        "on-surface":                 "#1c1a24",
        "on-surface-variant":         "#484555",
        "inverse-surface":            "#312f39",
        "inverse-on-surface":         "#f4eefc",

        // Contours
        "outline":                    "#797586",
        "outline-variant":            "#c9c4d7",

        // Primaire — Violet Switch
        "primary":                    "#5e3bdc",
        "on-primary":                 "#ffffff",
        "primary-container":          "#7758f6",
        "on-primary-container":       "#fffbff",
        "primary-fixed":              "#e6deff",
        "primary-fixed-dim":          "#cabeff",
        "on-primary-fixed":           "#1c0062",
        "on-primary-fixed-variant":   "#481ac7",
        "inverse-primary":            "#cabeff",

        // Secondaire — Gris neutre
        "secondary":                  "#5f5e5e",
        "on-secondary":               "#ffffff",
        "secondary-container":        "#e5e2e1",
        "on-secondary-container":     "#656464",
        "secondary-fixed":            "#e5e2e1",
        "secondary-fixed-dim":        "#c8c6c5",
        "on-secondary-fixed":         "#1c1b1b",
        "on-secondary-fixed-variant": "#474646",

        // Tertiaire — Gris ardoise (espace Utilisateur/Marchand)
        "tertiary":                   "#5a5c5d",
        "on-tertiary":                "#ffffff",
        "tertiary-container":         "#737576",
        "on-tertiary-container":      "#fcfdfe",
        "tertiary-fixed":             "#e1e3e4",
        "tertiary-fixed-dim":         "#c5c7c8",
        "on-tertiary-fixed":          "#191c1d",
        "on-tertiary-fixed-variant":  "#454748",

        // Erreur
        "error":                      "#ba1a1a",
        "on-error":                   "#ffffff",
        "error-container":            "#ffdad6",
        "on-error-container":         "#93000a",

        // ── Couleurs spécifiques à l'espace Agent ────────────
        "commission-accent":          "#f59e0b",  // Amber — commissions
        "liquidity-high":             "#22c55e",  // Vert — float élevé
        "liquidity-low":              "#ef4444",  // Rouge — float faible
        "surface-agent":              "#fdf8ff",

        // ── Couleurs utilitaires partagées ───────────────────
        "otp-border":                 "#c9c4d7",  // Bordure champs OTP
      },

      // ── BORDER RADIUS ─────────────────────────────────────────
      borderRadius: {
        "DEFAULT": "0.25rem",   //  4px — subtle
        "lg":      "0.5rem",    //  8px — cards standard
        "xl":      "0.75rem",   // 12px — input fields
        "2xl":     "1rem",      // 16px — cards larges
        "3xl":     "1.5rem",    // 24px — hero cards
        "full":    "9999px",    // pill — boutons, nav flottante
      },

      // ── ESPACEMENTS ───────────────────────────────────────────
      spacing: {
        "container-margin": "20px",   // Marges latérales app
        "gutter":           "16px",   // Gouttière entre éléments
        "card-padding":     "24px",   // Padding interne des cartes
        "stack-sm":         "8px",    // Séparation petite
        "stack-md":         "16px",   // Séparation standard
        "stack-lg":         "32px",   // Séparation section
        "otp-gap":          "8px",    // Écart entre cases OTP
        "nav-height":       "72px",   // Hauteur barre nav flottante
        "safe-bottom":      "24px",   // Zone de sécurité bas d'écran
      },

      // ── TYPOGRAPHIE ───────────────────────────────────────────
      fontFamily: {
        "display-lg":        ["Hanken Grotesk", "sans-serif"],
        "display-lg-mobile": ["Hanken Grotesk", "sans-serif"],
        "headline-md":       ["Hanken Grotesk", "sans-serif"],
        "headline-sm":       ["Hanken Grotesk", "sans-serif"],
        "body-lg":           ["Hanken Grotesk", "sans-serif"],
        "body-sm":           ["Hanken Grotesk", "sans-serif"],
        "label-caps":        ["Hanken Grotesk", "sans-serif"],
        "otp-display":       ["Hanken Grotesk", "sans-serif"],
      },

      fontSize: {
        "display-lg":        ["32px", { lineHeight: "40px",  letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg-mobile": ["26px", { lineHeight: "32px",  fontWeight: "700" }],
        "headline-md":       ["20px", { lineHeight: "28px",  fontWeight: "600" }],
        "headline-sm":       ["16px", { lineHeight: "24px",  fontWeight: "600" }],
        "body-lg":           ["16px", { lineHeight: "24px",  fontWeight: "400" }],
        "body-sm":           ["14px", { lineHeight: "20px",  fontWeight: "400" }],
        "label-caps":        ["12px", { lineHeight: "16px",  letterSpacing: "0.05em", fontWeight: "600" }],
        "otp-display":       ["32px", { lineHeight: "40px",  fontWeight: "700" }],
      },

      // ── OMBRES ───────────────────────────────────────────────
      boxShadow: {
        "card":     "0 10px 20px rgba(0,0,0,0.04)",      // Cartes légères
        "nav":      "0 15px 30px rgba(0,0,0,0.15)",      // Nav flottante
        "primary":  "0 10px 20px rgba(94,59,220,0.3)",   // Bouton primaire violet
        "none":     "none",
      },
    },
  },
}; // fin tailwind.config
} // fin else (CDN chargé)
