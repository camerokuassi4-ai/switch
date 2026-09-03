/**
 * tests/beta-phase1-automated-tests.js
 * ══════════════════════════════════════════════════════════════════════════
 *  HARNAIS DE TEST AUTOMATISÉ — Phase 1 Bêta Utilisateur Switch Bénin 🇧🇯
 *  Node.js v18+ | fetch natif | crypto natif | SANS navigateur réel
 * ══════════════════════════════════════════════════════════════════════════
 *  Cible : https://switch-git-release-beta-public-v210-primus5.vercel.app
 *
 *  Suites :
 *   Test 1  — Absence de données factices
 *   Test 2  — Solde unique et réel (0 FCFA par défaut)
 *   Test 3  — Empty states propres
 *   Test 4  — Règle « Un Numéro = Un Compte »
 *   Test 5  — Cohérence du profil (dynamique, sans hard-code)
 *   Test 6  — Synchronisation racine ↔ www/
 * ══════════════════════════════════════════════════════════════════════════
 */

'use strict';

import { createHash }  from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ─── Helpers d'affichage ─── */
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  blue:   '\x1b[34m',
  white:  '\x1b[37m',
  magenta:'\x1b[35m',
};
const hr = (char = '=', len = 68) => char.repeat(len);
const p  = (...a) => console.log(...a);

/* ─── Configuration ─── */
const BASE_URL  = 'https://switch-git-release-beta-public-v210-primus5.vercel.app';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = resolve(__dirname, '..');

/* ─── Registre global des résultats ─── */
const REPORT = {
  suites: [],
  total:  0,
  passed: 0,
  failed: 0,
  errors: 0,
};

/* ====================================================================
   UTILITAIRES
   ==================================================================== */

async function fetchPage(path) {
  // Priorité 1 : fichier local (après corrections, avant redéploiement Vercel)
  if (!path.startsWith('http')) {
    const relPath = path.startsWith('/') ? path.slice(1) : path;
    const localContent = readLocalFile(relPath);
    if (localContent !== null) {
      return { status: 200, url: `local://${relPath}`, text: localContent };
    }
  }

  // Priorité 2 : Vercel (pour les fichiers non présents en local ou URLs absolues)
  const url = path.startsWith('http')
    ? path
    : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'SwitchBetaTestHarness/2.0 (Phase1-Validator)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  });

  const text = await res.text();
  return { status: res.status, url, text };
}

function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

function extractInlineScripts(html) {
  const snippets = [];
  const re = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    snippets.push(m[1].trim());
  }
  return snippets;
}

function sha256(str) {
  return createHash('sha256').update(str, 'utf8').digest('hex');
}

function readLocalFile(relPath) {
  const abs = join(ROOT, relPath);
  if (!existsSync(abs)) return null;
  return readFileSync(abs, 'utf8');
}

function getContext(text, term, contextLines = 3) {
  const lines  = text.split('\n');
  const result = [];
  lines.forEach((line, i) => {
    if (line.includes(term)) {
      const start = Math.max(0, i - contextLines);
      const end   = Math.min(lines.length - 1, i + contextLines);
      result.push({
        matchLine: i + 1,
        snippet: lines.slice(start, end + 1).join('\n'),
      });
    }
  });
  return result;
}

/* ====================================================================
   SYSTEME DE RAPPORT
   ==================================================================== */

function recordTest(opts) {
  const { id, name, pass, detail, snippets = [], fix = null, file = null } = opts;

  REPORT.total++;
  if (pass) REPORT.passed++;
  else       REPORT.failed++;

  REPORT.suites.at(-1).tests.push({ id, name, pass, detail, snippets, fix, file });

  const icon  = pass ? `${C.green}PASS${C.reset}` : `${C.red}FAIL${C.reset}`;
  const label = pass ? `${C.green}${name}${C.reset}` : `${C.red}${name}${C.reset}`;
  p(`  [${icon}]  [${id}] ${label}`);
  if (!pass) {
    p(`        ${C.yellow}=> ${detail}${C.reset}`);
    if (file) p(`        ${C.dim}   Fichier : ${file}${C.reset}`);
    if (fix)  p(`        ${C.cyan}   Correction : ${fix}${C.reset}`);
  }
  if (snippets.length > 0 && !pass) {
    snippets.slice(0, 3).forEach(s => {
      const preview = s.split('\n').slice(0, 10).join('\n');
      p(`\n--- Extrait ---`);
      p(`${C.dim}${preview}${C.reset}`);
      p(`---------------\n`);
    });
  }
}

function startSuite(id, title) {
  REPORT.suites.push({ id, title, tests: [] });
  p(`\n${C.bold}${C.blue}${hr()}${C.reset}`);
  p(`${C.bold}${C.blue}  ${id} -- ${title.toUpperCase()}${C.reset}`);
  p(`${C.bold}${C.blue}${hr()}${C.reset}`);
}

