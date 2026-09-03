const fs = require('fs');

let content = fs.readFileSync('assets/switch.api.js', 'utf8');

content = content.replace("return { success: true, message: 'Compte créé.', phone: norm };\n\n    // =========================================================================", "return { success: true, message: 'Compte créé.', phone: norm };\n    },\n\n    // =========================================================================");

fs.writeFileSync('assets/switch.api.js', content);
fs.writeFileSync('www/assets/switch.api.js', content);
console.log('✔ Fixed register closing brace accurately');
