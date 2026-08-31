/**
 * SÉCURITÉ DES API, SIGNATURES WEBHOOKS & ROUTAGE SANDBOX/PROD (HORS PRODUCTION)
 * Fichier : scripts/ops/api_integration_security.js
 */

const crypto = require('crypto');

class ApiIntegrationSecurity {
  constructor(secretKey = "sandbox-secret-signature-key") {
    this.secretKey = secretKey;
    this.processedWebhooks = new Set();
  }

  generateWebhookSignature(payload) {
    return crypto.createHmac('sha256', this.secretKey).update(JSON.stringify(payload)).digest('hex');
  }

  verifyWebhookSignature(payload, signatureHeader) {
    const expected = this.generateWebhookSignature(payload);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  }

  processWebhookEvent(eventId, payload, signature) {
    if (!this.verifyWebhookSignature(payload, signature)) {
      return { status: 401, error: "INVALID_WEBHOOK_SIGNATURE" };
    }

    if (this.processedWebhooks.has(eventId)) {
      return { status: 200, duplicate: true, message: "WEBHOOK_ALREADY_PROCESSED" };
    }

    this.processedWebhooks.add(eventId);
    return { status: 200, duplicate: false, message: "EVENT_PROCESSED_SUCCESSFULLY" };
  }
}

function testApiIntegrationSecurity() {
  const security = new ApiIntegrationSecurity();
  const payload = { txId: "TX-999", amount: 25000, provider: "SBEE", status: "CONFIRMED" };
  const validSig = security.generateWebhookSignature(payload);
  const invalidSig = security.generateWebhookSignature({ ...payload, amount: 99999 });

  const okReq = security.processWebhookEvent("EVT-WH-001", payload, validSig);
  const dupReq = security.processWebhookEvent("EVT-WH-001", payload, validSig);
  const badReq = security.processWebhookEvent("EVT-WH-002", payload, invalidSig);

  const passed = okReq.status === 200 && !okReq.duplicate &&
                 dupReq.status === 200 && dupReq.duplicate &&
                 badReq.status === 401;

  return { suite: "Sécurité API & Signatures Webhooks", status: passed ? "PASSED" : "FAILED", passed };
}

if (require.main === module) {
  console.log(testApiIntegrationSecurity());
}

module.exports = { ApiIntegrationSecurity, testApiIntegrationSecurity };