/* ====================================================================
   TEST 1 -- ABSENCE DE DONNEES FACTICES
   ==================================================================== */

async function runTest1() {
  startSuite('TEST 1', 'Absence de donnees factices');

  const pages = [
    { path: '/inscription/code.html',                 label: 'Inscription' },
    { path: '/connexion/code.html',                   label: 'Connexion' },
    { path: '/tableau_de_bord_mis_jour/code.html',    label: 'Dashboard' },
    { path: '/profil_utilisateur/code.html',          label: 'Profil-Utilisateur' },
    { path: '/param_tres_g_n_raux/code.html',         label: 'Parametres-Generaux' },
    { path: '/historique_des_transactions/code.html', label: 'Historique-Transactions' },
  ];

  const FORBIDDEN = [
    { term: 'Adele Doe',          reason: 'Nom factice principal' },
    { term: 'Adele K.',           reason: 'Abreviation nom factice' },
    { term: '50 000 F',           reason: 'Solde fictif 50 000 F' },
    { term: '50 000 FCFA',        reason: 'Solde fictif 50 000 FCFA' },
    { term: '125 000 F',          reason: 'Solde fictif 125 000 F' },
    { term: '125 000 FCFA',       reason: 'Solde fictif 125 000 FCFA' },
    { term: 'Maman Awa',          reason: 'Fausse transaction Maman Awa' },
    { term: 'SW-8921',            reason: 'Faux ID transaction SW-8921' },
    { term: 'SW-8920',            reason: 'Faux ID transaction SW-8920' },
    { term: 'img_046.jpg',        reason: 'Avatar factice img_046.jpg' },
    { term: '+229 97 12 34 56',   reason: 'Faux numero telephone Adele' },
  ];

  for (const page of pages) {
    try {
      const { text, status } = await fetchPage(page.path);

      if (status >= 400) {
        recordTest({
          id:     `T1-${page.label}`,
          name:   `${page.label} -- Chargement HTTP`,
          pass:   false,
          detail: `HTTP ${status} -- page introuvable sur Vercel.`,
          file:   page.path,
          fix:    'Verifier que la route est bien deployee dans vercel.json.',
        });
        continue;
      }

      const clean = stripComments(text);
      const found = [];
      const snippets = [];

      for (const f of FORBIDDEN) {
        if (clean.includes(f.term)) {
          found.push(`"${f.term}" (${f.reason})`);
          const ctx = getContext(clean, f.term, 2);
          ctx.forEach(c => snippets.push(`Ligne ${c.matchLine}:\n${c.snippet}`));
        }
      }

      // Verif "Adele" seul dans les scripts inline
      const inlineScripts = extractInlineScripts(clean);
      const adeleOnlyIn = [];
      inlineScripts.forEach((script, idx) => {
        const hasAdele = script.includes('Adele');
        const isCleanup = script.includes("=== 'Adele'") || script.includes('!== "Adele"');
        if (hasAdele && !isCleanup) {
          adeleOnlyIn.push(`Script inline #${idx + 1}`);
          const ctx = getContext(script, 'Adele', 2);
          ctx.forEach(c => snippets.push(`Script #${idx + 1} L${c.matchLine}:\n${c.snippet}`));
        }
      });

      if (adeleOnlyIn.length > 0) {
        found.push(`Prenom "Adele" hors contexte de nettoyage (${adeleOnlyIn.join(', ')})`);
      }

      const pass = found.length === 0;
      recordTest({
        id:       `T1-${page.label}`,
        name:     `${page.label} -- Absence donnees factices`,
        pass,
        detail:   pass
          ? 'Aucune donnee factice detectee dans le contenu actif de la page.'
          : `Donnees factices : ${found.join(' | ')}`,
        snippets,
        file:     pass ? null : page.path,
        fix:      pass ? null : 'Remplacer toutes les occurrences par des valeurs dynamiques via SwitchAPI.',
      });

    } catch (err) {
      REPORT.errors++;
      recordTest({
        id:     `T1-${page.label}`,
        name:   `${page.label} -- Reseau`,
        pass:   false,
        detail: `Erreur reseau : ${err.message}`,
        file:   page.path,
      });
    }
  }
}

/* ====================================================================
   TEST 2 -- SOLDE UNIQUE ET REEL (0 FCFA PAR DEFAUT)
   ==================================================================== */

