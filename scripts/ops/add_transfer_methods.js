const fs = require('fs');

let api = fs.readFileSync('assets/switch.api.js', 'utf8');

// Ensure transfer method is properly attached to SwitchAPI object
const transferCode = `
    /**
     * Transfert P2P de compte à compte
     */
    transfer: async function (amount, recipientPhone, note = "Transfert Switch") {
      const amt = parseInt(amount, 10);
      if (!amt || amt <= 0) return { success: false, message: "Montant invalide." };

      if (typeof isConfigured !== 'undefined' && isConfigured) {
        try {
          const data = await supabaseRPC('process_p2p_transfer', {
            p_recipient_phone: recipientPhone,
            p_amount: amt,
            p_note: note
          });
          if (data && data.success) {
            localStorage.setItem('switch_user_balance', data.new_balance.toString());
            return data;
          }
        } catch (e) {}
      }

      // Repli local offline
      const curBal = this.getBalance();
      if (curBal < amt) return { success: false, message: "Solde insuffisant dans votre Compte Switch." };

      const newBal = curBal - amt;
      this.setBalance(newBal);

      const ref = "SW-TX-" + this._generateSecureCode(6);
      this.addTransaction({
        type: 'transfer',
        category: 'transfer',
        title: "Transfert Switch",
        amount: -amt,
        fee: 0,
        recipient: recipientPhone,
        note: note,
        icon: "send",
        iconBg: "bg-indigo-50 text-indigo-700"
      });

      return { success: true, tx_ref: ref, new_balance: newBal };
    },

    transferSecure: async function (amount, recipientPhone, pin, note) {
      const pinOk = await this.verifyPin(pin);
      if (!pinOk) return { success: false, message: 'Code PIN incorrect.' };
      return this.transfer(amount, recipientPhone, note);
    },
`;

if (!api.includes('transfer: async function')) {
  api = api.replace('const SwitchAPI = {', 'const SwitchAPI = {' + transferCode);
}

fs.writeFileSync('assets/switch.api.js', api);
fs.writeFileSync('www/assets/switch.api.js', api);
console.log('✔ Added transfer & transferSecure to SwitchAPI');
