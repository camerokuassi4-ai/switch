/**
 * SERVEUR D'API DE PRÉPRODUCTION AVEC MARCHAND, UTILISATEUR ET QR CODE COMPLET
 * Fichier : backend/preprod_api_server.js
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PREPROD_DB_FILE = path.join(__dirname, '../scratch/preprod_storage.json');

class PersistentPreprodStore {
  constructor() {
    this.ensureDb();
  }

  ensureDb() {
    const dir = path.dirname(PREPROD_DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(PREPROD_DB_FILE)) {
      const initial = {
        profiles: {},
        usedQrCodes: [],
        processedWebhooks: [],
        deliveredNotifications: [],
        tillClosures: [],
        products: {},
        conversations: {},
        messages: [],
        qrCodes: {}
      };
      fs.writeFileSync(PREPROD_DB_FILE, JSON.stringify(initial, null, 2));
    }
  }

  read() {
    this.ensureDb();
    const data = JSON.parse(fs.readFileSync(PREPROD_DB_FILE, 'utf8'));
    if (!data.products) data.products = {};
    if (!data.conversations) data.conversations = {};
    if (!data.messages) data.messages = [];
    if (!data.qrCodes) data.qrCodes = {};
    return data;
  }

  write(data) {
    fs.writeFileSync(PREPROD_DB_FILE, JSON.stringify(data, null, 2));
  }
}

class PreprodApiApp {
  constructor() {
    this.store = new PersistentPreprodStore();
    this.secretKey = "preprod-hmac-secret-key-2026";
  }

  sanitize(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', () => {
      let body = {};
      try {
        if (bodyData) body = JSON.parse(bodyData);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: "INVALID_JSON_PAYLOAD" }));
      }

      res.setHeader('Content-Type', 'application/json');
      const db = this.store.read();

      // =========================================================================
      // 1. QR CODES MARCHAND : GÉNÉRATION & RÉSOLUTION
      // =========================================================================
      if (pathname === '/api/v1/qr/generate' && method === 'POST') {
        const merchantId = req.headers['x-user-id'] || body.merchant_id;
        const role = req.headers['x-user-role'] || body.role;

        if (role !== 'MARCHAND' && role !== 'ADMIN') {
          res.writeHead(403);
          return res.end(JSON.stringify({ error: "ROLE_MARCHAND_REQUIS" }));
        }

        const qrType = body.type || 'QR_STATIQUE'; // QR_STATIQUE, QR_DYNAMIQUE, QR_PRODUIT, QR_BOUTIQUE
        const amount = typeof body.amount === 'number' ? body.amount : null;
        const productId = body.product_id || null;
        const qrId = `QR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const qrRecord = {
          qr_id: qrId,
          merchant_id: merchantId,
          type: qrType,
          amount_fcfa: amount,
          product_id: productId,
          qr_string: `SWITCH-QR:V1:${qrId}:${merchantId}:${amount || 'FLEX'}:${productId || 'TILL'}`,
          created_at: new Date().toISOString(),
          expires_at: qrType === 'QR_DYNAMIQUE' ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null, // 15 mins
          scans_count: 0
        };

        db.qrCodes[qrId] = qrRecord;
        this.store.write(db);

        res.writeHead(201);
        return res.end(JSON.stringify({ success: true, qr: qrRecord }));
      }

      if (pathname === '/api/v1/qr/resolve' && method === 'POST') {
        const qrString = body.qr_string || body.qr_id;
        if (!qrString) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: "QR_DATA_MANQUANTE" }));
        }

        // Recherche du QR dans la base
        let qr = Object.values(db.qrCodes).find(q => q.qr_id === qrString || q.qr_string === qrString);
        if (!qr) {
          res.writeHead(404);
          return res.end(JSON.stringify({ error: "QR_CODE_INTROUVABLE_OU_INVALIDE" }));
        }

        // Vérification de l'expiration
        if (qr.expires_at && new Date() > new Date(qr.expires_at)) {
          res.writeHead(410);
          return res.end(JSON.stringify({ error: "QR_CODE_EXPIRE" }));
        }

        qr.scans_count = (qr.scans_count || 0) + 1;
        this.store.write(db);

        res.writeHead(200);
        return res.end(JSON.stringify({
          success: true,
          resolved: {
            qr_id: qr.qr_id,
            merchant_id: qr.merchant_id,
            type: qr.type,
            amount_fcfa: qr.amount_fcfa,
            product_id: qr.product_id,
            scans_count: qr.scans_count
          }
        }));
      }

      // Verrouillage du paiement par QR en Bêta
      if (pathname === '/api/v1/qr/pay' && method === 'POST') {
        res.writeHead(403);
        return res.end(JSON.stringify({ error: "FEATURE_NOT_AVAILABLE", message: "Transactions QR désactivées en Bêta." }));
      }

      // =========================================================================
      // 2. MARKETPLACE & CATALOGUE
      // =========================================================================
      if (pathname === '/api/v1/marketplace/products' && method === 'POST') {
        const requesterId = req.headers['x-user-id'] || body.merchant_id;
        const role = req.headers['x-user-role'] || body.role;

        if (role !== 'MARCHAND' && role !== 'ADMIN') {
          res.writeHead(403);
          return res.end(JSON.stringify({ error: "ROLE_MARCHAND_REQUIS" }));
        }

        if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: "NOM_PRODUIT_REQUIS" }));
        }
        if (typeof body.price !== 'number' || body.price <= 0) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: "PRIX_INVALIDE_POSITIF_REQUIS" }));
        }

        const prodId = `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const product = {
          id: prodId,
          merchant_id: requesterId,
          name: this.sanitize(body.name.trim()),
          description: this.sanitize(body.description || ''),
          price_fcfa: body.price,
          stock: typeof body.stock === 'number' && body.stock >= 0 ? body.stock : 0,
          category: body.category || 'GENERAL',
          status: 'PUBLISHED',
          created_at: new Date().toISOString()
        };

        db.products[prodId] = product;
        this.store.write(db);

        res.writeHead(201);
        return res.end(JSON.stringify({ success: true, product }));
      }

      if (pathname.startsWith('/api/v1/marketplace/products/') && method === 'PUT') {
        const prodId = pathname.replace('/api/v1/marketplace/products/', '');
        const requesterId = req.headers['x-user-id'] || body.user_id;
        const product = db.products[prodId];

        if (!product) {
          res.writeHead(404);
          return res.end(JSON.stringify({ error: "PRODUIT_INTROUVABLE" }));
        }

        if (product.merchant_id !== requesterId && req.headers['x-user-role'] !== 'ADMIN') {
          res.writeHead(403);
          return res.end(JSON.stringify({ error: "ACCES_REFUSE_IDOR_PROTECTION" }));
        }

        if (body.price !== undefined && body.price <= 0) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: "PRIX_INVALIDE" }));
        }

        if (body.name) product.name = this.sanitize(body.name);
        if (body.description) product.description = this.sanitize(body.description);
        if (body.price) product.price_fcfa = body.price;
        if (body.status) product.status = body.status;
        product.updated_at = new Date().toISOString();

        db.products[prodId] = product;
        this.store.write(db);

        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, product }));
      }

      if (pathname === '/api/v1/marketplace/catalog' && method === 'GET') {
        const query = (parsedUrl.query.q || '').toLowerCase();
        const cat = parsedUrl.query.category;

        let list = Object.values(db.products).filter(p => p.status === 'PUBLISHED');
        if (cat) list = list.filter(p => p.category === cat);
        if (query) list = list.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));

        res.writeHead(200);
        return res.end(JSON.stringify({ count: list.length, products: list }));
      }

      if (pathname === '/api/v1/marketplace/purchase' && method === 'POST') {
        res.writeHead(403);
        return res.end(JSON.stringify({ error: "FEATURE_NOT_AVAILABLE", message: "Transactions non activées en Bêta." }));
      }

      // =========================================================================
      // 3. MESSAGERIE MARCHAND - ACHETEUR
      // =========================================================================
      if (pathname === '/api/v1/messaging/conversations' && method === 'POST') {
        const buyerId = req.headers['x-user-id'] || body.buyer_id;
        const merchantId = body.merchant_id;
        const prodId = body.product_id;

        if (!buyerId || !merchantId) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: "BUYER_AND_MERCHANT_REQUIRED" }));
        }

        const convId = `CONV-${buyerId}-${merchantId}-${prodId || 'GEN'}`;
        if (!db.conversations[convId]) {
          db.conversations[convId] = {
            id: convId,
            buyer_id: buyerId,
            merchant_id: merchantId,
            product_id: prodId,
            unread_count_buyer: 0,
            unread_count_merchant: 0,
            created_at: new Date().toISOString()
          };
          this.store.write(db);
        }

        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, conversation: db.conversations[convId] }));
      }

      if (pathname === '/api/v1/messaging/send' && method === 'POST') {
        const senderId = req.headers['x-user-id'] || body.sender_id;
        const convId = body.conversation_id;
        const conv = db.conversations[convId];

        if (!conv) {
          res.writeHead(404);
          return res.end(JSON.stringify({ error: "CONVERSATION_INTROUVABLE" }));
        }

        if (senderId !== conv.buyer_id && senderId !== conv.merchant_id) {
          res.writeHead(403);
          return res.end(JSON.stringify({ error: "NON_AUTORISE_CONVERSATION_PRIVEE" }));
        }

        if (!body.text || body.text.trim().length === 0) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: "MESSAGE_VIDE_INTERDIT" }));
        }

        const cleanText = this.sanitize(body.text.trim());
        const msgId = `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const message = {
          id: msgId,
          conversation_id: convId,
          sender_id: senderId,
          text: cleanText,
          sent_at: new Date().toISOString(),
          read: false
        };

        db.messages.push(message);
        if (senderId === conv.buyer_id) conv.unread_count_merchant++;
        else conv.unread_count_buyer++;

        this.store.write(db);

        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, message }));
      }

      if (pathname.startsWith('/api/v1/messaging/conversations/') && method === 'GET') {
        const convId = pathname.replace('/api/v1/messaging/conversations/', '');
        const requesterId = req.headers['x-user-id'] || parsedUrl.query.user_id;
        const conv = db.conversations[convId];

        if (!conv) {
          res.writeHead(404);
          return res.end(JSON.stringify({ error: "CONVERSATION_INTROUVABLE" }));
        }

        if (requesterId !== conv.buyer_id && requesterId !== conv.merchant_id && req.headers['x-user-role'] !== 'ADMIN') {
          res.writeHead(403);
          return res.end(JSON.stringify({ error: "ACCES_REFUSE_CONVERSATION_TIERCE" }));
        }

        if (requesterId === conv.buyer_id) conv.unread_count_buyer = 0;
        if (requesterId === conv.merchant_id) conv.unread_count_merchant = 0;
        this.store.write(db);

        const history = db.messages.filter(m => m.conversation_id === convId);
        res.writeHead(200);
        return res.end(JSON.stringify({ conversation: conv, messages: history }));
      }

      // Verrouillage de toutes les routes financières en Bêta publique
      if (pathname.startsWith('/api/v1/payments') || pathname.startsWith('/api/v1/transactions')) {
        res.writeHead(403);
        return res.end(JSON.stringify({ error: "FEATURE_NOT_AVAILABLE", message: "Fonctionnalités financières désactivées en Bêta publique." }));
      }

      // 404
      res.writeHead(404);
      res.end(JSON.stringify({ error: "ENDPOINT_NOT_FOUND" }));
    });
  }
}

module.exports = { PreprodApiApp };