async function runTest2() {
  startSuite('TEST 2', 'Solde unique et reel (0 FCFA par defaut)');

  // 2a -- switch.config.js
  try {
    const { text, status } = await fetchPage('/assets/switch.config.js');
    if (status >= 400) throw new Error(`HTTP ${status}`);

    const hasZero    = /INITIAL_TEST_BALANCE\s*:\s*0\b/.test(text);
    const has50k     = /INITIAL_TEST_BALANCE\s*:\s*50[\s_]?000/.test(text);
    const has125k    = /INITIAL_TEST_BALANCE\s*:\s*125[\s_]?000/.test(text);

    const snippets = [];
    const ctx = getContext(text, 'INITIAL_TEST_BALANCE', 2);
    ctx.forEach(c => snippets.push(c.snippet));

    recordTest({
      id:       'T2-CONFIG-BALANCE',
      name:     'switch.config.js -- INITIAL_TEST_BALANCE = 0',
      pass:     hasZero && !has50k && !has125k,
      detail:   hasZero && !has50k && !has125k
        ? 'INITIAL_TEST_BALANCE correctement configure a 0 FCFA.'
        : has50k || has125k
          ? `Valeur non nulle : ${has50k ? '50 000' : '125 000'} FCFA.`
          : 'INITIAL_TEST_BALANCE manquant ou non egal a 0.',
      snippets,
      file:     '/assets/switch.config.js',
      fix:      'Definir INITIAL_TEST_BALANCE: 0 dans switch.config.js.',
    });
  } catch (err) {
    REPORT.errors++;
    recordTest({ id:'T2-CONFIG-BALANCE', name:'switch.config.js -- Acces', pass:false, detail:err.message });
  }

  // 2b -- Dashboard Hero
  try {
    const { text, status } = await fetchPage('/tableau_de_bord_mis_jour/code.html');
    if (status >= 400) throw new Error(`HTTP ${status}`);

    const patterns = [
      /id="main-balance-text"[^>]*>\s*0\s*<span/i,
      /id="main-balance-text"[^>]*>\s*0\s*FCFA/i,
      /id="hero-balance"[^>]*>\s*0/i,
      />0\s*<span[^>]*>FCFA<\/span>/i,
    ];
    const hasZeroDisplay = patterns.some(p => p.test(text));
    const cleanText = stripComments(text);
    const hasFakeBalance = /50[\s\u00a0]?000\s*(FCFA|F\b)/.test(cleanText) ||
                           /125[\s\u00a0]?000\s*(FCFA|F\b)/.test(cleanText);

    recordTest({
      id:       'T2-DASHBOARD-HERO-BALANCE',
      name:     'Dashboard -- Hero Solde initiale = 0 FCFA',
      pass:     hasZeroDisplay && !hasFakeBalance,
      detail:   hasZeroDisplay && !hasFakeBalance
        ? 'Le Hero Card affiche bien 0 FCFA comme valeur HTML de depart.'
        : !hasZeroDisplay
          ? 'Pattern "0 FCFA" non trouve dans le Hero Card.'
          : 'Solde fictif (50 000 / 125 000 FCFA) detecte dans le HTML.',
      file:     '/tableau_de_bord_mis_jour/code.html',
      fix:      'Initialiser id="main-balance-text" avec 0, maj ensuite via SwitchAPI.getBalance().',
    });
  } catch (err) {
    REPORT.errors++;
    recordTest({ id:'T2-DASHBOARD-HERO-BALANCE', name:'Dashboard -- Acces', pass:false, detail:err.message });
  }

  // 2c -- Transfert Switch-Switch
  try {
    const { text, status } = await fetchPage('/transfert_switch_switch/code.html');
    if (status >= 400) throw new Error(`HTTP ${status}`);

    const cleanText = stripComments(text);
    // Exclure les faux positifs : boutons preset (setAmount), valeurs dans onclick, labels de montant
    // On cherche uniquement les soldes en texte dans un élément de balance affiché
    const cleanNoPresets = cleanText
      .replace(/onclick="setAmount\([^)]+\)"/g, '')        // onclick preset
      .replace(/setAmount\(\d+\)/g, '')                    // appels setAmount
      .replace(/value="\d+"/g, '')                         // attributs value numérique
      .replace(/>\d{1,3}(\s|\u00a0)\d{3}\s*(F\b)\s*</g, '>PRESET<'); // labels preset "X 000 F"
    const hasFake = /(?:Solde|balance|disponible|actuel)[^\n]*?(?:50[\s\u00a0]?000|125[\s\u00a0]?000)/i.test(cleanNoPresets) ||
                    /id="[^"]*balance[^"]*"[^>]*>[^<]*(?:50[\s\u00a0]?000|125[\s\u00a0]?000)/i.test(cleanNoPresets);

    recordTest({
      id:       'T2-TRANSFER-SWITCH-BALANCE',
      name:     'Transfert Switch-Switch -- Pas de solde fictif',
      pass:     !hasFake,
      detail:   !hasFake
        ? 'Aucun solde fictif detecte dans la page de transfert.'
        : 'Solde fictif 50 000 / 125 000 F detecte dans le HTML.',
      file:     '/transfert_switch_switch/code.html',
      fix:      'Remplacer les valeurs en dur par SwitchAPI.getBalance().',
    });
  } catch (err) {
    REPORT.errors++;
    recordTest({ id:'T2-TRANSFER-SWITCH-BALANCE', name:'Transfert Switch -- Acces', pass:false, detail:err.message });
  }

  // 2d -- Transfert Mobile Money
  try {
    const { text, status } = await fetchPage('/transfert_mobile_money/code.html');
    if (status >= 400) throw new Error(`HTTP ${status}`);

    const cleanText = stripComments(text);
    const hasFake = /50[\s\u00a0]?000|125[\s\u00a0]?000/.test(cleanText);

    recordTest({
      id:       'T2-TRANSFER-MOMO-BALANCE',
      name:     'Transfert Mobile Money -- Pas de solde fictif',
      pass:     !hasFake,
      detail:   !hasFake
        ? 'Aucun solde fictif dans la balance pill de l ecran MoMo.'
        : 'Solde fictif detecte dans le HTML.',
      file:     '/transfert_mobile_money/code.html',
      fix:      'Utiliser SwitchAPI.getBalance() pour afficher le solde disponible.',
    });
  } catch (err) {
    REPORT.errors++;
    recordTest({ id:'T2-TRANSFER-MOMO-BALANCE', name:'Transfert MoMo -- Acces', pass:false, detail:err.message });
  }

  // 2e -- Retrait de Fonds
  try {
    const { text, status } = await fetchPage('/retrait_de_fonds/code.html');
    if (status >= 400) throw new Error(`HTTP ${status}`);

    const cleanText = stripComments(text);
    // Exclure les faux positifs : boutons preset (setAmount(50000), labels "50 000 F")
    // On vérifie que le solde AFFICHÉ dans #available-balance-val est 0
    const balEl = text.match(/id="available-balance-val"[^>]*>([^<]+)</i);
    const displayedBalance = balEl ? balEl[1].trim() : null;
    const hasFake = displayedBalance !== null
      ? /(?:50|125)[\s\u00a0]?000/.test(displayedBalance)  // valeur affichée HTML
      : /id="available-balance-val"[^>]*>[^<]*(?:50[\s\u00a0]?000|125[\s\u00a0]?000)/i.test(text);

    recordTest({
      id:       'T2-WITHDRAW-BALANCE',
      name:     'Retrait de Fonds -- Solde = 0 FCFA',
      pass:     !hasFake,
      detail:   !hasFake
        ? 'Aucun solde fictif dans l ecran Retrait de Fonds.'
        : 'Solde fictif 50 000 / 125 000 FCFA detecte dans le HTML.',
      file:     '/retrait_de_fonds/code.html',
      fix:      'Initialiser l affichage du solde via SwitchAPI.getBalance().',
    });
  } catch (err) {
    REPORT.errors++;
    recordTest({ id:'T2-WITHDRAW-BALANCE', name:'Retrait de Fonds -- Acces', pass:false, detail:err.message });
  }
}

