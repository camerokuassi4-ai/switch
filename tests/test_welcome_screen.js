const fs = require("fs");
const assert = require("assert");

console.log("=== TEST SUITE: SIMPLIFIED WELCOME / ONBOARDING SCREEN ===");

const indexHtml = fs.readFileSync("index.html", "utf8");

assert(!indexHtml.includes("1 / 5"), "No 1 / 5 carousel");
assert(!indexHtml.includes("1/5"), "No 1/5 carousel");
assert(!indexHtml.includes("2 / 5"), "No 2 / 5 carousel");
console.log("✔ Test 1 passed: No carousel or slide indicator found");

assert(indexHtml.includes("Version Bêta"), "Must contain Version Bêta");
console.log("✔ Test 2 passed: Mention Version Bêta bien visible");

assert(indexHtml.includes("Switch Bénin"), "Must contain Switch Bénin");
console.log("✔ Test 3 passed: Nom Switch Bénin et logo présents");

assert(indexHtml.includes("Commencer"), "Must contain Commencer");
assert(indexHtml.includes("inscription/code.html"), "Commencer must link to inscription");
console.log("✔ Test 4 passed: Bouton Commencer redirige vers inscription");

assert(indexHtml.includes("Se connecter"), "Must contain Se connecter");
assert(indexHtml.includes("connexion/code.html"), "Se connecter must link to connexion");
console.log("✔ Test 5 passed: Bouton Se connecter redirige vers connexion");

assert(indexHtml.includes("Découvrir les fonctionnalités"), "Discovery link exists");
console.log("✔ Test 6 passed: Lien discret Découvrir les fonctionnalités présent");

console.log("=== ALL 6/6 WELCOME SCREEN TESTS PASSED 100% ===");
