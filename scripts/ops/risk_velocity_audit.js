/**
 * MOTEUR DE RISQUE, VÉLOCITÉ ET CONTRÔLE DE SÉCURITÉ (HORS PRODUCTION)
 * Fichier : scripts/ops/risk_velocity_audit.js
 */

class RiskVelocityEngine {
  constructor() {
    this.txHistory = new Map();
  }

  checkVelocity(userId, amountFcfa, maxTpm = 3, maxDailyFcfa = 500000) {
    const now = Date.now();
    const userTxs = this.txHistory.get(userId) || [];

    // Filtrer les transactions de la dernière minute
    const recentOneMin = userTxs.filter(tx => now - tx.timestamp < 60000);
    if (recentOneMin.length >= maxTpm) {
      return { allowed: false, reason: "VELOCITY_EXCEEDED: Trop de transactions par minute." };
    }

    // Filtrer les transactions des dernières 24h
    const recent24h = userTxs.filter(tx => now - tx.timestamp < 86400000);
    const total24h = recent24h.reduce((acc, tx) => acc + tx.amount, 0) + amountFcfa;
    if (total24h > maxDailyFcfa) {
      return { allowed: false, reason: "DAILY_LIMIT_EXCEEDED: Plafond journalier dépassé." };
    }

    userTxs.push({ amount: amountFcfa, timestamp: now });
    this.txHistory.set(userId, userTxs);
    return { allowed: true, total24h };
  }

  redactSensitiveData(logObject) {
    const jsonStr = JSON.stringify(logObject);
    const redactedStr = jsonStr
      .replace(/"pin":\s*"\d+"/gi, '"pin":"****"')
      .replace(/"pan":\s*"(\d{4})\d{8}(\d{4})"/gi, '"pan":"$1********$2"')
      .replace(/"otp":\s*"\d+"/gi, '"otp":"***"');
    return JSON.parse(redactedStr);
  }
}

function testRiskAndVelocity() {
  const engine = new RiskVelocityEngine();
  const tx1 = engine.checkVelocity("user-100", 100000);
  const tx2 = engine.checkVelocity("user-100", 100000);
  const tx3 = engine.checkVelocity("user-100", 100000);
  const tx4 = engine.checkVelocity("user-100", 100000); // 4ème tx dans la même minute -> bloquée

  const logSample = { user: "alpha", pin: "1234", pan: "4111123456789012", otp: "5829" };
  const redacted = engine.redactSensitiveData(logSample);

  const passed = tx1.allowed && tx2.allowed && tx3.allowed && !tx4.allowed &&
                 redacted.pin === "****" && redacted.otp === "***" && redacted.pan === "4111********9012";

  return { suite: "Risque, Vélocité & Sécurité", status: passed ? "PASSED" : "FAILED", passed };
}

if (require.main === module) {
  console.log(testRiskAndVelocity());
}

module.exports = { RiskVelocityEngine, testRiskAndVelocity };