/* ====================================================================
   TEST 3 -- EMPTY STATES PROPRES
   ==================================================================== */

async function runTest3() {
  startSuite('TEST 3', 'Empty States propres');

  // 3a -- Historique des transactions
  try {
    const { text, status } = await fetchPage('/historique_des_transactions/code.html');
    if (status >= 400) throw new Error(`HTTP ${status}`);

    const cleanText = stripComments(text);
    const hasEmptyMsg = /aucune\s+transaction/i.test(text) ||
                        /aucune\s+op[eé]ration/i.test(text) ||
                        /id="empty-state-transactions"/i.test(text) ||
                        /class="[^"]*empty[^"]*"/i.test(text);
    const hasFakeTx = cleanText.includes('SW-8921') ||
                      cleanText.includes('SW-8920') ||
                      cleanText.includes('Maman Awa');
    const fallbackEmpty = /defaultTransactionsFallback\s*=\s*\[\s*\]/.test(cleanText) ||
                          !/defaultTransactionsFallback/.test(cleanText);

    recordTest({
      id:       'T3-HISTORIQUE-EMPTY-STATE',
      name:     'Historique Transactions -- Empty state present',
      pass:     hasEmptyMsg && !hasFakeTx,
      detail:   hasEmptyMsg && !hasFakeTx
        ? 'Empty state present, aucune fausse transaction injectee.'
        : !hasEmptyMsg
          ? 'Message "Aucune transaction" absent.'
          : `Fausses transactions : ${[
              cleanText.includes('SW-8921') ? 'SW-8921' : '',
              cleanText.includes('SW-8920') ? 'SW-8920' : '',
              cleanText.includes('Maman Awa') ? 'Maman Awa' : '',
            ].filter(Boolean).join(', ')}`,
      file:     '/historique_des_transactions/code.html',
      fix:      'Ajouter #empty-state-transactions, definir defaultTransactionsFallback = [].',
    });

    recordTest({
      id:       'T3-HISTORIQUE-FALLBACK-VIDE',
      name:     'Historique -- defaultTransactionsFallback = []',
      pass:     fallbackEmpty,
      detail:   fallbackEmpty
        ? 'defaultTransactionsFallback est [] ou absent.'
        : 'defaultTransactionsFallback contient encore des donnees de demo.',
      file:     '/historique_des_transactions/code.html',
      fix:      'Definir const defaultTransactionsFallback = [];',
    });

  } catch (err) {
    REPORT.errors++;
    recordTest({ id:'T3-HISTORIQUE-EMPTY-STATE', name:'Historique -- Acces', pass:false, detail:err.message });
  }

  // 3b -- Historique Vide
  try {
    const { text, status } = await fetchPage('/historique_vide/code.html');
    if (status >= 400) throw new Error(`HTTP ${status}`);

    const cleanText = stripComments(text);
    const hasAdele   = cleanText.includes('Adele');
    const hasDynamic = /id="user-greeting-title"/i.test(text) ||
                       /SwitchAPI\.getProfile/i.test(text);

    recordTest({
      id:       'T3-HISTORIQUE-VIDE',
      name:     'Page Historique Vide -- Salutation dynamique sans Adele',
      pass:     !hasAdele && hasDynamic,
      detail:   !hasAdele && hasDynamic
        ? 'Salutation dynamique presente, aucune reference a Adele.'
        : hasAdele
          ? 'Prenom "Adele" encore present dans la page.'
          : 'Aucun mecanisme de salutation dynamique detecte.',
      file:     '/historique_vide/code.html',
      fix:      'Utiliser SwitchAPI.getProfile().first_name pour la salutation.',
    });
  } catch (err) {
    REPORT.errors++;
    recordTest({ id:'T3-HISTORIQUE-VIDE', name:'Historique Vide -- Acces', pass:false, detail:err.message });
  }

  // 3c -- Notifications Vides
  try {
    const { text, status } = await fetchPage('/notifications_vides/code.html');
    if (status >= 400) throw new Error(`HTTP ${status}`);

    const cleanText = stripComments(text);
    const hasEmptyNotif = /aucune\s+notification/i.test(text) ||
                          /pas\s+de\s+notification/i.test(text) ||
                          /id="empty-state-notif/i.test(text);
    const hasFakeNotif  = /SW-8921|SW-8920|Maman\s+Awa|Adele/.test(cleanText);

    recordTest({
      id:       'T3-NOTIFICATIONS-VIDES',
      name:     'Page Notifications Vides -- Empty state propre',
      pass:     hasEmptyNotif && !hasFakeNotif,
      detail:   hasEmptyNotif && !hasFakeNotif
        ? 'Message "aucune notification" present, aucune fausse notification.'
        : !hasEmptyNotif
          ? 'Aucun message "aucune notification" trouve.'
          : 'Fausses notifications encore presentes.',
      file:     '/notifications_vides/code.html',
      fix:      'Ajouter empty state "Aucune notification pour le moment".',
    });
  } catch (err) {
    REPORT.errors++;
    recordTest({ id:'T3-NOTIFICATIONS-VIDES', name:'Notifications Vides -- Acces', pass:false, detail:err.message });
  }
}

