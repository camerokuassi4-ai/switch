/**
 * switch.router.js
 * ─────────────────────────────────────────────────────────────
 * Moteur de navigation SPA Instantané — App Switch (Bénin)
 * 0.00ms de chargement, zéro rechargement de page, barre figée
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  "use strict";

  if (window.__SWITCH_ROUTER_INITIALIZED__) {
    if (typeof window.switchRouterInit === "function") {
      window.switchRouterInit();
    }
    return;
  }
  window.__SWITCH_ROUTER_INITIALIZED__ = true;

  const ROOT = "../";

  const DASHBOARDS = {
    user: ROOT + "tableau_de_bord_mis_jour/code.html",
    merchant: ROOT + "tableau_de_bord_marchand/code.html",
    agent: ROOT + "tableau_de_bord_agent_simple/code.html",
    hybrid: ROOT + "tableau_de_bord_agent_mixte/code.html",
  };
  const DASHBOARD_KEYS = ["tableau_de_bord_mis_jour", "tableau_de_bord_marchand", "tableau_de_bord_agent", "tableau_de_bord_agent_simple", "tableau_de_bord_agent_mixte"];
  const DYNAMIC_DASHBOARD = "__DYNAMIC_DASHBOARD__";

  function getActiveDashboard() {
    const space = sessionStorage.getItem("switchActiveSpace") || "user";
    return DASHBOARDS[space] || DASHBOARDS.user;
  }

  const SCREENS = {
    "accueil_splash_mis_jour": {
      space: "auth", back: null, nav: null,
      actions: {}
    },
    "choix_type_compte": {
      space: "auth", back: null, nav: null,
      actions: {}
    },
    "inscription_agent_switch": {
      space: "agent", back: null, nav: null,
      actions: {}
    },
    "agent_verification_caution": {
      space: "agent", back: null, nav: null,
      actions: {}
    },
    "documents_contrat_agent": {
      space: "agent", back: null, nav: null,
      actions: {}
    },
    "confirmation_biometrique_agent": {
      space: "agent", back: null, nav: null,
      actions: {}
    },
    "inscription_marchand": {
      space: "merchant", back: null, nav: null,
      actions: {}
    },
    "v_rification_marchand": {
      space: "merchant", back: null, nav: null,
      actions: {}
    },
    "setup_point_de_vente_marchand": {
      space: "merchant", back: null, nav: null,
      actions: {}
    },
    "inscription": {
      space: "auth", back: null, nav: null,
      actions: {}
    },
    "connexion": {
      space: "auth", back: null, nav: null,
      actions: {}
    },
    "v_rification_otp": {
      space: "auth", back: null, nav: null,
      actions: {}
    },
    "cr_ation_code_pin": {
      space: "auth", back: null, nav: null,
      actions: {}
    },
    "kyc_verification_identite": {
      space: "auth", back: null, nav: null,
      actions: {}
    },
    "verification_niveau_superieur": {
      space: "auth", back: null, nav: null,
      actions: {}
    },
    "verrouillage_pin": {
      space: "auth", back: null, nav: null,
      actions: {}
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
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: "history",
      actions: { "Voir tout": ROOT + "historique_des_transactions/code.html" }
    },
    "historique_vide": {
      space: "user", back: null, nav: "history",
      actions: { "Faire un transfert": ROOT + "transfert_switch_switch/code.html" }
    },
    "centre_de_notifications": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: "notifs", actions: {}
    },
    "marketplace_boutiques_switch": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {}
    },
    "centre_de_notifications_marchand": {
      space: "merchant", back: ROOT + "tableau_de_bord_marchand/code.html", nav: null, actions: {}
    },
    "operations_caisse_marchand": {
      space: "merchant", back: ROOT + "tableau_de_bord_marchand/code.html", nav: "m-ops", actions: {}
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
        "Espace Agent": ROOT + "tableau_de_bord_agent/code.html",
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
      actions: { "Transférer": ROOT + "confirmation_de_l_op_ration_code/code.html", "Continuer": ROOT + "confirmation_de_l_op_ration_code/code.html", "Suivant": ROOT + "confirmation_de_l_op_ration_code/code.html", "Envoyer": ROOT + "confirmation_de_l_op_ration_code/code.html" }
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
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: "qr",
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
      actions: { "Payer": ROOT + "confirmation_de_l_op_ration_code/code.html", "S'abonner": ROOT + "confirmation_de_l_op_ration_code/code.html", "Confirmer": ROOT + "confirmation_de_l_op_ration_code/code.html" }
    },

    "mes_tontines": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null,
      actions: { "Créer": ROOT + "cr_er_une_tontine/code.html", "Nouvelle": ROOT + "cr_er_une_tontine/code.html", "Voir détail": ROOT + "d_tail_de_la_tontine/code.html" }
    },
    "cr_er_une_tontine": {
      space: "user", back: ROOT + "mes_tontines/code.html", nav: null,
      actions: { "Créer": ROOT + "d_tail_de_la_tontine/code.html", "Lancer": ROOT + "d_tail_de_la_tontine/code.html", "Continuer": ROOT + "d_tail_de_la_tontine/code.html" }
    },
    "d_tail_de_la_tontine": {
      space: "user", back: ROOT + "mes_tontines/code.html", nav: null,
      actions: {
        "Membres": ROOT + "membres_de_la_tontine/code.html",
        "Cotiser": ROOT + "confirmation_de_succ_s/code.html",
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
      actions: { "Confirmer": ROOT + "confirmation_de_l_op_ration_code/code.html", "Convertir": ROOT + "confirmation_de_l_op_ration_code/code.html", "Continuer": ROOT + "confirmation_de_l_op_ration_code/code.html" }
    },
    "simulateur_de_frais": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null,
      actions: { "Simuler": ROOT + "simulateur_de_frais/code.html", "Calculer": ROOT + "simulateur_de_frais/code.html" }
    },
    "achats_en_ligne_cartes_virtuelles": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: "cards",
      actions: { "Créer": ROOT + "creer_carte_virtuelle/code.html", "Nouvelle": ROOT + "creer_carte_virtuelle/code.html" }
    },
    "creer_carte_virtuelle": {
      space: "user", back: ROOT + "achats_en_ligne_cartes_virtuelles/code.html", nav: null, actions: {}
    },
    "localiser_un_agent_switch": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null,
      actions: { "Voir détail": ROOT + "d_tail_de_l_agent_switch/code.html", "Contacter": ROOT + "d_tail_de_l_agent_switch/code.html" }
    },
    "d_tail_de_l_agent_switch": {
      space: "user", back: ROOT + "localiser_un_agent_switch/code.html", nav: null, actions: {}
    },

    "modifier_le_profil": {
      space: "user", back: ROOT + "param_tres_g_n_raux/code.html", nav: null,
      actions: {}
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
    "coffre_epargne_vault": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: "vault", actions: {} },
    "micro_credit_express": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "parrainage_recompenses": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "paiement_scolarite_campus": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "switch_kids_famille": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "paiements_recurrents_autopay": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "investissements_bons_tresor": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "switch_sante_assurance": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "centre_de_notifications": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "recu_transaction_partage": { space: "user", back: "javascript:history.back()", nav: null, actions: {} },
    "caisse_marchand_pos": { space: "merchant", back: ROOT + "tableau_de_bord_marchand/code.html", nav: null, actions: {} },
    "inscription_agent_switch": { space: "agent", back: ROOT + "accueil_espace_agent/code.html", nav: null, actions: {} },
    "agent_verification_caution": { space: "agent", back: ROOT + "inscription_agent_switch/code.html", nav: null, actions: {} },
     "tableau_de_bord_agent": { space: "agent", back: null, nav: "a-home", actions: {} },
     "tableau_de_bord_agent_simple": { space: "agent", back: null, nav: "a-home", actions: {} },
     "tableau_de_bord_agent_mixte": { space: "hybrid", back: null, nav: "h-home", actions: {} },
    "services_factures_hybride": { space: "hybrid", back: ROOT + "tableau_de_bord_agent_mixte/code.html", nav: "h-kiosk", actions: {} },
    "cloture_de_caisse_hybride": { space: "hybrid", back: ROOT + "tableau_de_bord_agent_mixte/code.html", nav: "h-caisse", actions: {} },
    "param_tres_et_profil_hybride": { space: "hybrid", back: ROOT + "tableau_de_bord_agent_mixte/code.html", nav: null, actions: {} },
    "centre_de_notifications_agent": { space: "agent", back: ROOT + "tableau_de_bord_agent/code.html", nav: null, actions: {} },
    "succes_reapprovisionnement_float": { space: "agent", back: ROOT + "tableau_de_bord_agent/code.html", nav: null, actions: {} },
    "cloture_de_caisse_agent": { space: "agent", back: ROOT + "tableau_de_bord_agent/code.html", nav: "a-caisse", actions: {} },
    "retrait_commissions_agent": { space: "agent", back: ROOT + "tableau_de_bord_agent/code.html", nav: null, actions: {} },
    "gestion_caissiers_agent": { space: "agent", back: ROOT + "param_tres_et_profil_agent/code.html", nav: null, actions: {} },
    "releve_operations_agent": { space: "agent", back: ROOT + "historique_des_op_rations_agent/code.html", nav: null, actions: {} },
    "support_assistance_agent": { space: "agent", back: ROOT + "param_tres_et_profil_agent/code.html", nav: null, actions: {} },
    "bareme_commissions_agent": { space: "agent", back: ROOT + "param_tres_et_profil_agent/code.html", nav: null, actions: {} },
    "modifier_profil_agent": { space: "agent", back: ROOT + "param_tres_et_profil_agent/code.html", nav: null, actions: {} },
    "securite_et_pin_agent": { space: "agent", back: ROOT + "param_tres_et_profil_agent/code.html", nav: null, actions: {} },
    "documents_contrat_agent": { space: "agent", back: ROOT + "param_tres_et_profil_agent/code.html", nav: null, actions: {} },
    "services_factures_agent": { space: "agent", back: ROOT + "tableau_de_bord_agent/code.html", nav: "a-services", actions: {} },
    "transfert_float_inter_agent": { space: "agent", back: ROOT + "tableau_de_bord_agent/code.html", nav: null, actions: {} },
    "confirmation_biometrique_agent": { space: "agent", back: ROOT + "tableau_de_bord_agent/code.html", nav: null, actions: {} },

    "carte_agents_guichets": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: "map", actions: {} },
    "localiser_un_agent_switch": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: "map", actions: {} },
    "d_tail_de_l_agent_switch": { space: "user", back: ROOT + "carte_agents_guichets/code.html", nav: null, actions: {} },
    "budget_analyse_depenses": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "partage_addition_split": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "mode_hors_ligne_ussd": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "appareils_connectes_securite": { space: "user", back: ROOT + "s_curit/code.html", nav: null, actions: {} },
    "code_retrait_especes_agent": { space: "user", back: ROOT + "retrait_de_fonds/code.html", nav: null, actions: {} },
    "code_depot_especes_agent": { space: "user", back: ROOT + "d_p_t_de_fonds/code.html", nav: null, actions: {} },
    "verification_niveau_superieur": { space: "user", back: ROOT + "limites_de_transaction/code.html", nav: null, actions: {} },
    "resultat_verification_kyc": { space: "user", back: ROOT + "verification_niveau_superieur/code.html", nav: null, actions: {} },
    "succes_verification_niveau2": { space: "user", back: ROOT + "limites_de_transaction/code.html", nav: null, actions: {} },
    "conditions_utilisation": { space: "user", back: ROOT + "inscription/code.html", nav: null, actions: {} },
    "politique_confidentialite": { space: "user", back: ROOT + "inscription/code.html", nav: null, actions: {} },
    "centre_de_notifications": { space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null, actions: {} },
    "modification_du_code_pin": { space: "user", back: ROOT + "s_curit/code.html", nav: null, actions: {} },
    "reinitialisation_code_pin": { space: "user", back: ROOT + "connexion/code.html", nav: null, actions: {} },
    "succes_reinitialisation_pin": { space: "user", back: ROOT + "connexion/code.html", nav: null, actions: {} },
    "recu_recharge_sbee": { space: "user", back: ROOT + "paiement_sbee_electricite/code.html", nav: null, actions: {} },

    "kyc_verification_identite": {
      space: "user", back: ROOT + "limites_de_transaction/code.html", nav: null,
      actions: { "Valider": ROOT + "succes_verification_niveau2/code.html", "Activer": ROOT + "succes_verification_niveau2/code.html", "Continuer": ROOT + "succes_verification_niveau2/code.html" }
    },
    "bienvenue_succes_onboarding": {
      space: "user", back: ROOT + "tableau_de_bord_mis_jour/code.html", nav: null,
      actions: { "Accéder": ROOT + "tableau_de_bord_mis_jour/code.html", "Tableau de bord": ROOT + "tableau_de_bord_mis_jour/code.html", "Dépôt": ROOT + "d_p_t_de_fonds/code.html" }
    },
    "setup_point_de_vente_marchand": {
      space: "merchant", back: ROOT + "v_rification_marchand/code.html", nav: null,
      actions: { "Ouvrir": ROOT + "tableau_de_bord_marchand/code.html", "Tableau de bord": ROOT + "tableau_de_bord_marchand/code.html" }
    },
    "agent_verification_caution": {
      space: "agent", back: ROOT + "inscription_agent_switch/code.html", nav: null,
      actions: { "Activer": ROOT + "tableau_de_bord_agent/code.html", "Valider": ROOT + "tableau_de_bord_agent/code.html" }
    },

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
      actions: { "Vérifier": ROOT + "setup_point_de_vente_marchand/code.html", "Confirmer": ROOT + "setup_point_de_vente_marchand/code.html", "Continuer": ROOT + "setup_point_de_vente_marchand/code.html", "Soumettre": ROOT + "setup_point_de_vente_marchand/code.html" }
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
      space: "merchant", back: ROOT + "tableau_de_bord_marchand/code.html", nav: "m-qr",
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
    "messagerie_marchand_clients": { space: "merchant", back: ROOT + "tableau_de_bord_agent_mixte/code.html", nav: "m-messages", actions: {} },
    "liens_de_paiement_marchand": { space: "merchant", back: ROOT + "tableau_de_bord_agent_mixte/code.html", nav: "m-sales", actions: {} },
    "carnet_de_dettes_marchand": { space: "merchant", back: ROOT + "tableau_de_bord_agent_mixte/code.html", nav: "m-debt", actions: {} },

    "inscription_agent_switch": {
      space: "agent", back: ROOT + "tableau_de_bord_agent/code.html", nav: null,
      actions: { "Soumettre": ROOT + "agent_verification_caution/code.html", "Continuer": ROOT + "agent_verification_caution/code.html", "S'inscrire": ROOT + "agent_verification_caution/code.html", "Terminer": ROOT + "agent_verification_caution/code.html" }
    },
    "connexion_agent": {
      space: "agent", back: ROOT + "tableau_de_bord_agent_mixte/code.html", nav: null, actions: {}
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
      space: "agent", back: ROOT + "tableau_de_bord_agent/code.html", nav: null,
      actions: {}
    },
    "retrait_de_fonds_mis_jour_agent": {
      space: "agent", back: ROOT + "tableau_de_bord_agent/code.html", nav: null,
      actions: {}
    },
    "valider_une_op_ration_client": {
      space: "agent", back: ROOT + "tableau_de_bord_agent/code.html", nav: "a-serve",
      actions: { "Valider": ROOT + "recu_operation_agent/code.html", "Approuver": ROOT + "recu_operation_agent/code.html", "Confirmer": ROOT + "recu_operation_agent/code.html" }
    },
    "demande_de_r_approvisionnement_float": {
      space: "agent", back: ROOT + "tableau_de_bord_agent/code.html", nav: null,
      actions: {}
    },
    "recu_operation_agent": {
      space: "agent", back: ROOT + "tableau_de_bord_agent/code.html", nav: null,
      actions: { "Accueil": ROOT + "tableau_de_bord_agent/code.html", "Retour": ROOT + "tableau_de_bord_agent/code.html" }
    },
    "param_tres_et_profil_agent": {
      space: "agent", back: ROOT + "tableau_de_bord_agent/code.html", nav: "a-profile",
      actions: { "Enregistrer": ROOT + "tableau_de_bord_agent/code.html" }
    },
    "tableau_de_bord_agent_mixte": {
      space: "merchant", back: null, nav: "m-home",
      actions: {
        "Vitrine": ROOT + "catalogue_produits_services/code.html",
        "Catalogue": ROOT + "catalogue_produits_services/code.html",
        "Caisse": ROOT + "caisse_marchand_pos/code.html",
        "Ventes": ROOT + "historique_des_ventes/code.html",
        "Messages": ROOT + "catalogue_produits_services/code.html?tab=messages",
        "Guichet": ROOT + "tableau_de_bord_agent/code.html",
        "Agent": ROOT + "tableau_de_bord_agent/code.html"
      }
    },
    "catalogue_produits_services": {
      space: "merchant", back: ROOT + "tableau_de_bord_agent_mixte/code.html", nav: "m-catalog",
      actions: {
        "Marketplace": ROOT + "marketplace_boutiques_switch/code.html",
        "Accueil": ROOT + "tableau_de_bord_agent_mixte/code.html"
      }
    },
    "caisse_marchand_pos": {
      space: "merchant", back: ROOT + "tableau_de_bord_agent_mixte/code.html", nav: "m-pos",
      actions: {
        "Accueil": ROOT + "tableau_de_bord_agent_mixte/code.html"
      }
    },
    "carnet_de_dettes_marchand": {
      space: "merchant", back: ROOT + "tableau_de_bord_agent_mixte/code.html", nav: "m-debt",
      actions: {
        "Accueil": ROOT + "tableau_de_bord_agent_mixte/code.html"
      }
    },
    "param_tres_et_profil_hybride": {
      space: "merchant", back: ROOT + "tableau_de_bord_agent_mixte/code.html", nav: "m-profile",
      actions: {
        "Accueil": ROOT + "tableau_de_bord_agent_mixte/code.html"
      }
    },
    "historique_des_ventes": {
      space: "merchant", back: ROOT + "tableau_de_bord_agent_mixte/code.html", nav: "m-sales",
      actions: {
        "Accueil": ROOT + "tableau_de_bord_agent_mixte/code.html"
      }
    },
  };

  const NAV_BAR_STYLE = [
    "position:fixed", "bottom:0",
    "left:0", "right:0",
    "margin-left:auto", "margin-right:auto",
    "transform:none", "-webkit-transform:none",
    "width:100%", "max-width:576px",
    "height:64px",
    "z-index:90", "display:flex", "align-items:center",
    "justify-content:space-around", "padding:6px 10px",
    "padding-bottom:max(8px, env(safe-area-inset-bottom, 8px))",
    "background:rgba(255, 255, 255, 0.98)",
    "backdrop-filter:blur(12px)",
    "-webkit-backdrop-filter:blur(12px)",
    "border-top:1px solid #ECE6F0",
    "border-left:1px solid #ECE6F0",
    "border-right:1px solid #ECE6F0",
    "border-top-left-radius:24px",
    "border-top-right-radius:24px",
    "box-shadow:0 -4px 20px rgba(0,0,0,0.08)",
    "box-sizing:border-box",
  ].join(";");

  function navItemHTML(href, icon, label, active, badgeCount) {
    const color = active ? "#5e3bdc" : "#79747E";
    const badgeHTML = badgeCount ? `<span style="position:absolute;top:-2px;right:calc(50% - 15px);background:#EF4444;color:#ffffff;font-size:9px;font-weight:900;border-radius:99px;min-width:16px;height:16px;display:flex;align-items:center;justify-content:center;padding:0 3px;border:1.5px solid #ffffff;box-shadow:0 2px 4px rgba(239,68,68,0.4);">${badgeCount}</span>` : "";
    return `
  <a href="${href}" data-spa="true" style="display:flex;flex-direction:column;align-items:center;gap:2px;color:${color};text-decoration:none;flex:1;position:relative;">
    ${badgeHTML}
    <span class="material-symbols-outlined" style="font-size:22px;${active ? "font-variation-settings:'FILL' 1;" : ""}">${icon}</span>
    <span class="nav-label" style="font-size:10px;font-weight:${active ? "700" : "500"};color:${color};">${label}</span>
  </a>`;
  }

  function navCenterItemHTML(href, icon, label, active) {
    return `
  <a href="${href}" data-spa="true" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;position:relative;top:-10px;margin:0 2px;flex:1;">
    <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#7B5CFA 0%,#5E3BDC 100%);color:#ffffff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(94,59,220,0.35);transition:transform 0.15s ease;">
      <span class="material-symbols-outlined" style="font-size:22px;font-variation-settings:'FILL' 1;">${icon}</span>
    </div>
    <span class="nav-label" style="font-size:10px;font-weight:700;color:#5E3BDC;margin-top:1px;">${label}</span>
  </a>`;
  }

  function navHTML(space, activeTab) {
    if (space === "user") {
      return `
<nav id="switch-nav" role="navigation" aria-label="Navigation principale">
  ${navItemHTML(ROOT + "tableau_de_bord_mis_jour/code.html", "home", "Accueil", activeTab === "home")}
  ${navItemHTML(ROOT + "achats_en_ligne_cartes_virtuelles/code.html", "credit_card", "Cartes", activeTab === "cards" || activeTab === "wallet")}
  ${navCenterItemHTML(ROOT + "scanner_qr_code/code.html", "qr_code_scanner", "Payer QR", activeTab === "qr")}
  ${navItemHTML(ROOT + "coffre_epargne_vault/code.html", "savings", "Vault", activeTab === "vault")}
  ${navItemHTML(ROOT + "param_tres_g_n_raux/code.html", "settings", "Paramètres", activeTab === "settings" || activeTab === "profile")}
</nav>`;
    }
    if (space === "merchant" || space === "hybrid") {
      return `
<nav id="switch-nav" role="navigation" aria-label="Navigation Marchand Boutique">
  ${navItemHTML(ROOT + "tableau_de_bord_agent_mixte/code.html", "home", "Accueil", activeTab === "m-home" || activeTab === "h-home")}
  ${navItemHTML(ROOT + "catalogue_produits_services/code.html", "storefront", "Vitrine", activeTab === "m-catalog" || activeTab === "m-sales" || activeTab === "m-history")}
  ${navCenterItemHTML(ROOT + "caisse_marchand_pos/code.html", "point_of_sale", "Caisse POS", activeTab === "m-pos" || activeTab === "m-qr" || activeTab === "h-shop")}
  ${navItemHTML(ROOT + "messagerie_marchand_clients/code.html", "chat", "Messages", activeTab === "m-messages" || activeTab === "m-chat", 3)}
  ${navItemHTML(ROOT + "param_tres_et_profil_hybride/code.html", "manage_accounts", "Profil", activeTab === "m-profile" || activeTab === "h-profile")}
</nav>`;
    }

    if (space === "agent") {
      const isHybrid = localStorage.getItem("switch_is_hybrid") === "true";
      const agentHomeUrl = isHybrid ? (ROOT + "tableau_de_bord_agent/code.html") : (ROOT + "tableau_de_bord_agent_simple/code.html");
      return `
<nav id="switch-nav" role="navigation" aria-label="Navigation Agent">
  ${navItemHTML(agentHomeUrl, "dashboard", "Accueil", activeTab === "a-home")}
  ${navItemHTML(ROOT + "services_factures_agent/code.html", "apps", "Services", activeTab === "a-services")}
  ${navCenterItemHTML(ROOT + "valider_une_op_ration_client/code.html", "qr_code_scanner", "Servir", activeTab === "a-serve")}
  ${navItemHTML(ROOT + "cloture_de_caisse_agent/code.html", "point_of_sale", "Caisse", activeTab === "a-caisse")}
  ${navItemHTML(ROOT + "param_tres_et_profil_agent/code.html", "manage_accounts", "Profil", activeTab === "a-profile")}
</nav>`;
    }
    return "";
  }

  // ── CACHE EN MÉMOIRE ET MOTEUR SPA INSTANTANÉ (0.00ms) ────────
  const pageCache = new Map();

  async function getPageData(urlStr) {
    const norm = new URL(urlStr, window.location.href).href;
    if (pageCache.has(norm)) {
      return pageCache.get(norm);
    }
    const resp = await fetch(norm);
    if (!resp.ok) throw new Error("HTTP error " + resp.status);
    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Extraire les styles personnalisés
    const styles = Array.from(doc.querySelectorAll("head style")).map(s => s.textContent).join("\n");

    // Extraire les scripts inline de la page
    const scripts = Array.from(doc.body.querySelectorAll("script")).map(s => {
      return { src: s.getAttribute("src"), content: s.textContent };
    }).filter(s => {
      if (s.src && (s.src.includes("switch.router.js") || s.src.includes("tailwindcss") || s.src.includes("switch.config.js"))) {
        return false;
      }
      return true;
    });

    // Supprimer tout nav statique dans le body parsé pour garder notre barre active
    doc.body.querySelectorAll("nav").forEach(n => n.remove());

    const data = {
      title: doc.title || "Switch Bénin",
      bodyClass: doc.body.className || "",
      bodyHTML: doc.body.innerHTML,
      customCSS: styles,
      scripts: scripts
    };

    pageCache.set(norm, data);
    return data;
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
    if (targetUrl.startsWith("javascript:") || targetUrl.startsWith("tel:") || targetUrl.startsWith("mailto:")) return;

    let normalizedUrl = targetUrl;
    try {
      normalizedUrl = new URL(targetUrl, window.location.href).href;
      const pageData = await getPageData(normalizedUrl);
      if (pageData.title) document.title = pageData.title;
      if (pageData.bodyClass) document.body.className = pageData.bodyClass;

      // 1. Mettre à jour les styles CSS dynamiques
      let dynStyle = document.getElementById("switch-screen-styles");
      if (!dynStyle) {
        dynStyle = document.createElement("style");
        dynStyle.id = "switch-screen-styles";
        document.head.appendChild(dynStyle);
      }
      dynStyle.textContent = pageData.customCSS || "";

      // 2. Mettre à jour l'URL sans aucun rechargement de page
      if (pushState && window.location.href !== normalizedUrl) {
        window.history.pushState({ url: normalizedUrl }, "", normalizedUrl);
      }

      // 3. Injecter le nouveau contenu HTML
      document.body.innerHTML = pageData.bodyHTML;

      // 4. Exécuter les scripts interactifs de la page
      pageData.scripts.forEach(s => {
        const sc = document.createElement("script");
        if (s.src) {
          sc.src = s.src;
        } else {
          sc.textContent = s.content;
        }
        document.body.appendChild(sc);
      });

      // 5. Initialiser les écouteurs, la barre de navigation correspondante et le scroll
      init();
      if (window.SwitchSecurity) {
        window.SwitchSecurity.init();
      }
      applyGlobalKycState();
      if (typeof window.renderProducts === "function") {
        try { window.renderProducts(); } catch (e) {}
      }
      if (typeof window.switchInitForms === "function") {
        window.switchInitForms();
      }
      window.scrollTo(0, 0);

    } catch (err) {
      console.warn("[Switch Router] Navigation directe fallback:", err);
      window.location.href = normalizedUrl;
    }
  }

  function applyGlobalKycState() {
    try {
      const level = localStorage.getItem("switch_kyc_level") || "1";
      const kycBadge = document.getElementById("kyc-badge");
      const heroCard = document.getElementById("hero-card");
      const greetingSub = document.getElementById("time-greeting");

      if (level === "3") {
        if (kycBadge) {
          kycBadge.innerHTML = "👑 Niveau 3 VIP • 10M FCFA";
          kycBadge.className = "text-[10px] font-black uppercase bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-sm";
        }
        if (heroCard) {
          heroCard.className = "hero-gradient text-white rounded-[32px] p-6 relative overflow-hidden flex flex-col justify-between min-h-[190px] ring-2 ring-amber-400/40 shadow-2xl";
        }
        if (greetingSub) {
          greetingSub.textContent = "Membre VIP ⭐";
        }
      } else if (level === "2") {
        if (kycBadge) {
          kycBadge.innerHTML = "Niveau 2 Vérifié • 2M FCFA";
          kycBadge.className = "text-[10px] font-black uppercase bg-emerald-400 text-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-sm";
        }
        if (heroCard) {
          heroCard.className = "hero-gradient text-white rounded-[32px] p-6 relative overflow-hidden flex flex-col justify-between min-h-[190px]";
        }
        if (greetingSub) {
          greetingSub.textContent = "Compte Vérifié ANIP ✅";
        }
      } else {
        if (kycBadge) {
          kycBadge.innerHTML = "Niveau 1 • Plafond 500 000 FCFA";
          kycBadge.className = "text-[10px] font-black uppercase bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white border border-white/20 shadow-sm";
        }
        if (heroCard) {
          heroCard.className = "hero-gradient text-white rounded-[32px] p-6 relative overflow-hidden flex flex-col justify-between min-h-[190px]";
        }
        if (greetingSub) {
          greetingSub.textContent = "Nouveau Compte (Niv. 1)";
        }
      }
      if (typeof window.renderLimitsPage === "function") {
        window.renderLimitsPage();
      }
    } catch (e) {}
  }
  window.applyGlobalKycState = applyGlobalKycState;

  function createBackButton() {
    const path = (window.location.pathname || "").toLowerCase();
    const title = (document.title || "").toLowerCase();
    if (path.includes("inscri") || path.includes("connex") || path.includes("onboard") || path.includes("splash") || title.includes("inscription") || title.includes("connexion")) {
      return null;
    }

    const btn = document.createElement("button");
    btn.className = "switch-back-btn";
    btn.setAttribute("aria-label", "Retour");
    btn.style.cssText = [
      "position:fixed", "top:max(14px, env(safe-area-inset-top, 14px))",
      "left:max(14px, calc((100vw - var(--app-max-width, 520px)) / 2 + 14px))",
      "z-index:150",
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
    if (avatarImg.getAttribute("data-no-link") === "true" || avatarImg.closest("[data-no-link='true']")) {
      return;
    }
    const clickTarget = avatarImg.closest("div") || avatarImg;
    clickTarget.style.cursor = "pointer";
    clickTarget.addEventListener("click", function (e) {
      e.preventDefault();
      switchNavigate(ROOT + "profil_utilisateur/code.html");
    });
    const greeting = document.querySelector("[data-i18n='greeting']");
    if (greeting && greeting.getAttribute("data-no-link") !== "true") {
      greeting.style.cursor = "pointer";
      greeting.addEventListener("click", function (e) {
        e.preventDefault();
        switchNavigate(ROOT + "profil_utilisateur/code.html");
      });
    }
  }

  function getCurrentScreen() {
    let path = window.location.pathname || "";
    try { path = decodeURIComponent(path); } catch (e) {}

    // Priorité absolue aux pages hybrides
    if (path.includes("agent_mixte") || path.includes("hybride")) {
      if (path.includes("services_factures_hybride")) return "services_factures_hybride";
      if (path.includes("cloture_de_caisse_hybride")) return "cloture_de_caisse_hybride";
      if (path.includes("param_tres_et_profil_hybride")) return "param_tres_et_profil_hybride";
      return "tableau_de_bord_agent_mixte";
    }

    const parts = path.split("/").map(function (p) {
      return p.trim();
    }).filter(function (p) {
      return p && p !== "code.html" && p !== "code" && p !== "index.html";
    });

    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (SCREENS[part]) return part;
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i].toLowerCase();
      // 1. Correspondance exacte insensible à la casse
      for (const key of Object.keys(SCREENS)) {
        if (key.toLowerCase() === part) return key;
      }
      // 2. Correspondance exacte après suppression des séparateurs
      const normPart = part.replace(/[^a-z0-9]/gi, "");
      for (const key of Object.keys(SCREENS)) {
        const normKey = key.replace(/[^a-z0-9]/gi, "");
        if (normKey === normPart) return key;
      }
    }

    const title = (document.title || "").toLowerCase();
    if (title.includes("hybride") || title.includes("mixte") || title.includes("boutique & guichet")) return "tableau_de_bord_agent_mixte";
    if (title.includes("tableau de bord") || title.includes("accueil")) {
      if (title.includes("agent")) return "tableau_de_bord_agent";
      if (title.includes("marchand")) return "tableau_de_bord_marchand";
      return "tableau_de_bord_mis_jour";
    }

    return null;
  }

  function init() {
    applyGlobalKycState();

    // Activation automatique du bouclier de sécurité SwitchSecurity
    if (!window.SwitchSecurity && !document.querySelector('script[src*="switch.security.js"]')) {
      const secScript = document.createElement("script");
      secScript.src = ROOT + "assets/switch.security.js?v=5.0";
      secScript.defer = true;
      document.head.appendChild(secScript);
    }

    // Connexion automatique à l'API RESTful SwitchAPI
    if (!window.SwitchAPI && !document.querySelector('script[src*="switch.api.js"]')) {
      const apiScript = document.createElement("script");
      apiScript.src = ROOT + "assets/switch.api.js";
      apiScript.defer = true;
      document.head.appendChild(apiScript);
    }

    // Manifest PWA pour installation sur smartphone
    if (!document.querySelector('link[rel="manifest"]')) {
      const mLink = document.createElement("link");
      mLink.rel = "manifest";
      mLink.href = "/manifest.json";
      document.head.appendChild(mLink);
    }

    const screenKey = getCurrentScreen();
    const config = SCREENS[screenKey];

    const isSignupScreen = (window.location.pathname || "").toLowerCase().includes("inscri") || 
                           (window.location.pathname || "").toLowerCase().includes("connex") || 
                           (window.location.pathname || "").toLowerCase().includes("onboard") || 
                           (document.title || "").toLowerCase().includes("inscription") || 
                           (document.title || "").toLowerCase().includes("connexion") || 
                           (screenKey && (screenKey.includes("inscri") || screenKey.includes("connex")));

    if (isSignupScreen) {
      document.querySelectorAll(".switch-back-btn").forEach(b => b.remove());
    }

    if (!config) {
      document.querySelectorAll(".switch-back-btn").forEach(b => b.remove());
      return;
    }

    const { space, back, nav, actions } = config;

    if (DASHBOARD_KEYS.includes(screenKey)) {
      sessionStorage.setItem("switchActiveSpace", space);
    }

    if (nav) {
      document.body.style.paddingBottom = "calc(96px + env(safe-area-inset-bottom, 16px))";
      const existingNav = document.getElementById("switch-nav");
      if (existingNav) {
        document.querySelectorAll("nav:not(#switch-nav)").forEach(function (n) { n.remove(); });
        existingNav.outerHTML = navHTML(space, nav);
      } else {
        document.querySelectorAll("nav").forEach(function (n) { n.remove(); });
        const navEl = document.createElement("div");
        navEl.innerHTML = navHTML(space, nav);
        document.body.appendChild(navEl.firstElementChild);
      }
    } else {
      document.body.style.paddingBottom = "calc(24px + env(safe-area-inset-bottom, 16px))";
      document.querySelectorAll("nav").forEach(function (existingNav) { existingNav.remove(); });
    }

    let existingBackBtn = document.querySelector('button[aria-label="Retour"], button.switch-back-btn, button.back-btn, [data-action="back"], a[aria-label="Retour"]');
    if (!existingBackBtn) {
      const allClickables = document.querySelectorAll("button, a");
      for (const el of allClickables) {
        if (el.textContent && el.textContent.includes("arrow_back")) {
          existingBackBtn = el;
          break;
        }
      }
    }

    if (existingBackBtn) {
      if (!existingBackBtn.hasAttribute("onclick") && existingBackBtn.getAttribute("data-no-router") !== "true") {
        existingBackBtn.addEventListener("click", handleBack);
      }
    } else if (back) {
      const backBtn = createBackButton();
      if (backBtn) document.body.insertBefore(backBtn, document.body.firstChild);
    } else {
      document.querySelectorAll(".switch-back-btn").forEach(b => b.remove());
    }

    wireActions(actions);
    wireAvatarToProfile(space);

    // Précharge en arrière-plan pendant les temps d'inactivité du processeur
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => preloadSpaceTabs(space), { timeout: 2000 });
    } else {
      setTimeout(() => preloadSpaceTabs(space), 800);
    }
  }

  function preloadSpaceTabs(space) {
    let tabs = [];
    if (space === "user") {
      tabs = [
        ROOT + "tableau_de_bord_mis_jour/code.html",
        ROOT + "achats_en_ligne_cartes_virtuelles/code.html",
        ROOT + "scanner_qr_code/code.html",
        ROOT + "coffre_epargne_vault/code.html",
        ROOT + "param_tres_g_n_raux/code.html"
      ];
    } else if (space === "agent") {
      tabs = [
        ROOT + "tableau_de_bord_agent/code.html",
        ROOT + "services_factures_agent/code.html",
        ROOT + "valider_une_op_ration_client/code.html",
        ROOT + "cloture_de_caisse_agent/code.html",
        ROOT + "param_tres_et_profil_agent/code.html"
      ];
    } else if (space === "merchant") {
      tabs = [
        ROOT + "tableau_de_bord_marchand/code.html",
        ROOT + "historique_des_ventes/code.html",
        ROOT + "g_n_rer_qr_code_de_r_ception/code.html",
        ROOT + "profil_de_l_entreprise/code.html",
        ROOT + "support_marchand/code.html"
      ];
    }
    tabs.forEach(t => {
      getPageData(t).catch(() => {});
    });
  }

  // Interception universelle des clics pour une transition SPA instantanée sans rechargement
  document.addEventListener("click", function (e) {
    const backBtn = e.target.closest('button[aria-label="Retour"], button.switch-back-btn, button.back-btn, #back-btn, .btn-back, [data-action="back"]');
    if (backBtn) {
      if (backBtn.hasAttribute("onclick") || backBtn.getAttribute("data-no-router") === "true") {
        return;
      }
      handleBack(e);
      return;
    }

    const btn = e.target.closest("button");
    if (btn && btn.textContent && btn.textContent.includes("arrow_back") && !btn.hasAttribute("onclick") && btn.getAttribute("data-no-router") !== "true") {
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

  // Chargement automatique du moteur de réalisme SwitchEngine
  if (!window.SwitchEngine) {
    const engineScript = document.createElement("script");
    engineScript.src = ROOT + "assets/switch.engine.js";
    engineScript.async = false;
    document.head.appendChild(engineScript);
  }

  // Clic sonore doux sur les boutons interactifs
  document.addEventListener("click", function(e) {
    const interactive = e.target.closest("button, .btn-primary, .btn-secondary, .action-bubble, .service-card, .contact-card");
    if (interactive && window.SwitchEngine) {
      window.SwitchEngine.playSound("click");
      window.SwitchEngine.haptic([15]);
    }
  }, true);

  // Gestion du bouton précédent / suivant du navigateur en mode SPA instantané
  window.addEventListener("popstate", function () {
    switchNavigate(window.location.href, false);
  });

  window.switchNavigate = switchNavigate;
  window.switchHandleBack = handleBack;
  window.switchRouterInit = init;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();