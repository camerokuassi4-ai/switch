/**
 * Switch FinTech - Intent Lifecycle Manager (CSPRNG Strict)
 */
const SwitchIntent = {
  _generateCSPRNG: function () {
    if (typeof crypto !== "undefined") {
      if (typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
      }
      if (typeof crypto.getRandomValues === "function") {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant RFC4122
        return Array.from(bytes)
          .map(function (b) { return b.toString(16).padStart(2, '0'); })
          .join('')
          .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
      }
    }
    throw new Error("CSPRNG_UNAVAILABLE: Environnement cryptographique non disponible. Opération refusée.");
  },

  beginNewIntent: function (scope) {
    const key = this._generateCSPRNG();
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("switch_intent_" + scope, key);
    }
    return key;
  },

  resumeIntent: function (scope) {
    let key = null;
    if (typeof sessionStorage !== "undefined") {
      key = sessionStorage.getItem("switch_intent_" + scope);
    }
    if (!key) {
      key = this.beginNewIntent(scope);
    }
    return key;
  },

  finishIntent: function (scope) {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("switch_intent_" + scope);
    }
  },

  abandonIntent: function (scope) {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("switch_intent_" + scope);
    }
  }
};

if (typeof window !== "undefined") {
  window.SwitchIntent = SwitchIntent;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = SwitchIntent;
}