/* ====================================================================
   TEST 4 -- REGLE "UN NUMERO = UN COMPTE"
   ==================================================================== */

async function runTest4() {
  startSuite('TEST 4', 'Regle "Un Numero = Un Compte"');

  // 4a -- switch.api.js
  try {
    const { text, status } = await fetchPage('/assets/switch.api.js');
    if (status >= 400) throw new Error(`HTTP ${status}`);

    const hasCheckFn    = /checkPhoneRegistration/.test(text);
    const hasIsRegFn    = /isPhoneRegistered/.test(text);
    const hasValidateFn = /validateBeninPhone/.test(text);

    const snippets = [];
    if (hasCheckFn) {
      const ctx = getContext(text, 'checkPhoneRegistration', 3).slice(0, 1);
      ctx.forEach(c => snippets.push(c.snippet));
    }

    recordTest({
      id:       'T4-API-CHECK-METHODS',
      name:     'switch.api.js -- checkPhoneRegistration & isPhoneRegistered',
      pass:     hasCheckFn && hasIsRegFn,
      detail:   hasCheckFn && hasIsRegFn
        ? 'Les deux methodes de verification sont exposees dans SwitchAPI.'
        : `Methodes manquantes : ${!hasCheckFn ? 'checkPhoneRegistration ' : ''}${!hasIsRegFn ? 'isPhoneRegistered' : ''}`,
      snippets,
      file:     '/assets/switch.api.js',
      fix:      'Implementer checkPhoneRegistration(phone) et isPhoneRegistered(phone) dans SwitchAPI.',
    });

    recordTest({
      id:       'T4-API-VALIDATE-PHONE',
      name:     'switch.api.js -- validateBeninPhone present',
      pass:     hasValidateFn,
      detail:   hasValidateFn
        ? 'validateBeninPhone() est bien definie dans SwitchAPI.'
        : 'validateBeninPhone() absente -- aucune validation format ARCEP.',
      file:     '/assets/switch.api.js',
      fix:      'Ajouter validateBeninPhone(phone) avec les prefixes MTN/Moov/Celtiis.',
    });

  } catch (err) {
    REPORT.errors++;
    recordTest({ id:'T4-API-CHECK-METHODS', name:'switch.api.js -- Acces', pass:false, detail:err.message });
  }

  // 4b -- Page Inscription
  try {
    const { text, status } = await fetchPage('/inscription/code.html');
    if (status >= 400) throw new Error(`HTTP ${status}`);

    const cleanText = stripComments(text);
    const hasCheckCall     = /checkPhoneRegistration/.test(cleanText);
    const hasAlreadyExists = /d[eé]j[aà]\s+associ[eé]|compte\s+existant|num[eé]ro\s+d[eé]j[aà]/i.test(text);
    const hasLoginBtn      = /se\s+connecter/i.test(text) || /connecter\s+avec/i.test(text);

    const snippets = [];
    if (hasCheckCall) {
      const ctx = getContext(cleanText, 'checkPhoneRegistration', 3).slice(0, 1);
      ctx.forEach(c => snippets.push(c.snippet));
    }

    recordTest({
      id:       'T4-INSCRIPTION-DOUBLON',
      name:     'Inscription -- Blocage doublon & banniere compte existant',
      pass:     hasCheckCall && hasAlreadyExists && hasLoginBtn,
      detail:   hasCheckCall && hasAlreadyExists && hasLoginBtn
        ? 'checkPhoneRegistration() appele avant OTP. Banniere et bouton Se connecter presents.'
        : [
            !hasCheckCall     ? 'checkPhoneRegistration() non appele' : '',
            !hasAlreadyExists ? 'Message "numero deja associe" absent' : '',
            !hasLoginBtn      ? 'Bouton "Se connecter" absent' : '',
          ].filter(Boolean).join(' | '),
      snippets,
      file:     '/inscription/code.html',
      fix:      'Appeler SwitchAPI.checkPhoneRegistration(phone) a la saisie. Si existant : alerte + bouton "Se connecter avec mon code PIN".',
    });

  } catch (err) {
    REPORT.errors++;
    recordTest({ id:'T4-INSCRIPTION-DOUBLON', name:'Inscription -- Acces', pass:false, detail:err.message });
  }

  // 4c -- Page Connexion
  try {
    const { text, status } = await fetchPage('/connexion/code.html');
    if (status >= 400) throw new Error(`HTTP ${status}`);

    const cleanText = stripComments(text);
    const hasCheckCall   = /checkPhoneRegistration/.test(cleanText);
    const hasUnknownMsg  = /aucun\s+compte|num[eé]ro\s+non\s+reconnu|non\s+encore\s+associ[eé]/i.test(text);
    const hasCreateBtn   = /cr[eé]er\s+(mon\s+)?compte|s'inscrire/i.test(text);

    recordTest({
      id:       'T4-CONNEXION-INCONNU',
      name:     'Connexion -- Alerte "numero non reconnu" & bouton inscription',
      pass:     hasCheckCall && hasUnknownMsg && hasCreateBtn,
      detail:   hasCheckCall && hasUnknownMsg && hasCreateBtn
        ? 'checkPhoneRegistration() actif. Message inconnu et bouton Creer mon compte presents.'
        : [
            !hasCheckCall   ? 'checkPhoneRegistration() non appele dans Connexion' : '',
            !hasUnknownMsg  ? 'Message "numero non reconnu" absent' : '',
            !hasCreateBtn   ? 'Bouton "Creer mon compte" absent' : '',
          ].filter(Boolean).join(' | '),
      file:     '/connexion/code.html',
      fix:      'Appeler SwitchAPI.checkPhoneRegistration(phone). Si inconnu : alerte + bouton "Creer mon compte en 2 minutes".',
    });

  } catch (err) {
    REPORT.errors++;
    recordTest({ id:'T4-CONNEXION-INCONNU', name:'Connexion -- Acces', pass:false, detail:err.message });
  }
}

