/**
 * EXÉCUTEUR GÉNÉRAL DES TESTS DE DURCISSEMENT MULTI-DOMAINES (HORS PRODUCTION)
 * Fichier : scripts/ops/run_all_domain_tests.js
 */

const { testKycLifecycle } = require('./kyc_onboarding_lifecycle.js');
const { testRiskAndVelocity } = require('./risk_velocity_audit.js');
const { testAgentMerchantLifecycle } = require('./agent_merchant_pos_lifecycle.js');
const { testNotificationEngine } = require('./notification_dispatch_engine.js');
const { testApiIntegrationSecurity } = require('./api_integration_security.js');
const { runApiSandboxTests } = require('./backend_hardening_sandbox.js');
const { runFullIsolatedTestSuite } = require('./test_isolated_suite.js');

async function runAllDomainTests() {
  console.log("===============================================================================");
  console.log("EXÉCUTION DU BANC D'ESSAI COMPLET MULTI-DOMAINES (HORS PRODUCTION)");
  console.log("===============================================================================\n");

  const summary = [];

  summary.push(testKycLifecycle());
  summary.push(testRiskAndVelocity());
  summary.push(testAgentMerchantLifecycle());
  summary.push(testNotificationEngine());
  summary.push(testApiIntegrationSecurity());

  console.log("\n=== RÉSULTATS DES MODULES MÉTIER ===");
  console.table(summary);

  console.log("\n=== EXÉCUTION DU BAC À SABLE BACKEND ===");
  const backendPassed = await runApiSandboxTests();

  console.log("\n=== EXÉCUTION DE LA SUITE ISOLÉE WORKER (9 SCÉNARIOS) ===");
  const workerPassed = await runFullIsolatedTestSuite();

  const allPassed = summary.every(s => s.passed) && backendPassed && workerPassed;
  console.log("\n===============================================================================");
  console.log(`BILAN CONSOLIDÉ MULTI-DOMAINES : ${allPassed ? "100% SUCCÈS (TOUS LES DOMAINES VALIDÉS)" : "ÉCHEC"}`);
  console.log("===============================================================================");

  return allPassed;
}

if (require.main === module) {
  runAllDomainTests();
}

module.exports = { runAllDomainTests };
