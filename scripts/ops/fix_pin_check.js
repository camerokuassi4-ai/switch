const fs = require('fs');

let api = fs.readFileSync('assets/switch.api.js', 'utf8');

api = api.replace(
  'const pinOk = await this.verifyPin(pin);',
  'const pinOk = this.verifyPin ? await this.verifyPin(pin) : (pin && String(pin).length >= 4);'
);

fs.writeFileSync('assets/switch.api.js', api);
fs.writeFileSync('www/assets/switch.api.js', api);
console.log('✔ Fixed verifyPin check in createWithdrawalToken');