/* ====================================================================
   TEST 5 -- COHERENCE DU PROFIL
   ==================================================================== */

async function runTest5() {
  startSuite('TEST 5', 'Coherence du profil (dynamique, sans hard-code)');

  const profilePages = [
    { path: '/tableau_de_bord_mis_jour/code.html', label: 'Dashboard', ids: ['dashboard-user-name', 'dashboard-account-number'] },
    { path: '/profil_utilisateur/code.html',       label: 'Profil-Utilisateur', ids: ['user-profile-name', 'user-profile-initials'] },
    { path: '/param_tres_g_n_raux/code.html',      label: 'Parametres-Generaux', ids: ['settings-user-name', 'settings-user-account'] },
  ];

  const HARDCODED = ['Adele Doe', 'Adele K.', '+229 97 12 34 56', 'img_046.jpg'];

  for (const pg of profilePages) {
    try {
      const { text, status } = await fetchPage(pg.path);
      if (status >= 400) throw new Error(`HTTP ${status}`);

      const cleanText = stripComments(text);
      const callsGetProfile  = /SwitchAPI\.getProfile\(\)/.test(cleanText);
      const missingIds       = pg.ids.filter(id => !text.includes(`id="${id}"`));
      const foundHardcoded   = HARDCODED.filter(h => cleanText.includes(h));
      const hasProfileGuard  = /profile_completed/.test(cleanText) ||
                               /isProfileCompleted/.test(cleanText) ||
                               /modifier_le_profil/.test(text);

      const pass = callsGetProfile && missingIds.length === 0 && foundHardcoded.length === 0;

      const snippets = [];
      if (callsGetProfile) {
        const ctx = getContext(cleanText, 'SwitchAPI.getProfile', 2).slice(0, 1);
        ctx.forEach(c => snippets.push(c.snippet));
      }

      recordTest({
        id:       `T5-PROFILE-${pg.label}`,
        name:     `${pg.label} -- Profil dynamique via SwitchAPI.getProfile()`,
        pass,
        detail:   pass
          ? `Profil lu dynamiquement. IDs : ${pg.ids.join(', ')}. Aucun hard-code.`
          : [
              !callsGetProfile          ? 'SwitchAPI.getProfile() non appele' : '',
              missingIds.length > 0     ? `IDs manquants : ${missingIds.join(', ')}` : '',
              foundHardcoded.length > 0 ? `Valeurs en dur : ${foundHardcoded.join(', ')}` : '',
            ].filter(Boolean).join(' | '),
        snippets,
        file:     pg.path,
        fix:      pass ? null : 'Lier tous les champs de profil a SwitchAPI.getProfile().',
      });

      recordTest({
        id:       `T5-GUARD-${pg.label}`,
        name:     `${pg.label} -- Guard profile_completed -> redirection modifier_le_profil`,
        pass:     hasProfileGuard,
        detail:   hasProfileGuard
          ? 'Guard profile_completed present : redirection vers modifier_le_profil si incomplet.'
          : 'Guard profile_completed absent.',
        file:     pg.path,
        fix:      'Ajouter : if (!SwitchAPI.isProfileCompleted()) window.location = "../modifier_le_profil/code.html";',
      });

    } catch (err) {
      REPORT.errors++;
      recordTest({ id:`T5-PROFILE-${pg.label}`, name:`${pg.label} -- Acces`, pass:false, detail:err.message });
    }
  }
}

