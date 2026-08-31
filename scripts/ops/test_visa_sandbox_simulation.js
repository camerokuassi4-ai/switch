/**
 * SIMULATEUR D'INTÉGRATION SANDBOX PAIEMENT CARTE VISA (HORS PRODUCTION)
 * Fichier : scripts/ops/test_visa_sandbox_simulation.js
 * 
 * Données Fictives de Test (Cartes de test de simulation) :
 * - 4000 0000 0000 0001 : Succès Autorisation Immédiate (200 OK)
 * - 4000 0000 0000 0002 : Déclenchement 3D-Secure Requis (3DS Challenge)
 * - 4000 0000 0000 0003 : Fonds Insuffisants (Rejet 402)
 * - 4000 0000 0000 0004 : Carte Expirée / Refusée (Rejet 400)
 */

class VisaSandboxGateway {
  constructor() {
    this.authorizations = new Map();
    this.captures = new Map();
    this.refunds = new Map();
  }

  processAuthorization(cardPayload) {
    const { pan, amount_fcfa, cvv, expiry } = cardPayload;

    if (!pan || !cvv || !expiry) {
      return { status: "REJECTED", code: "CARD_DATA_MISSING", authorized: false };
    }

    if (pan.endsWith("0004")) {
      return { status: "DECLINED", code: "CARD_EXPIRED_OR_BLOCKED", authorized: false };
    }

    if (pan.endsWith("0003")) {
      return { status: "DECLINED", code: "INSUFFICIENT_FUNDS", authorized: false };
    }

    if (pan.endsWith("0002")) {
      return {
        status: "3DS_REQUIRED",
        code: "CHALLENGE_REQUIRED",
        authorized: false,
        redirect_url: "https://sandbox.visa.switch.bj/3ds-challenge"
      };
    }

    const authId = `AUTH-VISA-${Date.now()}`;
    const authRecord = {
      auth_id: authId,
      pan_masked: `4000********${pan.slice(-4)}`,
      amount_fcfa,
      status: "AUTHORIZED",
      authorized_at: new Date().toISOString()
    };

    this.authorizations.set(authId, authRecord);
    return { status: "SUCCESS", code: "APPROVED", authorized: true, auth_id: authId, record: authRecord };
  }

  capturePayment(authId) {
    const auth = this.authorizations.get(authId);
    if (!auth || auth.status !== "AUTHORIZED") {
      return { success: false, error: "AUTH_NOT_FOUND_OR_INVALID" };
    }

    auth.status = "CAPTURED";
    this.captures.set(authId, { captured_at: new Date().toISOString(), amount_fcfa: auth.amount_fcfa });
    return { success: true, status: "CAPTURED", auth_id: authId };
  }

  refundPayment(authId, refundAmountFcfa) {
    const auth = this.authorizations.get(authId);
    if (!auth || auth.status !== "CAPTURED") {
      return { success: false, error: "CANNOT_REFUND_UNCAPTURED_PAYMENT" };
    }

    const refundId = `REF-VISA-${Date.now()}`;
    this.refunds.set(refundId, { auth_id: authId, amount: refundAmountFcfa, refunded_at: new Date().toISOString() });
    auth.status = "REFUNDED";
    return { success: true, refund_id: refundId, status: "REFUNDED" };
  }
}

function runVisaSandboxAudit() {
  console.log("===============================================================================");
  console.log("TESTS ISOLÉS DU SIMULATEUR CARTE VISA (SANDBOX HORS PRODUCTION)");
  console.log("===============================================================================\n");

  const gateway = new VisaSandboxGateway();
  const results = [];

  // 1. Autorisation Réussie
  const authSuccess = gateway.processAuthorization({ pan: "4000000000000001", amount_fcfa: 15000, cvv: "123", expiry: "12/28" });
  results.push({
    test: "1. Autorisation Carte Réussie",
    status: authSuccess.status === "SUCCESS" ? "PASSED" : "FAILED",
    details: `Auth ID: ${authSuccess.auth_id || 'N/A'}`
  });

  // 2. 3D-Secure Requis
  const auth3ds = gateway.processAuthorization({ pan: "4000000000000002", amount_fcfa: 15000, cvv: "123", expiry: "12/28" });
  results.push({
    test: "2. Challenge 3D-Secure (3DS)",
    status: auth3ds.status === "3DS_REQUIRED" ? "PASSED" : "FAILED",
    details: "Redirection vers le challenge 3DS."
  });

  // 3. Fonds Insuffisants
  const authNsf = gateway.processAuthorization({ pan: "4000000000000003", amount_fcfa: 15000, cvv: "123", expiry: "12/28" });
  results.push({
    test: "3. Refus Fonds Insuffisants",
    status: authNsf.status === "DECLINED" && authNsf.code === "INSUFFICIENT_FUNDS" ? "PASSED" : "FAILED",
    details: "Rejet immédiat sans débit."
  });

  // 4. Carte Refusée / Expirée
  const authDeclined = gateway.processAuthorization({ pan: "4000000000000004", amount_fcfa: 15000, cvv: "123", expiry: "12/28" });
  results.push({
    test: "4. Carte Expirée / Refusée",
    status: authDeclined.status === "DECLINED" ? "PASSED" : "FAILED",
    details: "Rejet carte invalide."
  });

  // 5. Capture & Remboursement
  const captureRes = gateway.capturePayment(authSuccess.auth_id);
  const refundRes = gateway.refundPayment(authSuccess.auth_id, 15000);
  results.push({
    test: "5. Cycle Capture & Remboursement",
    status: (captureRes.success && refundRes.success) ? "PASSED" : "FAILED",
    details: "Capture exécutée puis remboursement total tracé."
  });

  console.table(results);
  const allPassed = results.every(r => r.status === "PASSED");
  console.log(`\nBILAN DU SIMULATEUR VISA : ${allPassed ? "100% SUCCÈS (5/5 SCÉNARIOS SANDBOX VALIDÉS)" : "ÉCHEC"}\n`);
  return allPassed;
}

if (require.main === module) {
  runVisaSandboxAudit();
}

module.exports = { VisaSandboxGateway, runVisaSandboxAudit };
