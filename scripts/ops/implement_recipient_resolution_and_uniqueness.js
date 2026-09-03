const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('=== IMPLÉMENTATION RIGOUREUSE DE L\'UNICITÉ DU NUMÉRO ET DE LA RÉSOLUTON BÉNÉFICIAIRE ===');

// 1. Mise à jour de assets/switch.api.js avec le modèle de compte centralisé et resolveRecipient
let apiCode = fs.readFileSync('assets/switch.api.js', 'utf8');

const globalUniquenessAndRecipientCode = `
    // =========================================================================
    // MODÈLE DE COMPTE CENTRALISÉ & RÈGLE GLOBALE "1 NUMÉRO = 1 IDENTITÉ SWITCH"
    // =========================================================================

    /**
     * Initialise et récupère le répertoire central des comptes Switch
     */
    getCentralAccounts: function () {
      try {
        const raw = localStorage.getItem('switch_accounts');
        if (raw) return JSON.parse(raw);
      } catch (e) {}

      // Répertoire initial par défaut
      const defaultAccounts = [
        {
          account_id: "ACC-0197102030",
          phone_normalized: "0197102030",
          account_number: "9710203001",
          legal_name: "Jean Koffi Adjovi",
          display_name: "Jean K. A.",
          roles: ["user", "merchant"],
          status: "active",
          kyc_level: 2,
          merchant_details: {
            business_name: "Boutique & Restaurant La Plage",
            rccm: "RB/COT/24-B-8821",
            ifu: "3202415987102",
            city: "Cotonou",
            district: "Haie Vive"
          }
        },
        {
          account_id: "ACC-0197004092",
          phone_normalized: "0197004092",
          account_number: "9700409215",
          legal_name: "Koffi Agent Guichet",
          display_name: "Koffi A. (Guichetier)",
          roles: ["user", "agent"],
          status: "active",
          kyc_level: 2,
          agent_details: {
            kiosk_name: "Kiosque Switch Haie Vive",
            agent_code: "AGT-4092",
            city: "Cotonou",
            district: "Haie Vive"
          }
        },
        {
          account_id: "ACC-0197123456",
          phone_normalized: "0197123456",
          account_number: "9712345601",
          legal_name: "Sossou Marc",
          display_name: "Marc S.",
          roles: ["user"],
          status: "active",
          kyc_level: 1
        },
        {
          account_id: "ACC-0196442211",
          phone_normalized: "0196442211",
          account_number: "9644221101",
          legal_name: "Boutique Akpakpa Dodomè",
          display_name: "Akpakpa Market",
          roles: ["user", "merchant", "agent"],
          status: "active",
          kyc_level: 2,
          merchant_details: { business_name: "Akpakpa Market Services", city: "Cotonou", district: "Akpakpa" },
          agent_details: { kiosk_name: "Point Relais Akpakpa Dodomè", agent_code: "AGT-2211", city: "Cotonou", district: "Akpakpa" }
        }
      ];

      localStorage.setItem('switch_accounts', JSON.stringify(defaultAccounts));
      return defaultAccounts;
    },

    /**
     * Sauvegarde la liste des comptes
     */
    saveCentralAccounts: function (accounts) {
      localStorage.setItem('switch_accounts', JSON.stringify(accounts));
    },

    /**
     * Contrainte globale d'unicité sur le numéro de téléphone normalisé
     */
    checkGlobalPhoneUniqueness: async function (phone) {
      const digits = (phone || '').replace(/\\D/g, '');
      if (!digits) return { exists: false };

      let normalized = digits;
      if (normalized.startsWith('229')) normalized = normalized.slice(3);
      if (normalized.length === 8) normalized = '01' + normalized;

      const accounts = this.getCentralAccounts();
      const existing = accounts.find(a => a.phone_normalized === normalized);

      const currentPhone = (localStorage.getItem('switch_user_phone_raw') || localStorage.getItem('switch_user_phone') || '').replace(/\\D/g, '');

      if (existing) {
        // Si c'est l'utilisateur courant, il peut ajouter un rôle
        const isCurrentAuthUser = (currentPhone && (currentPhone.includes(normalized) || normalized.includes(currentPhone)));
        return {
          exists: true,
          is_current_user: isCurrentAuthUser,
          account: existing,
          message: "Ce numéro est déjà associé à un compte Switch. Connectez-vous avec ce compte ou demandez l’activation d’un rôle supplémentaire."
        };
      }

      return { exists: false, normalized: normalized };
    },

    /**
     * Ajoute un rôle supplémentaire à un compte existant
     */
    addRoleToAccount: async function (phone, newRole, roleData = {}) {
      const check = await this.checkGlobalPhoneUniqueness(phone);
      if (!check.exists || !check.account) {
        return { success: false, message: "Compte principal introuvable pour ce numéro." };
      }

      const accounts = this.getCentralAccounts();
      const acc = accounts.find(a => a.phone_normalized === check.account.phone_normalized);
      if (!acc) return { success: false, message: "Compte introuvable." };

      if (!acc.roles.includes(newRole)) {
        acc.roles.push(newRole);
      }

      if (newRole === 'merchant' && roleData.business_name) {
        acc.merchant_details = { ...(acc.merchant_details || {}), ...roleData };
      } else if (newRole === 'agent' && roleData.kiosk_name) {
        acc.agent_details = { ...(acc.agent_details || {}), ...roleData };
      }

      this.saveCentralAccounts(accounts);
      return {
        success: true,
        account: acc,
        message: \`Rôle '\${newRole}' ajouté avec succès au compte \${acc.account_number}.\`
      };
    },

    /**
     * Résolution sécurisée du bénéficiaire avant paiement / transfert
     * SwitchAPI.resolveRecipient(identifier, operationType)
     */
    resolveRecipient: async function (identifier, operationType = 'transfer') {
      const raw = (identifier || '').replace(/\\D/g, '');
      let normalizedPhone = raw;
      if (normalizedPhone.startsWith('229')) normalizedPhone = normalizedPhone.slice(3);
      if (normalizedPhone.length === 8) normalizedPhone = '01' + normalizedPhone;

      const accounts = this.getCentralAccounts();
      let acc = accounts.find(a => a.phone_normalized === normalizedPhone || a.account_number === raw);

      // Recherche par nom de marchand si c'est un paiement marchand
      if (!acc && operationType === 'merchant_pay') {
        acc = accounts.find(a => a.merchant_details && a.merchant_details.business_name.toLowerCase().includes(String(identifier).toLowerCase()));
      }

      // Recherche par nom de kiosque agent si c'est une opération guichet
      if (!acc && (operationType === 'agent_withdraw' || operationType === 'agent_deposit')) {
        acc = accounts.find(a => a.agent_details && a.agent_details.kiosk_name.toLowerCase().includes(String(identifier).toLowerCase()));
      }

      if (!acc || acc.status === 'suspended') {
        return {
          is_valid: false,
          message: "Bénéficiaire introuvable ou compte inactif. Veuillez vérifier le numéro ou l'identifiant."
        };
      }

      // Formatage sécurisé du nom masqué (ex: Jean Koffi Adjovi -> Jean K. A.)
      let displayName = acc.display_name || acc.legal_name || "Utilisateur Switch";
      if (!acc.display_name && acc.legal_name) {
        const parts = acc.legal_name.trim().split(/\\s+/);
        if (parts.length >= 2) {
          displayName = parts[0] + ' ' + parts.slice(1).map(p => p[0].toUpperCase() + '.').join(' ');
        }
      }

      const roles = acc.roles || ['user'];
      const isMerchant = roles.includes('merchant');
      const isAgent = roles.includes('agent');
      const isHybrid = isMerchant && isAgent;

      let banner = "";
      if (isHybrid) {
        const merchName = (acc.merchant_details && acc.merchant_details.business_name) || displayName;
        banner = \`\${merchName} — Marchand et Agent Switch\`;
      } else if (isMerchant) {
        const merchName = (acc.merchant_details && acc.merchant_details.business_name) || displayName;
        banner = \`Vous payez : \${merchName} — Marchand Switch\`;
      } else if (isAgent) {
        const kioskName = (acc.agent_details && acc.agent_details.kiosk_name) || displayName;
        banner = \`Vous retirez chez : \${kioskName} — Agent agréé\`;
      } else {
        banner = \`Vous envoyez à : \${displayName}\`;
      }

      return {
        is_valid: true,
        account_id: acc.account_id,
        phone_normalized: acc.phone_normalized,
        account_number: acc.account_number,
        roles: roles,
        display_name: displayName,
        legal_name: acc.legal_name,
        merchant_name: acc.merchant_details ? acc.merchant_details.business_name : null,
        kiosk_name: acc.agent_details ? acc.agent_details.kiosk_name : null,
        kiosk_location: acc.agent_details ? (acc.agent_details.district + ', ' + acc.agent_details.city) : null,
        formatted_banner: banner,
        status: acc.status
      };
    },
`;

if (!apiCode.includes('checkGlobalPhoneUniqueness')) {
  apiCode = apiCode.replace('  const SwitchAPI = {', '  const SwitchAPI = {\n' + globalUniquenessAndRecipientCode);
}

fs.writeFileSync('assets/switch.api.js', apiCode);
fs.writeFileSync('www/assets/switch.api.js', apiCode);
console.log('✔ assets/switch.api.js mis à jour avec le répertoire central, checkGlobalPhoneUniqueness et resolveRecipient');