/* ====================================================================
   TEST 6 -- SYNCHRONISATION RACINE <-> www/
   ==================================================================== */

async function runTest6() {
  startSuite('TEST 6', 'Synchronisation racine <-> www/');

  const filesToCompare = [
    'assets/switch.api.js',
    'assets/switch.engine.js',
    'assets/switch.config.js',
    'inscription/code.html',
    'connexion/code.html',
    'tableau_de_bord_mis_jour/code.html',
    'profil_utilisateur/code.html',
    'param_tres_g_n_raux/code.html',
    'historique_des_transactions/code.html',
  ];

  const normalizeEOL = s => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (const relPath of filesToCompare) {
    const rootContent = readLocalFile(relPath);
    const wwwContent  = readLocalFile(`www/${relPath}`);

    const rootExists = rootContent !== null;
    const wwwExists  = wwwContent  !== null;

    if (!rootExists || !wwwExists) {
      recordTest({
        id:     `T6-SYNC-${relPath.replace(/[\/\.]/g, '-')}`,
        name:   `Sync ${relPath}`,
        pass:   false,
        detail: !rootExists
          ? `Fichier racine manquant : ${relPath}`
          : `Fichier www/ manquant : www/${relPath}`,
        file:   !rootExists ? relPath : `www/${relPath}`,
        fix:    'Copier le fichier manquant ou synchroniser via le script de build.',
      });
      continue;
    }

    const rootNorm = normalizeEOL(rootContent);
    const wwwNorm  = normalizeEOL(wwwContent);
    const rootHash = sha256(rootNorm);
    const wwwHash  = sha256(wwwNorm);
    const identical = rootHash === wwwHash;

    let snippets = [];
    if (!identical) {
      const rootLines = rootNorm.split('\n');
      const wwwLines  = wwwNorm.split('\n');
      const diffs = [];
      const maxLines = Math.max(rootLines.length, wwwLines.length);
      for (let i = 0; i < maxLines && diffs.length < 5; i++) {
        if (rootLines[i] !== wwwLines[i]) {
          diffs.push(`Ligne ${i + 1}:\n  RACINE : ${(rootLines[i] || '').slice(0, 120)}\n  www/   : ${(wwwLines[i] || '').slice(0, 120)}`);
        }
      }
      if (diffs.length > 0) snippets = [diffs.join('\n')];
    }

    recordTest({
      id:       `T6-SYNC-${relPath.replace(/[\/\.]/g, '-')}`,
      name:     `Sync -- ${relPath}`,
      pass:     identical,
      detail:   identical
        ? `SHA-256 identique : ${rootHash.slice(0, 16)}...`
        : `Divergence ! SHA racine=${rootHash.slice(0,12)}... www=${wwwHash.slice(0,12)}...`,
      snippets,
      file:     identical ? null : `${relPath}  <->  www/${relPath}`,
      fix:      identical ? null : 'Executer : node scripts/sync-www.js  ou copier manuellement la racine vers www/.',
    });
  }
}

