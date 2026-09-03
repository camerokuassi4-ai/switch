const fs = require('fs');
const assert = require('assert');

console.log('=== TEST SEO & TELECHARGEMENT APK PAGE (download.html & index.html) ===');

// 1. Vérification SEO & Meta dans download.html
const downloadContent = fs.readFileSync('download.html', 'utf8');

assert(downloadContent.includes('<title>Switch Beta — Télécharger l\'application pour Android</title>'), 'SEO Title correct');
assert(downloadContent.includes('name="description" content="Téléchargez Switch Beta, l\'application de paiement mobile pour le Bénin. Disponible pour Android.'), 'SEO Description correcte');
assert(downloadContent.includes('name="keywords" content="Switch, Beta, Bénin, paiement, mobile, Android, APK, téléchargement'), 'SEO Keywords corrects');
assert(downloadContent.includes('assets/downloads/switch-beta-v2.1.0.apk'), 'Lien direct APK présent');
assert(downloadContent.includes('Autorisez les sources inconnues'), 'Instructions sources inconnues présentes');
assert(downloadContent.includes('SoftwareApplication'), 'JSON-LD Schema.org présent');

console.log('✔ download.html : Title, Description, Keywords, JSON-LD, Lien APK et Instructions d\'installation à 100% validés');

// 2. Vérification index.html
const indexContent = fs.readFileSync('index.html', 'utf8');
assert(indexContent.includes('href="download.html"'), 'Lien vers download.html présent dans index.html');
assert(indexContent.includes('Télécharger l\'application Android (.APK)'), 'Bouton de téléchargement Android présent dans index.html');
assert(indexContent.includes('isAndroid'), 'Script de détection Android présent dans index.html');

console.log('✔ index.html : Lien vers download.html & détection Android à 100% validés');

// 3. Vérification de l'existence des fichiers APK
assert(fs.existsSync('assets/downloads/switch-beta-v2.1.0.apk'), 'APK racine existe');
assert(fs.existsSync('www/assets/downloads/switch-beta-v2.1.0.apk'), 'APK www existe');
assert(fs.existsSync('www/download/switch-beta.apk'), 'APK public alias existe');

console.log('✔ Fichiers APK publics vérifiés sur le système de fichier');
console.log('=== TOUS LES TESTS PAGE TELECHARGEMENT & SEO ONT REUSSI (PAGE_TELECHARGEMENT_ET_SEO_FAITS) ===');
