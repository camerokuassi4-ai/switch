/**
 * switch.router.js
 * ─────────────────────────────────────────────────────────────
 * Moteur de navigation — App Switch (Bénin)
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  "use strict";

  const ROOT = "../";

  const DASHBOARDS = {
    user: ROOT + "tableau_de_bord_mis_jour/code.html",
    merchant: ROOT + "tableau_de_bord_marchand/code.html",
    agent: ROOT + "tableau_de_bord_agent/code.html",
  };
  const DASHBOARD_KEYS = ["tableau_de_bord_mis_jour", "tableau_de_bord_marchand", "tableau_de_bord_agent"];
  const DYNAMIC_DASHBOARD = "__DYNAMIC_DASHBOARD__";

  function getActiveDashboard() {
    const space = sessionStorage.getItem("switchActiveSpace") || "user";
    return DASHBOARDS[space] || DASHBOARDS.user;
  }

  const SCREENS = {
    "accueil_splash_mis_jour": {
      space: "auth", back: null, nav: null,
      actions: { "Commencer": ROOT + "choix_type_compte/code.html", "Se connecter": ROOT + "connexion/code.html" }
    },
    "choix_type_compte": {
      space: "auth", back: null, nav: null,
      actions: {}
    },
    "inscription": {
      space: "auth", back: ROOT + "accueil_splash_mis_jour/code.html", nav: null,
      actions: {
        "Créer mon compte": ROOT + "v_rification_otp/code.html",
        "Se connecter": ROOT + "connexion/code.html",
        "Je suis un marchand": ROOT + "inscription_marchand/code.html",
        "Je suis un agent": ROOT + "inscription_agent_switch/code.html",
      }
    },
    "connexion": {
      space: "auth", back: ROOT + "accueil_splash_mis_jour/code.html", nav: null,
      actions: {
        "Se connecter": ROOT + "verrouillage_pin/code.html",
        "Connexion": ROOT + "verrouillage_pin/code.html",
        "Créer un compte": ROOT + "inscription/code.html",
        "Mot de passe": ROOT + "v_rification_otp/code.html",
      }
    },
    "v_rification_otp": {
      space: "auth", back: ROOT + "inscription/code.html", nav: null,
      actions: { "Vérifier": ROOT + "cr_ation_code_pin/code.html", "Confirmer": ROOT + "cr_ation_code_pin/code.html", "Continuer": ROOT + "cr_ation_code_pin/code.html" }
    },
    "cr_ation_code_pin": {
      space: "auth", back: ROOT + "v_rification_otp/code.html", nav: null,
      actions: { "Créer mon PIN": ROOT + "tableau_de_bord_mis_jour/code.html", "Confirmer": ROOT + "tableau_de_bord_mis_jour/code.html", "Continuer": ROOT + "tableau_de_bord_mis_jour/code.html" }
    },
    "verrouillage_pin": {
      space: "auth", back: ROOT + "connexion/code.html", nav: null,
      actions: { "Valider": ROOT + "tableau_de_bord_mis_jour/code.html", "Confirmer": ROOT + "tableau_de_bord_mis_jour/code.html" }
    },
    "pas_de_connexion": {
      space: "auth", back: null, nav: null,
      actions: { "Réessayer": "javascript:history.back()" }
    },

    "tableau_de_bord_mis_jour": {
      space: "user", back: null, nav: "home",
      actions: {
        "Envoyer": ROOT + "transfert_switch_switch/code.html",
        "Mobile Money": ROOT + "transfert_mobile_money/code.html",
        "Transférer": ROOT + "transfert_switch_switch/code.html",
        "Retrait": ROOT + "retrait_de_fonds/code.html",
        "Retirer": ROOT + "retrait_de_fonds/code.html",
        "Dépôt": ROOT + "d_p_t_de_fonds/code.html",
        "Déposer": ROOT + "d_p_t_de_fonds/code.html",
        "Payer": ROOT + "scanner_qr_code/code.html",
        "Scanner": ROOT + "scanner_qr_code/code.html",
        "Abonnements": ROOT + "paiement_d_abonnements/code.html",
        "Convertir": ROOT + "conversion_de_devises/code.html",
        "Simulateur": ROOT + "simulateur_de_frais/code.html",
        "Cartes virtuelles": ROOT + "achats_en_ligne_cartes_virtuelles/code.html",
        "Localiser": ROOT + "localiser_un_agent_switch/code.html",
        "Tontines": ROOT + "mes_tontines/code.html",
        "Cagnottes": ROOT + "mes_cagnottes/code.html",
        "Notifications": ROOT + "centre_de_notifications/code.html",
      }
    },
    "historique_des_transactions": {
      space: "user", back: null, nav: "history",
      actions: { "Voir tout": ROOT + "historique_des_transactions/code.html" }
    },
    "historique_vide": {
      space: "user", back: null, nav: "history",
      actions: { "Faire un transfert": ROOT + "transfert_switch_switch/code.html" }
    },
    "centre_de_notifications": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: "notifs", actions: {}
    },
    "notifications_vides": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: "notifs", actions: {}
    },
    "profil_utilisateur": {
      space: "user", back: null, nav: "profile",
      actions: {
        "Mes informations": ROOT + "modifier_le_profil/code.html",
        "Modifier": ROOT + "modifier_le_profil/code.html",
        "Paramètres": ROOT + "param_tres_g_n_raux/code.html",
        "Sécurité": ROOT + "s_curit/code.html",
        "Limites": ROOT + "limites_de_transaction/code.html",
        "Moyens de Paiement": ROOT + "moyens_de_paiement_li_s/code.html",
        "Espace Marchand": ROOT + "accueil_marchand/code.html",
        "Espace Agent": ROOT + "accueil_espace_agent/code.html",
        "Aide & Support": ROOT + "support_aide/code.html",
        "Support": ROOT + "support_aide/code.html",
        "Déconnexion": ROOT + "accueil_splash_mis_jour/code.html",
      }
    },

    "transfert_switch_switch": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null,
      actions: { "Envoyer": ROOT + "confirmation_de_l_op_ration_code/code.html", "Continuer": ROOT + "confirmation_de_l_op_ration_code/code.html" }
    },
    "transfert_mobile_money": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null,
      actions: { "Transférer": ROOT + "confirmation_de_l_op_ration_code/code.html", "Continuer": ROOT + "confirmation_de_l_op_ration_code/code.html" }
    },
    "d_p_t_de_fonds": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null,
      actions: { "Déposer": ROOT + "confirmation_de_l_op_ration_code/code.html", "Continuer": ROOT + "confirmation_de_l_op_ration_code/code.html" }
    },
    "retrait_de_fonds": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null,
      actions: { "Retirer": ROOT + "confirmation_de_l_op_ration_code/code.html", "Continuer": ROOT + "confirmation_de_l_op_ration_code/code.html" }
    },
    "confirmation_de_l_op_ration_code": {
      space: "user", back: "javascript:history.back()", nav: null,
      actions: { "Confirmer": ROOT + "confirmation_de_succ_s/code.html", "Valider": ROOT + "confirmation_de_succ_s/code.html" }
    },
    "confirmation_de_succ_s": {
      space: "user", back: null, nav: null,
      actions: {
        "Retour": DYNAMIC_DASHBOARD,
        "Accueil": DYNAMIC_DASHBOARD,
        "Voir le reçu": ROOT + "d_tail_de_transaction/code.html",
        "Nouvelle opération": "javascript:history.go(-3)",
      }
    },
    "chec_de_transaction": {
      space: "user", back: "javascript:history.back()", nav: null,
      actions: { "Réessayer": "javascript:history.back()", "Accueil": DYNAMIC_DASHBOARD }
    },
    "d_tail_de_transaction": {
      space: "user", back: ROOT + "historique_des_transactions/code.html", nav: null, actions: {}
    },

    "scanner_qr_code": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null,
      actions: { "Payer": ROOT + "confirmation_paiement_qr/code.html", "Valider": ROOT + "confirmation_paiement_qr/code.html" }
    },
    "confirmation_paiement_qr": {
      space: "user", back: ROOT + "scanner_qr_code/code.html", nav: null,
      actions: { "Payer": ROOT + "confirmation_de_succ_s/code.html", "Confirmer": ROOT + "confirmation_de_succ_s/code.html" }
    },
    "paiement_d_abonnements": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null,
      actions: { "Abonnement": ROOT + "d_tail_de_l_abonnement/code.html", "Payer": ROOT + "confirmation_de_l_op_ration_code/code.html" }
    },
    "d_tail_de_l_abonnement": {
      space: "user", back: ROOT + "paiement_d_abonnements/code.html", nav: null,
      actions: { "Payer": ROOT + "confirmation_de_l_op_ration_code/code.html", "S'abonner": ROOT + "confirmation_de_l_op_ration_code/code.html" }
    },

    "mes_tontines": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null,
      actions: { "Créer": ROOT + "cr_er_une_tontine/code.html", "Nouvelle": ROOT + "cr_er_une_tontine/code.html", "Voir détail": ROOT + "d_tail_de_la_tontine/code.html" }
    },
    "cr_er_une_tontine": {
      space: "user", back: ROOT + "mes_tontines/code.html", nav: null,
      actions: { "Créer": ROOT + "d_tail_de_la_tontine/code.html", "Continuer": ROOT + "d_tail_de_la_tontine/code.html", "Valider": ROOT + "d_tail_de_la_tontine/code.html" }
    },
    "d_tail_de_la_tontine": {
      space: "user", back: ROOT + "mes_tontines/code.html", nav: null,
      actions: {
        "Membres": ROOT + "membres_de_la_tontine/code.html",
        "Voir membres": ROOT + "membres_de_la_tontine/code.html",
        "Participer": ROOT + "confirmation_de_succ_s/code.html",
        "Paramètres": ROOT + "param_tres_g_n_raux/code.html",
      }
    },
    "membres_de_la_tontine": {
      space: "user", back: ROOT + "d_tail_de_la_tontine/code.html", nav: null, actions: {}
    },
    "mes_cagnottes": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null,
      actions: { "Créer": ROOT + "cr_er_une_cagnotte/code.html", "Nouvelle": ROOT + "cr_er_une_cagnotte/code.html", "Voir": ROOT + "d_tail_de_la_cagnotte/code.html" }
    },
    "cr_er_une_cagnotte": {
      space: "user", back: ROOT + "mes_cagnottes/code.html", nav: null,
      actions: { "Créer": ROOT + "d_tail_de_la_cagnotte/code.html", "Lancer": ROOT + "d_tail_de_la_cagnotte/code.html", "Continuer": ROOT + "d_tail_de_la_cagnotte/code.html" }
    },
    "d_tail_de_la_cagnotte": {
      space: "user", back: ROOT + "mes_cagnottes/code.html", nav: null,
      actions: {
        "Contribuer": ROOT + "confirmation_de_succ_s/code.html",
        "Participer": ROOT + "confirmation_de_succ_s/code.html",
        "Paramètres": ROOT + "param_tres_g_n_raux/code.html",
      }
    },

    "conversion_de_devises": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null,
      actions: { "Convertir": ROOT + "confirmation_de_l_op_ration_code/code.html", "Continuer": ROOT + "confirmation_de_l_op_ration_code/code.html" }
    },
    "simulateur_de_frais": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null,
      actions: { "Simuler": ROOT + "simulateur_de_frais/code.html", "Calculer": ROOT + "simulateur_de_frais/code.html" }
    },
    "achats_en_ligne_cartes_virtuelles": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: "wallet",
      actions: { "Créer": ROOT + "confirmation_de_l_op_ration_code/code.html", "Continuer": ROOT + "confirmation_de_l_op_ration_code/code.html" }
    },
    "localiser_un_agent_switch": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null,
      actions: { "Voir détail": ROOT + "d_tail_de_l_agent_switch/code.html", "Contacter": ROOT + "d_tail_de_l_agent_switch/code.html" }
    },
    "d_tail_de_l_agent_switch": {
      space: "user", back: ROOT + "localiser_un_agent_switch/code.html", nav: null, actions: {}
    },

    "modifier_le_profil": {
      space: "user", back: ROOT + "profil_utilisateur/code.html", nav: null,
      actions: { "Enregistrer": ROOT + "profil_utilisateur/code.html", "Sauvegarder": ROOT + "profil_utilisateur/code.html" }
    },
    "param_tres_g_n_raux": {
      space: "user", back: "javascript:history.back()", nav: "settings",
      actions: {
        "Sécurité": ROOT + "s_curit/code.html",
        "Paiement": ROOT + "moyens_de_paiement_li_s/code.html",
        "Limites": ROOT + "limites_de_transaction/code.html",
        "Notifications": ROOT + "centre_de_notifications/code.html",
        "Support": ROOT + "support_aide/code.html",
      }
    },
    "s_curit": { space: "user", back: ROOT + "param_tres_g_n_raux/code.html", nav: null, actions: {} },
    "limites_de_transaction": { space: "user", back: ROOT + "param_tres_g_n_raux/code.html", nav: null, actions: {} },
    "moyens_de_paiement_li_s": {
      space: "user", back: ROOT + "profil_utilisateur/code.html", nav: null,
      actions: { "Ajouter": ROOT + "moyens_de_paiement_li_s/code.html", "Paramètres": ROOT + "param_tres_de_paiement/code.html" }
    },
    "param_tres_de_paiement": { space: "user", back: ROOT + "moyens_de_paiement_li_s/code.html", nav: null, actions: {} },
    "support_aide": { space: "user", back: ROOT + "profil_utilisateur/code.html", nav: null, actions: {} },

    "paiement_sbee_electricite": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "paiement_soneb_eau": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "recharge_credit_data": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "coffre_epargne_vault": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "micro_credit_express": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "parrainage_recompenses": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "recu_transaction_partage": { space: "user", back: "javascript:history.back()", nav: null, actions: {} },
    "liens_de_paiement_marchand": { space: "merchant", back: ROOT + "tableau_de_bord_marchand/code.html", nav: null, actions: {} },
    "caisse_marchand_pos": { space: "merchant", back: ROOT + "tableau_de_bord_marchand/code.html", nav: null, actions: {} },

    "carte_agents_guichets": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "budget_analyse_depenses": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "partage_addition_split": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "mode_hors_ligne_ussd": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "appareils_connectes_securite": { space: "user", back: ROOT + "s_curit/code.html", nav: null, actions: {} },

    "kyc_verification_identite": { space: "user", back: ROOT + "cr_ation_code_pin/code.html", nav: null, actions: {} },
    "bienvenue_succes_onboarding": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "setup_point_de_vente_marchand": { space: "merchant", back: ROOT + "v_rification_marchand/code.html", nav: null, actions: {} },
    "agent_verification_caution": { space: "agent", back: ROOT + "inscription_agent_switch/code.html", nav: null, actions: {} },

    "accueil_marchand": {
      space: "merchant", back: ROOT + "profil_utilisateur/code.html", nav: null,
      actions: { "Créer un compte": ROOT + "inscription_marchand/code.html", "Commencer": ROOT + "inscription_marchand/code.html", "Se connecter": ROOT + "tableau_de_bord_marchand/code.html" }
    },
    "inscription_marchand": {
      space: "merchant", back: ROOT + "accueil_marchand/code.html", nav: null,
      actions: { "Continuer": ROOT + "v_rification_marchand/code.html", "Créer": ROOT + "v_rification_marchand/code.html", "Soumettre": ROOT + "v_rification_marchand/code.html" }
    },
    "v_rification_marchand": {
      space: "merchant", back: ROOT + "inscription_marchand/code.html", nav: null,
      actions: { "Vérifier": ROOT + "tableau_de_bord_marchand/code.html", "Soumettre": ROOT + "tableau_de_bord_marchand/code.html", "Continuer": ROOT + "tableau_de_bord_marchand/code.html" }
    },
    "tableau_de_bord_marchand": {
      space: "merchant", back: null, nav: "m-home",
      actions: {
        "QR Code": ROOT + "g_n_rer_qr_code_de_r_ception/code.html",
        "Générer": ROOT + "g_n_rer_qr_code_de_r_ception/code.html",
        "Scanner": ROOT + "scanner_qr_code/code.html",
        "Historique": ROOT + "historique_des_ventes/code.html",
        "Ventes": ROOT + "historique_des_ventes/code.html",
        "Catalogue": ROOT + "catalogue_produits_services/code.html",
        "Produits": ROOT + "catalogue_produits_services/code.html",
        "Retrait": ROOT + "retrait_marchand/code.html",
        "Retirer": ROOT + "retrait_marchand/code.html",
      }
    },
    "historique_des_ventes": {
      space: "merchant", back: ROOT + "tableau_de_bord_marchand/code.html", nav: "m-history",
      actions: { "Voir": ROOT + "d_tail_d_une_vente/code.html", "Détail": ROOT + "d_tail_d_une_vente/code.html" }
    },
    "d_tail_d_une_vente": { space: "merchant", back: ROOT + "historique_des_ventes/code.html", nav: null, actions: {} },
    "g_n_rer_qr_code_de_r_ception": {
      space: "merchant", back: ROOT + "tableau_de_bord_marchand/code.html", nav: null,
      actions: { "Générer": ROOT + "g_n_rer_qr_code_de_r_ception/code.html", "Partager": ROOT + "g_n_rer_qr_code_de_r_ception/code.html", "Télécharger": ROOT + "g_n_rer_qr_code_de_r_ception/code.html" }
    },
    "catalogue_produits_services": {
      space: "merchant", back: ROOT + "tableau_de_bord_marchand/code.html", nav: null,
      actions: { "Ajouter": ROOT + "catalogue_produits_services/code.html", "Modifier": ROOT + "catalogue_produits_services/code.html" }
    },
    "retrait_marchand": {
      space: "merchant", back: ROOT + "tableau_de_bord_marchand/code.html", nav: null,
      actions: { "Retirer": ROOT + "confirmation_de_l_op_ration_code/code.html", "Continuer": ROOT + "confirmation_de_l_op_ration_code/code.html" }
    },
    "profil_de_l_entreprise": {
      space: "merchant", back: ROOT + "tableau_de_bord_marchand/code.html", nav: "m-profile",
      actions: {
        "Modifier": ROOT + "profil_de_l_entreprise/code.html",
        "Équipe": ROOT + "quipe_marchand/code.html",
        "Déconnexion": ROOT + "accueil_splash_mis_jour/code.html",
        "Se déconnecter": ROOT + "accueil_splash_mis_jour/code.html"
      }
    },
    "quipe_marchand": {
      space: "merchant", back: ROOT + "profil_de_l_entreprise/code.html", nav: null, actions: {}
    },
    "support_marchand": { space: "merchant", back: ROOT + "tableau_de_bord_marchand/code.html", nav: "m-support", actions: {} },

    "accueil_espace_agent": {
      space: "agent", back: ROOT + "profil_utilisateur/code.html", nav: null,
      actions: { "Commencer": ROOT + "inscription_agent_switch/code.html", "Créer un compte": ROOT + "inscription_agent_switch/code.html", "Se connecter": ROOT + "tableau_de_bord_agent/code.html" }
    },
    "inscription_agent_switch": {
      space: "agent", back: ROOT + "accueil_espace_agent/code.html", nav: null,
      actions: { "Soumettre": ROOT + "tableau_de_bord_agent/code.html", "Continuer": ROOT + "tableau_de_bord_agent/code.html", "S'inscrire": ROOT + "tableau_de_bord_agent/code.html" }
    },
    "tableau_de_bord_agent": {
      space: "agent", back: null, nav: "a-home",
      actions: {
        "Dépôt": ROOT + "d_p_t_de_fonds_mis_jour_agent/code.html",
        "Déposer": ROOT + "d_p_t_de_fonds_mis_jour_agent/code.html",
        "Retrait": ROOT + "retrait_de_fonds_mis_jour_agent/code.html",
        "Retirer": ROOT + "retrait_de_fonds_mis_jour_agent/code.html",
        "Valider": ROOT + "valider_une_op_ration_client/code.html",
        "Opération": ROOT + "valider_une_op_ration_client/code.html",
        "Réapprovisionnement": ROOT + "demande_de_r_approvisionnement_float/code.html",
        "Float": ROOT + "demande_de_r_approvisionnement_float/code.html",
        "Historique": ROOT + "historique_des_op_rations_agent/code.html",
      }
    },
    "historique_des_op_rations_agent": { space: "agent", back: "javascript:history.back()", nav: "a-history", actions: {} },
    "d_p_t_de_fonds_mis_jour_agent": {
      space: "agent", back: "javascript:history.back()", nav: null,
      actions: { "Valider": ROOT + "confirmation_de_l_op_ration_code/code.html", "Continuer": ROOT + "confirmation_de_l_op_ration_code/code.html", "Déposer": ROOT + "confirmation_de_l_op_ration_code/code.html" }
    },
    "retrait_de_fonds_mis_jour_agent": {
      space: "agent", back: "javascript:history.back()", nav: null,
      actions: { "Valider": ROOT + "confirmation_de_l_op_ration_code/code.html", "Continuer": ROOT + "confirmation_de_l_op_ration_code/code.html", "Retirer": ROOT + "confirmation_de_l_op_ration_code/code.html" }
    },
    "valider_une_op_ration_client": {
      space: "agent", back: "javascript:history.back()", nav: null,
      actions: { "Valider": ROOT + "confirmation_de_succ_s/code.html", "Approuver": ROOT + "confirmation_de_succ_s/code.html", "Confirmer": ROOT + "confirmation_de_succ_s/code.html" }
    },
    "demande_de_r_approvisionnement_float": {
      space: "agent", back: "javascript:history.back()", nav: null,
      actions: { "Envoyer": ROOT + "confirmation_de_succ_s/code.html", "Demander": ROOT + "confirmation_de_succ_s/code.html", "Soumettre": ROOT + "confirmation_de_succ_s/code.html" }
    },
    "param_tres_et_profil_agent": {
      space: "agent", back: "javascript:history.back()", nav: "a-profile",
      actions: { "Enregistrer": ROOT + "tableau_de_bord_agent/code.html" }
    },
  };

  const NAV_BAR_STYLE = [
    "position:fixed", "bottom:0", "left:0", "right:0", "width:100%",
    "z-index:50", "display:flex", "align-items:center",
    "justify-content:space-around", "padding:10px 8px",
    "background:#ffffff", "border-top:1px solid #ECE6F0",
    "box-shadow:0 -2px 12px rgba(0,0,0,0.06)",
  ].join(";");

  function navItemHTML(href, icon, label, active) {
    const color = active ? "#5e3bdc" : "#79747E";
    return `
  <a href="${href}" onclick="event.stopPropagation()" style="display:flex;flex-direction:column;align-items:center;gap:2px;color:${color};text-decoration:none;flex:1;">
    <span class="material-symbols-outlined" style="font-size:22px;${active ? "font-variation-settings:'FILL' 1;" : ""}">${icon}</span>
    <span class="nav-label" style="font-size:10px;font-weight:${active ? "700" : "500"};">${label}</span>
  </a>`;
  }

  function navHTML(space, activeTab) {
    if (space === "user") {
      return `
<nav id="switch-nav" role="navigation" aria-label="Navigation principale" style="${NAV_BAR_STYLE}">
  ${navItemHTML(ROOT + "tableau_de_bord_mis_jour/code.html", "home", "Accueil", activeTab === "home")}
  ${navItemHTML(ROOT + "historique_des_transactions/code.html", "receipt_long", "Historique", activeTab === "history")}
  ${navItemHTML(ROOT + "achats_en_ligne_cartes_virtuelles/code.html", "account_balance_wallet", "Portefeuille", activeTab === "wallet")}
  ${navItemHTML(ROOT + "param_tres_g_n_raux/code.html", "settings", "Paramètres", activeTab === "settings")}
</nav>`;
    }
    if (space === "merchant") {
      return `
<nav id="switch-nav" role="navigation" aria-label="Navigation Marchand" style="${NAV_BAR_STYLE}">
  ${navItemHTML(ROOT + "tableau_de_bord_marchand/code.html", "store", "Accueil", activeTab === "m-home")}
  ${navItemHTML(ROOT + "historique_des_ventes/code.html", "receipt_long", "Ventes", activeTab === "m-history")}
  ${navItemHTML(ROOT + "g_n_rer_qr_code_de_r_ception/code.html", "qr_code_2", "QR", activeTab === "m-qr")}
  ${navItemHTML(ROOT + "profil_de_l_entreprise/code.html", "business", "Entreprise", activeTab === "m-profile")}
  ${navItemHTML(ROOT + "support_marchand/code.html", "help", "Support", activeTab === "m-support")}
</nav>`;
    }
    if (space === "agent") {
      return `
<nav id="switch-nav" role="navigation" aria-label="Navigation Agent" style="${NAV_BAR_STYLE}">
  ${navItemHTML(ROOT + "tableau_de_bord_agent/code.html", "dashboard", "Accueil", activeTab === "a-home")}
  ${navItemHTML(ROOT + "historique_des_op_rations_agent/code.html", "swap_horiz", "Opérations", activeTab === "a-history")}
  ${navItemHTML(ROOT + "valider_une_op_ration_client/code.html", "check_circle", "Valider", activeTab === "a-validate")}
  ${navItemHTML(ROOT + "demande_de_r_approvisionnement_float/code.html", "account_balance_wallet", "Float", activeTab === "a-float")}
  ${navItemHTML(ROOT + "param_tres_et_profil_agent/code.html", "manage_accounts", "Profil", activeTab === "a-profile")}
</nav>`;
    }
    return "";
  }

  const pageCache = new Map();

  async function fetchPage(targetUrl) {
    const normalizedUrl = new URL(targetUrl, window.location.href).href;
    if (pageCache.has(normalizedUrl)) {
      return pageCache.get(normalizedUrl);
    }
    const resp = await fetch(normalizedUrl);
    if (!resp.ok) throw new Error("HTTP error " + resp.status + " fetching " + normalizedUrl);
    const htmlText = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const pageData = {
      title: doc.title,
      bodyHTML: doc.body.innerHTML,
      bodyClass: doc.body.className,
      bodyStyle: doc.body.getAttribute("style") || "",
      scripts: Array.from(doc.body.querySelectorAll("script")).map(function (s) {
        return { src: s.getAttribute("src"), content: s.textContent };
      })
    };
    pageCache.set(normalizedUrl, pageData);
    return pageData;
  }

  function handleBack(e) {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
      e.stopPropagation();
    }
    if (window.history.length > 1) {
      window.history.back();
    } else {
      switchNavigate(getActiveDashboard());
    }
  }

  async function switchNavigate(targetUrl, pushState) {
    if (pushState === undefined) pushState = true;
    if (!targetUrl) return;

    if (targetUrl === "javascript:history.back()") {
      handleBack();
      return;
    }
    if (targetUrl.startsWith("javascript:history.go(")) {
      const steps = parseInt(targetUrl.replace("javascript:history.go(", "").replace(")", ""), 10);
      if (!isNaN(steps)) window.history.go(steps);
      return;
    }
    if (targetUrl.startsWith("javascript:")) return;

    const resolved = resolveTarget(targetUrl);
    const normalizedUrl = new URL(resolved, window.location.href).href;

    try {
      const pageData = await fetchPage(normalizedUrl);
      if (pageData.title) document.title = pageData.title;
      document.body.className = pageData.bodyClass;
      if (pageData.bodyStyle) {
        document.body.setAttribute("style", pageData.bodyStyle);
      } else {
        document.body.removeAttribute("style");
      }
      document.body.innerHTML = pageData.bodyHTML;

      if (pushState && window.location.href !== normalizedUrl) {
        window.history.pushState({ url: normalizedUrl }, "", normalizedUrl);
      }

      pageData.scripts.forEach(function (scriptObj) {
        if (scriptObj.src && (
          scriptObj.src.includes("switch.router.js") ||
          scriptObj.src.includes("switch.config.js") ||
          scriptObj.src.includes("tailwindcss")
        )) {
          return;
        }
        const s = document.createElement("script");
        if (scriptObj.src) {
          s.src = scriptObj.src;
        } else {
          s.textContent = scriptObj.content;
        }
        document.body.appendChild(s);
      });

      init();
      if (typeof window.switchInitForms === "function") {
        window.switchInitForms();
      }
      window.scrollTo(0, 0);
    } catch (err) {
      console.warn("[Switch Router] Navigation SPA fallback:", err);
      window.location.href = normalizedUrl;
    }
  }

  window.switchNavigate = switchNavigate;
  window.switchHandleBack = handleBack;

  function createBackButton() {
    const btn = document.createElement("button");
    btn.className = "switch-back-btn";
    btn.setAttribute("aria-label", "Retour");
    btn.style.cssText = [
      "position:fixed", "top:16px", "left:16px", "z-index:200",
      "width:40px", "height:40px", "border-radius:50%",
      "background:rgba(253,248,255,0.9)", "-webkit-backdrop-filter:blur(10px)", "backdrop-filter:blur(10px)",
      "border:1px solid #e6e0ee", "box-shadow:0 4px 12px rgba(0,0,0,0.08)",
      "display:flex", "align-items:center", "justify-content:center",
      "cursor:pointer", "transition:transform 0.15s",
    ].join(";");
    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined";
    icon.style.cssText = "font-size:20px;color:#1c1a24;font-variation-settings:'FILL' 0";
    icon.textContent = "arrow_back";
    btn.appendChild(icon);
    btn.addEventListener("click", handleBack);
    return btn;
  }

  function matchAction(text, actions) {
    if (!text) return null;
    for (const [pattern, target] of Object.entries(actions)) {
      const regex = new RegExp(pattern, "i");
      if (regex.test(text)) return target;
    }
    return null;
  }

  function resolveTarget(target) {
    return target === DYNAMIC_DASHBOARD ? getActiveDashboard() : target;
  }

  function wireActions(actions) {
    if (!actions || Object.keys(actions).length === 0) return;
    const allButtons = document.querySelectorAll("button, a[href='#'], a:not([href]), [role='button']");

    allButtons.forEach(function (el) {
      if (el.hasAttribute("onclick")) return;
      const ownText = (el.textContent || el.innerText || "").trim();
      let target = matchAction(ownText, actions);
      let clickScope = el;

      if (!target) {
        const container = el.parentElement;
        if (container && !["BODY", "MAIN", "SECTION", "NAV", "HEADER", "FORM"].includes(container.tagName.toUpperCase())) {
          const containerText = (container.textContent || "").trim();
          if (containerText.length > 0 && containerText.length < 150) {
            target = matchAction(containerText, actions);
            if (target) clickScope = container;
          }
        }
      }

      if (!target) return;
      if (el.tagName === "A" && el.getAttribute("href") && el.getAttribute("href") !== "#") return;

      el.style.cursor = "pointer";
      if (clickScope !== el) clickScope.style.cursor = "pointer";

      const handleClick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        const resolved = resolveTarget(target);
        if (resolved === "javascript:history.back()") {
          handleBack(e);
        } else if (resolved.startsWith("javascript:history.go(")) {
          const steps = parseInt(resolved.replace("javascript:history.go(", "").replace(")", ""), 10);
          if (!isNaN(steps)) { window.history.go(steps); }
        } else if (resolved === "javascript:void(0)" || resolved === "javascript:void 0") {
          // Inerte
        } else {
          switchNavigate(resolved);
        }
      };

      el.addEventListener("click", handleClick);
      if (clickScope !== el) {
        clickScope.addEventListener("click", handleClick);
      }
    });
  }

  function wireAvatarToProfile(space) {
    if (space !== "user") return;
    const avatarImg =
      document.querySelector("img[alt='User profile picture']") ||
      document.querySelector("header img");
    if (!avatarImg) return;
    const clickTarget = avatarImg.closest("div") || avatarImg;
    clickTarget.style.cursor = "pointer";
    clickTarget.addEventListener("click", function (e) {
      e.preventDefault();
      switchNavigate(ROOT + "profil_utilisateur/code.html");
    });
    const greeting = document.querySelector("[data-i18n='greeting']");
    if (greeting) {
      greeting.style.cursor = "pointer";
      greeting.addEventListener("click", function (e) {
        e.preventDefault();
        switchNavigate(ROOT + "profil_utilisateur/code.html");
      });
    }
  }

  function getCurrentScreen() {
    const path = window.location.pathname;
    const parts = path.split("/");
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i] && parts[i] !== "code.html") return parts[i];
    }
    return null;
  }

  function init() {
    const screenKey = getCurrentScreen();
    const config = SCREENS[screenKey];

    if (!config) {
      console.info("[Switch Router] Écran non cartographié :", screenKey);
      return;
    }

    const { space, back, nav, actions } = config;

    if (DASHBOARD_KEYS.includes(screenKey)) {
      sessionStorage.setItem("switchActiveSpace", space);
    }

    document.querySelectorAll("nav:not(#switch-nav)").forEach(function (existingNav) { existingNav.remove(); });

    if (nav) {
      document.body.style.paddingBottom = "84px";
      if (!document.getElementById("switch-nav")) {
        const navEl = document.createElement("div");
        navEl.innerHTML = navHTML(space, nav);
        document.body.appendChild(navEl.firstElementChild);
      }
    }

    let existingBackBtn = document.querySelector('button[aria-label="Retour"], button.switch-back-btn, button.back-btn, [data-action="back"]');
    if (!existingBackBtn) {
      const buttons = document.querySelectorAll("button");
      for (const btn of buttons) {
        if (btn.textContent.includes("arrow_back")) {
          existingBackBtn = btn;
          break;
        }
      }
    }

    if (existingBackBtn) {
      existingBackBtn.addEventListener("click", handleBack);
    } else if (back) {
      const backBtn = createBackButton();
      if (backBtn) document.body.insertBefore(backBtn, document.body.firstChild);
    }

    wireActions(actions);
    wireAvatarToProfile(space);
  }

  // Interception globale des clics sur les liens internes et boutons de retour
  document.addEventListener("click", function (e) {
    const backBtn = e.target.closest('button[aria-label="Retour"], button.switch-back-btn, button.back-btn, #back-btn, .btn-back, [data-action="back"]');
    if (backBtn) {
      handleBack(e);
      return;
    }

    const btn = e.target.closest("button");
    if (btn && btn.textContent && btn.textContent.includes("arrow_back")) {
      handleBack(e);
      return;
    }

    const anchor = e.target.closest("a");
    if (anchor) {
      const href = anchor.getAttribute("href");
      if (!href || href === "#" || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (href.startsWith("http://") || href.startsWith("https://")) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      switchNavigate(href);
    }
  }, true);

  // Gestion de l'historique navigateur (flèche précédent/suivant)
  window.addEventListener("popstate", function () {
    switchNavigate(window.location.href, false);
  });

  // Pré-chargement en arrière-plan de tous les écrans pour un affichage instantané (0.00ms)
  function preloadAllScreens() {
    const currentBase = window.location.href;
    Object.keys(SCREENS).forEach(function (screenKey) {
      const screenUrl = new URL(ROOT + screenKey + "/code.html", currentBase).href;
      fetchPage(screenUrl).catch(function () {});
    });
  }

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(preloadAllScreens);
  } else {
    setTimeout(preloadAllScreens, 150);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();