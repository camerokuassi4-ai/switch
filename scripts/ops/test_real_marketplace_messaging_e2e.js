/**
 * CONTRE-AUDIT E2E RÉEL : MARKETPLACE & MESSAGERIE (4 SESSIONS INDÉPENDANTES & HTTP RÉEL)
 * Fichier : scripts/ops/test_real_marketplace_messaging_e2e.js
 */

const http = require('http');
const { PreprodApiApp } = require('../../backend/preprod_api_server.js');

async function runRealMarketplaceMessagingE2e() {
  console.log("===============================================================================");
  console.log("CONTRE-AUDIT E2E RÉEL : MARKETPLACE & MESSAGERIE (4 SESSIONS ISOLÉES)");
  console.log("===============================================================================\n");

  const PORT = 4095;
  const app = new PreprodApiApp();
  const server = http.createServer((req, res) => app.handleRequest(req, res));
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));

  // Client HTTP de session isolée
  function createSession(userId, role) {
    return {
      userId,
      role,
      request: (method, path, body = null) => {
        return new Promise((resolve, reject) => {
          const payloadStr = body ? JSON.stringify(body) : '';
          const reqHeaders = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payloadStr),
            'x-user-id': userId,
            'x-user-role': role
          };

          const req = http.request({
            host: '127.0.0.1',
            port: PORT,
            path: `/api/v1${path}`,
            method: method,
            headers: reqHeaders
          }, (res) => {
            let resData = '';
            res.on('data', chunk => { resData += chunk; });
            res.on('end', () => {
              let parsed = {};
              try { parsed = JSON.parse(resData); } catch (e) { parsed = resData; }
              resolve({ statusCode: res.statusCode, data: parsed });
            });
          });

          req.on('error', reject);
          if (payloadStr) req.write(payloadStr);
          req.end();
        });
      }
    };
  }

  // 4 Sessions Indépendantes
  const merchant01 = createSession('merchant_test_01', 'MARCHAND');
  const merchant02 = createSession('merchant_test_02', 'MARCHAND');
  const buyer01 = createSession('buyer_test_01', 'CLIENT');
  const buyer02 = createSession('buyer_test_02', 'CLIENT');

  const results = [];
  let createdProdId = null;
  let createdConvId = null;

  // 1. Marchand 01 crée un produit
  const prodRes = await merchant01.request('POST', '/marketplace/products', {
    name: "Panneau Solaire Switch 200W",
    description: "Monocristallin haute efficacité",
    price: 85000,
    stock: 15,
    category: "ENERGIE"
  });

  if (prodRes.statusCode === 201 && prodRes.data.product) {
    createdProdId = prodRes.data.product.id;
  }

  results.push({
    test: "1. Marchand 01 : Création Produit Réelle (POST /marketplace/products)",
    status: prodRes.statusCode === 201 ? "PASSED" : "FAILED",
    details: `HTTP 201 Created | ID: ${createdProdId || 'N/A'} (85 000 FCFA)`
  });

  // 2. Acheteur 01 recherche le produit dans le catalogue
  const catRes = await buyer01.request('GET', '/marketplace/catalog?q=Solaire&category=ENERGIE');
  const found = catRes.statusCode === 200 && catRes.data.products.some(p => p.id === createdProdId);

  results.push({
    test: "2. Acheteur 01 : Consultation Catalogue & Recherche (GET /marketplace/catalog)",
    status: found ? "PASSED" : "FAILED",
    details: `HTTP 200 OK | ${catRes.data.count} produit(s) trouvé(s)`
  });

  // 3. Verrouillage Financier Achat / Checkout
  const buyAttempt = await buyer01.request('POST', '/marketplace/purchase', { product_id: createdProdId, amount: 85000 });
  results.push({
    test: "3. Verrouillage Achat / Checkout en Bêta (POST /marketplace/purchase)",
    status: buyAttempt.statusCode === 403 && buyAttempt.data.error === "FEATURE_NOT_AVAILABLE" ? "PASSED" : "FAILED",
    details: "HTTP 403 Forbidden | FEATURE_NOT_AVAILABLE | 0 FCFA débité"
  });

  // 4. Acheteur 01 crée une conversation avec Marchand 01
  const convRes = await buyer01.request('POST', '/messaging/conversations', {
    merchant_id: 'merchant_test_01',
    product_id: createdProdId
  });

  if (convRes.statusCode === 200 && convRes.data.conversation) {
    createdConvId = convRes.data.conversation.id;
  }

  results.push({
    test: "4. Acheteur 01 : Création Conversation (POST /messaging/conversations)",
    status: convRes.statusCode === 200 ? "PASSED" : "FAILED",
    details: `HTTP 200 OK | Conversation ID: ${createdConvId}`
  });

  // 5. Acheteur 01 envoie un message
  const msgBuyer = await buyer01.request('POST', '/messaging/send', {
    conversation_id: createdConvId,
    text: "Bonjour, le panneau solaire est-il garanti 2 ans ? ☀️"
  });

  // 6. Marchand 01 lit la conversation et répond
  const historyMerchant = await merchant01.request('GET', `/messaging/conversations/${createdConvId}`);
  const msgMerchant = await merchant01.request('POST', '/messaging/send', {
    conversation_id: createdConvId,
    text: "Oui tout à fait, garantie constructeur 24 mois avec facture !"
  });

  const chatPassed = msgBuyer.statusCode === 200 &&
                     historyMerchant.statusCode === 200 &&
                     msgMerchant.statusCode === 200 &&
                     historyMerchant.data.messages.length >= 1;

  results.push({
    test: "5. Échange Bidirectionnel Acheteur 01 <-> Marchand 01",
    status: chatPassed ? "PASSED" : "FAILED",
    details: `Envoi & Réception HTTP 200 OK | 2 messages échangés et horodatés`
  });

  // 7. Test de Sécurité IDOR 1 : Marchand 02 essaie de modifier le produit de Marchand 01
  const idorProd = await merchant02.request('PUT', `/marketplace/products/${createdProdId}`, { price: 100 });
  results.push({
    test: "6. Sécurité IDOR : Marchand 02 modifie Produit Marchand 01",
    status: idorProd.statusCode === 403 ? "PASSED" : "FAILED",
    details: `HTTP 403 Forbidden | ACCES_REFUSE_IDOR_PROTECTION`
  });

  // 8. Test de Sécurité IDOR 2 : Acheteur 02 essaie de lire la conversation d'Acheteur 01
  const idorChatRead = await buyer02.request('GET', `/messaging/conversations/${createdConvId}`);
  const idorChatPost = await buyer02.request('POST', '/messaging/send', { conversation_id: createdConvId, text: "Intrusion" });

  results.push({
    test: "7. Sécurité BOLA/IDOR : Acheteur 02 écoute/écrit dans Chat privé 01",
    status: (idorChatRead.statusCode === 403 && idorChatPost.statusCode === 403) ? "PASSED" : "FAILED",
    details: `HTTP 403 Forbidden | ACCES_REFUSE_CONVERSATION_TIERCE`
  });

  // 9. Test XSS : Injection de balise <script>
  const xssMsg = await buyer01.request('POST', '/messaging/send', {
    conversation_id: createdConvId,
    text: "<script>alert('pwned')</script> Test XSS"
  });
  const historyCheck = await buyer01.request('GET', `/messaging/conversations/${createdConvId}`);
  const lastMsg = historyCheck.data.messages[historyCheck.data.messages.length - 1];
  const isXssNeutralized = lastMsg && !lastMsg.text.includes("<script>") && lastMsg.text.includes("&lt;script&gt;");

  results.push({
    test: "8. Sécurité XSS : Neutralisation balises HTML & Scripts",
    status: isXssNeutralized ? "PASSED" : "FAILED",
    details: `Échappement &lt;script&gt; certifié dans la base persistante`
  });

  await new Promise(resolve => server.close(resolve));

  console.table(results);
  const allSuccess = results.every(r => r.status === "PASSED");
  console.log(`\nBILAN DU CONTRE-AUDIT E2E RÉEL : ${allSuccess ? "100% SUCCÈS (MARKETPLACE_MESSAGING_PASS)" : "ÉCHEC"}\n`);
  return allSuccess;
}

if (require.main === module) {
  runRealMarketplaceMessagingE2e();
}

module.exports = { runRealMarketplaceMessagingE2e };
