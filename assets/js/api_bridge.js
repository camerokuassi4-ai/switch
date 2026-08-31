/**
 * PONT D'API FRONTEND SWITCH FINTECH BÉNIN (CLIENT PWA -> API REST)
 * Fichier : assets/js/api_bridge.js
 */

window.SwitchApi = {
  baseUrl: '/api/v1',

  async request(endpoint, method = 'GET', data = null, headers = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) options.body = JSON.stringify(data);

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      return { ok: response.ok, status: response.status, data: result };
    } catch (err) {
      return { ok: false, status: 0, error: "NETWORK_OR_TIMEOUT_ERROR" };
    }
  },

  // Inscription & KYC
  async register(phone, role = 'CLIENT') {
    return this.request('/auth/onboarding', 'POST', { user_id: `usr-${Date.now()}`, phone, role });
  },

  async verifyOtp(userId, otp) {
    return this.request('/auth/verify-otp', 'POST', { user_id: userId, otp });
  },

  async upgradeKyc(userId, docUrl, score) {
    return this.request('/kyc/upgrade', 'POST', { user_id: userId, documents: { id_document_url: docUrl, facial_match_score: score } });
  },

  // Transferts avec Rate Limiting
  async sendTransfer(userId, amount) {
    return this.request('/payments/transfer', 'POST', { user_id: userId, amount });
  },

  // POS & QR
  async payQr(qrId) {
    return this.request('/merchant/qr-pay', 'POST', { qr_id: qrId, expires_at_timestamp: Date.now() + 60000 });
  },

  async closeTill(open, cashIn, cashOut, physical) {
    return this.request('/agent/till-close', 'POST', { opening_cash: open, cash_in: cashIn, cash_out: cashOut, physical_cash: physical });
  }
};