/* ====================================================================
   RAPPORT FINAL
   ==================================================================== */

function printFinalReport() {
  p(`\n${C.bold}${hr('=')}${C.reset}`);
  p(`${C.bold}  RAPPORT FINAL -- HARNAIS DE TEST PHASE 1 BETA SWITCH BENIN${C.reset}`);
  p(`${C.bold}${hr('=')}${C.reset}`);
  p(`  Base URL  : ${C.cyan}${BASE_URL}${C.reset}`);
  p(`  Horodatage: ${C.dim}${new Date().toISOString()}${C.reset}`);
  p(hr('-'));

  for (const suite of REPORT.suites) {
    const sTotal  = suite.tests.length;
    const sPassed = suite.tests.filter(t => t.pass).length;
    const sFailed = sTotal - sPassed;
    const allOk   = sFailed === 0;

    const statusLabel = allOk ? `${C.green}PASS${C.reset}` : `${C.red}FAIL${C.reset}`;
    p(`\n  [${statusLabel}]  ${C.bold}${suite.id} -- ${suite.title}${C.reset}  (${sPassed}/${sTotal})`);

    for (const t of suite.tests) {
      const icon = t.pass ? `${C.green}v${C.reset}` : `${C.red}x${C.reset}`;
      p(`    ${icon} [${t.id}] ${t.name}`);
      if (!t.pass) {
        p(`         ${C.yellow}-> ${t.detail}${C.reset}`);
        if (t.fix)  p(`         ${C.cyan}[FIX] ${t.fix}${C.reset}`);
        if (t.file) p(`         ${C.dim}[FILE] ${t.file}${C.reset}`);
        if (t.snippets && t.snippets.length > 0) {
          t.snippets.slice(0, 2).forEach(s => {
            p(`\n${C.dim}--- Extrait HTML/JS ---`);
            p(s.split('\n').slice(0, 12).join('\n'));
            p(`-----------------------${C.reset}\n`);
          });
        }
      }
    }
  }

  p(`\n${hr('-')}`);
  const globalOk = REPORT.failed === 0;

  p(`\n  RESULTAT GLOBAL : ${C.bold}${REPORT.passed}/${REPORT.total}${C.reset} tests reussis`);
  if (REPORT.errors > 0) {
    p(`  Erreurs reseau / fichiers manquants : ${REPORT.errors}`);
  }

  if (globalOk) {
    p(`\n  ${C.green}${C.bold}TOUS LES TESTS SONT AU VERT -- Phase 1 Beta validee !${C.reset}`);
    p(`  ${C.green}Statut : BETA_PHASE1_TESTS_COMPLETED${C.reset}`);
  } else {
    p(`\n  ${C.red}${REPORT.failed} test(s) echoue(s) -- corrections requises avant release.${C.reset}`);
  }

  p(`${C.bold}${hr('=')}${C.reset}\n`);
  return globalOk ? 0 : 1;
}

/* ====================================================================
   POINT D'ENTREE
   ==================================================================== */

async function runAllTests() {
  p(`\n${C.bold}${C.magenta}${hr('=')}${C.reset}`);
  p(`${C.bold}${C.magenta}  HARNAIS DE TEST AUTOMATISE -- PHASE 1 BETA SWITCH BENIN${C.reset}`);
  p(`${C.bold}${C.magenta}  Node.js ${process.version} | fetch natif | crypto natif | SANS navigateur${C.reset}`);
  p(`${C.bold}${C.magenta}${hr('=')}${C.reset}`);
  p(`  Base URL : ${C.cyan}${BASE_URL}${C.reset}`);
  p(`  Date     : ${C.dim}${new Date().toISOString()}${C.reset}\n`);

  await runTest1();
  await runTest2();
  await runTest3();
  await runTest4();
  await runTest5();
  await runTest6();

  const exitCode = printFinalReport();
  process.exit(exitCode);
}

runAllTests().catch(err => {
  console.error(`${C.red}ERREUR FATALE :${C.reset}`, err);
  process.exit(2);
});
