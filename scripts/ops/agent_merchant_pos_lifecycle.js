/**
 * GESTION OPÉRATIONS AGENT, COMMISSIONS & ENCAISSEMENT MARCHAND POS (HORS PRODUCTION)
 * Fichier : scripts/ops/agent_merchant_pos_lifecycle.js
 */

class AgentMerchantEngine {
  constructor() {
    this.usedQrCodes = new Set();
  }

  calculateAgentCommission(amountFcfa, type = "CASH_OUT") {
    // Barème dégressif standard
    if (amountFcfa <= 10000) return 100;
    if (amountFcfa <= 50000) return 300;
    if (amountFcfa <= 100000) return 600;
    return Math.round(amountFcfa * 0.007); // 0.7% au-delà de 100k
  }

  processTillClosure(openingCashFcfa, totalCashInFcfa, totalCashOutFcfa, physicalCashCounted) {
    const theoreticalCash = openingCashFcfa + totalCashInFcfa - totalCashOutFcfa;
    const variance = physicalCashCounted - theoreticalCash;
    return {
      openingCash: openingCashFcfa,
      theoreticalCash,
      physicalCashCounted,
      variance,
      isBalanced: variance === 0
    };
  }

  verifyQrPayment(qrPayload) {
    const now = Date.now();
    if (this.usedQrCodes.has(qrPayload.qr_id)) {
      return { valid: false, error: "QR_ALREADY_USED: Ce code QR a déjà été encaissé." };
    }
    if (now > qrPayload.expires_at_timestamp) {
      return { valid: false, error: "QR_EXPIRED: Ce code QR est expiré." };
    }
    this.usedQrCodes.add(qrPayload.qr_id);
    return { valid: true, receipt_id: `RCP-QR-${qrPayload.qr_id}` };
  }
}

function testAgentMerchantLifecycle() {
  const engine = new AgentMerchantEngine();

  const comm = engine.calculateAgentCommission(25000, "CASH_OUT");
  const tillBalanced = engine.processTillClosure(100000, 50000, 30000, 120000);
  const tillUnbalanced = engine.processTillClosure(100000, 50000, 30000, 115000);

  const qrValid = engine.verifyQrPayment({ qr_id: "QR-999", expires_at_timestamp: Date.now() + 60000 });
  const qrReplay = engine.verifyQrPayment({ qr_id: "QR-999", expires_at_timestamp: Date.now() + 60000 });
  const qrExpired = engine.verifyQrPayment({ qr_id: "QR-888", expires_at_timestamp: Date.now() - 1000 });

  const passed = comm === 300 &&
                 tillBalanced.isBalanced && !tillUnbalanced.isBalanced &&
                 qrValid.valid && !qrReplay.valid && !qrExpired.valid;

  return { suite: "Agents & Marchands POS Lifecycle", status: passed ? "PASSED" : "FAILED", passed };
}

if (require.main === module) {
  console.log(testAgentMerchantLifecycle());
}

module.exports = { AgentMerchantEngine, testAgentMerchantLifecycle };
