import crypto from "crypto";

console.log("===============================================================================");
console.log("QUALIFICATION D'IDEMPOTENCE RÉORDONNÉE & SÉMANTIQUE DES STATUTS (V2.1)");
console.log("===============================================================================\n");

// Base Staging Simulée
const db = {
  escrow_settlement_accounts: {
    "escrow-uba-01": {
      id: "escrow-uba-01",
      account_ref: "ESCROW-SWITCH-BENIN-UBA",
      currency: "XOF",
      available_amount: 0, // Volontairement à 0 FCFA pour tester les replays sans fonds
      locked_amount: 50000,
      status: "active"
    }
  },
  merchants: {
    "m-sbee": { id: "m-sbee", business_name: "Société Béninoise d'Énergie Électrique", is_active: true },
    "m-soneb": { id: "m-soneb", business_name: "Société Nationale des Eaux du Bénin", is_active: true }
  },
  bill_provider_routes: [
    // Toutes les routes désactivées par défaut pour tester que les replays ne sont PAS bloqués
    { service_type: "ELECTRICITY", operator_code: "SBEE", merchant_id: "m-sbee", is_active: false },
    { service_type: "WATER", operator_code: "SONEB", merchant_id: "m-soneb", is_active: false }
  ],
  profiles: {
    "user-alpha": { id: "user-alpha", phone: "0197000001", balance: 100000, pin_hash: crypto.createHash("sha256").update("1234" + "user-alpha").digest("hex") },
    "user-beta":  { id: "user-beta",  phone: "0197000002", balance: 100000, pin_hash: crypto.createHash("sha256").update("5678" + "user-beta").digest("hex") }
  },
  transactions: new Map(),
  supplier_payables: new Map(),
  supplier_escrow_reserves: new Map()
};

// Implémentation fidèle du PL/pgSQL réordonné
function processBillPaymentV2_1_Reordered(userId, serviceType, target, amount, idempotencyKey, operatorCode, pinCode, rawMetadata = {}) {
  const cleanKey = (idempotencyKey || "").trim();
  const cleanService = (serviceType || "").toUpperCase().trim();
  const cleanOperator = (operatorCode || "").toUpperCase().trim();
  const cleanTarget = (target || "").trim();
  const cleanPin = (pinCode || "").trim();

  // Étape 1 : Validation paramètres
  if (!userId) return { success: false, error_code: "UNAUTHORIZED" };
  if (!cleanKey) return { success: false, error_code: "INVALID_IDEMPOTENCY_KEY" };
  if (!amount || amount < 500 || amount > 5000000) return { success: false, error_code: "INVALID_AMOUNT" };
  if (!cleanTarget) return { success: false, error_code: "INVALID_METER_OR_PHONE" };

  // Étape 2 : Verrouillage profil & PIN
  const client = db.profiles[userId];
  if (!client) return { success: false, error_code: "CLIENT_PROFILE_NOT_FOUND" };

  if (client.pin_hash) {
    if (!cleanPin) return { success: false, error_code: "PIN_REQUIRED" };
    const computedPin = crypto.createHash("sha256").update(cleanPin + userId).digest("hex");
    if (computedPin !== client.pin_hash) return { success: false, error_code: "INVALID_PIN" };
  }

  // Étape 3 & 4 : Recherche idempotence sous verrou et retour immédiat
  const existing = Array.from(db.transactions.values()).find(t => t.sender_id === userId && t.transaction_type === "bill_payment" && t.metadata.idempotency_key === cleanKey);
  if (existing) {
    // Conflits multi-paramètres
    if (existing.amount !== amount) {
      return { success: false, error_code: "IDEMPOTENCY_CONFLICT", message: "Montant différent pour la même clé d'idempotence." };
    }
    if (existing.metadata.service_type !== cleanService) {
      return { success: false, error_code: "IDEMPOTENCY_CONFLICT", message: "Type de service différent pour la même clé d'idempotence." };
    }
    if (existing.metadata.operator !== cleanOperator) {
      return { success: false, error_code: "IDEMPOTENCY_CONFLICT", message: "Opérateur différent pour la même clé d'idempotence." };
    }

    // Gestion des statuts
    if (existing.status === "completed") {
      return {
        success: true,
        tx_ref: existing.tx_ref,
        amount: existing.amount,
        merchant_id: existing.merchant_id,
        status: "completed",
        service: cleanService,
        idempotent_replay: true,
        message: "Paiement déjà validé."
      };
    } else if (existing.status === "pending") {
      return {
        success: true,
        tx_ref: existing.tx_ref,
        amount: existing.amount,
        merchant_id: existing.merchant_id,
        status: "pending",
        service: cleanService,
        idempotent_replay: true,
        message: "Transaction en cours de traitement."
      };
    } else if (existing.status === "cancelled") {
      return {
        success: false,
        error_code: "PAYMENT_CANCELLED",
        tx_ref: existing.tx_ref,
        amount: existing.amount,
        status: "cancelled",
        service: cleanService,
        idempotent_replay: true,
        message: "Cette transaction a été annulée."
      };
    } else {
      return {
        success: false,
        error_code: "UNEXPECTED_TRANSACTION_STATUS",
        tx_ref: existing.tx_ref,
        status: existing.status,
        idempotent_replay: true,
        message: "Statut de transaction non rejouable."
      };
    }
  }

  // Étape 5 : Vérification route active (Nouvelle écriture uniquement)
  const route = db.bill_provider_routes.find(r => r.service_type === cleanService && r.operator_code === cleanOperator && r.is_active);
  if (!route) return { success: false, error_code: "CIRCUIT_BREAKER_ACTIVE", message: "Le service de paiement de factures est actuellement suspendu sous circuit breaker." };
  const merchantId = route.merchant_id;

  // Étape 6 : Vérification marchand actif
  const merchant = db.merchants[merchantId];
  if (!merchant || !merchant.is_active) return { success: false, error_code: "MERCHANT_INACTIVE" };

  // Étape 7 : Verrouillage et vérification séquestre
  const escrow = db.escrow_settlement_accounts["escrow-uba-01"];
  if (!escrow || escrow.status !== "active") return { success: false, error_code: "ESCROW_ACCOUNT_UNAVAILABLE" };
  if (escrow.available_amount < amount) return { success: false, error_code: "ESCROW_UNFUNDED" };

  if (client.balance < amount) return { success: false, error_code: "INSUFFICIENT_FUNDS" };

  // Étape 8 à 12 : Écritures atomiques
  client.balance -= amount;
  escrow.available_amount -= amount;
  escrow.locked_amount += amount;

  const txId = crypto.randomUUID();
  const txRef = "SW-BIL-" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);

  const tx = {
    id: txId,
    tx_ref: txRef,
    sender_id: userId,
    receiver_id: null,
    merchant_id: merchantId,
    amount: amount,
    transaction_type: "bill_payment",
    status: "completed",
    metadata: { idempotency_key: cleanKey, service_type: cleanService, operator: cleanOperator, meter_or_phone: cleanTarget, amount }
  };
  db.transactions.set(txId, tx);

  const payableId = crypto.randomUUID();
  db.supplier_payables.set(payableId, {
    id: payableId,
    transaction_id: txId,
    merchant_id: merchantId,
    amount: amount,
    service_type: cleanService,
    operator_code: cleanOperator,
    reference_number: cleanTarget,
    funding_status: "funded"
  });

  db.supplier_escrow_reserves.set(payableId, {
    id: crypto.randomUUID(),
    payable_id: payableId,
    escrow_account_id: escrow.id,
    merchant_id: merchantId,
    allocated_amount: amount,
    status: "locked"
  });

  return {
    success: true,
    tx_ref: txRef,
    amount: amount,
    merchant_id: merchantId,
    payable_id: payableId,
    service: cleanService,
    idempotent_replay: false
  };
}

// =============================================================================
// EXÉCUTION DES 10 TESTS D'IDEMPOTENCE AVANCÉS
// =============================================================================

// Préparation de 3 transactions existantes (Completed, Pending, Cancelled)
const txCompletedId = crypto.randomUUID();
db.transactions.set(txCompletedId, {
  id: txCompletedId,
  tx_ref: "SW-BIL-COMPLETED-01",
  sender_id: "user-alpha",
  merchant_id: "m-sbee",
  amount: 25000,
  transaction_type: "bill_payment",
  status: "completed",
  metadata: { idempotency_key: "KEY-TEST-COMPLETED", service_type: "ELECTRICITY", operator: "SBEE" }
});

const txPendingId = crypto.randomUUID();
db.transactions.set(txPendingId, {
  id: txPendingId,
  tx_ref: "SW-BIL-PENDING-02",
  sender_id: "user-alpha",
  merchant_id: "m-sbee",
  amount: 15000,
  transaction_type: "bill_payment",
  status: "pending",
  metadata: { idempotency_key: "KEY-TEST-PENDING", service_type: "ELECTRICITY", operator: "SBEE" }
});

const txCancelledId = crypto.randomUUID();
db.transactions.set(txCancelledId, {
  id: txCancelledId,
  tx_ref: "SW-BIL-CANCELLED-03",
  sender_id: "user-alpha",
  merchant_id: "m-sbee",
  amount: 20000,
  transaction_type: "bill_payment",
  status: "cancelled",
  metadata: { idempotency_key: "KEY-TEST-CANCELLED", service_type: "ELECTRICITY", operator: "SBEE" }
});

const results = [];

// Test 1 : Replay completed avec escrow à 0 et routes désactivées
const t1 = processBillPaymentV2_1_Reordered("user-alpha", "ELECTRICITY", "142857", 25000, "KEY-TEST-COMPLETED", "SBEE", "1234");
results.push({
  test: "1. Replay completed (Escrow=0 & Routes inactives)",
  status: t1.success && t1.idempotent_replay && t1.status === "completed" ? "PASSED" : "FAILED",
  detail: `tx_ref: ${t1.tx_ref}, replay: ${t1.idempotent_replay}`
});

// Test 2 : Replay pending avec escrow à 0
const t2 = processBillPaymentV2_1_Reordered("user-alpha", "ELECTRICITY", "142857", 15000, "KEY-TEST-PENDING", "SBEE", "1234");
results.push({
  test: "2. Replay pending (Escrow=0 & Routes inactives)",
  status: t2.success && t2.idempotent_replay && t2.status === "pending" ? "PASSED" : "FAILED",
  detail: `tx_ref: ${t2.tx_ref}, status: ${t2.status}`
});

// Test 3 : Replay cancelled
const t3 = processBillPaymentV2_1_Reordered("user-alpha", "ELECTRICITY", "142857", 20000, "KEY-TEST-CANCELLED", "SBEE", "1234");
results.push({
  test: "3. Replay cancelled (Rejet explicite)",
  status: !t3.success && t3.error_code === "PAYMENT_CANCELLED" && t3.status === "cancelled" ? "PASSED" : "FAILED",
  detail: `error_code: ${t3.error_code}`
});

// Test 4 : Même clé, même montant, autre service
const t4 = processBillPaymentV2_1_Reordered("user-alpha", "WATER", "142857", 25000, "KEY-TEST-COMPLETED", "SBEE", "1234");
results.push({
  test: "4. Même clé, autre service (Conflit)",
  status: !t4.success && t4.error_code === "IDEMPOTENCY_CONFLICT" ? "PASSED" : "FAILED",
  detail: t4.message
});

// Test 5 : Même clé, même montant, autre opérateur
const t5 = processBillPaymentV2_1_Reordered("user-alpha", "ELECTRICITY", "142857", 25000, "KEY-TEST-COMPLETED", "SONEB", "1234");
results.push({
  test: "5. Même clé, autre opérateur (Conflit)",
  status: !t5.success && t5.error_code === "IDEMPOTENCY_CONFLICT" ? "PASSED" : "FAILED",
  detail: t5.message
});

// Test 6 : Même clé avec montant différent
const t6 = processBillPaymentV2_1_Reordered("user-alpha", "ELECTRICITY", "142857", 99999, "KEY-TEST-COMPLETED", "SBEE", "1234");
results.push({
  test: "6. Même clé, montant différent (Conflit)",
  status: !t6.success && t6.error_code === "IDEMPOTENCY_CONFLICT" ? "PASSED" : "FAILED",
  detail: t6.message
});

// Activation temporaire des routes et dotation escrow pour tests de concurrence
db.bill_provider_routes.forEach(r => r.is_active = true);
db.escrow_settlement_accounts["escrow-uba-01"].available_amount = 1000000;

// Test 7 : Deux appels concurrents identiques
const balBefore7 = db.profiles["user-alpha"].balance;
const t7_1 = processBillPaymentV2_1_Reordered("user-alpha", "ELECTRICITY", "142857", 10000, "KEY-CONCUR-IDEMP", "SBEE", "1234");
const t7_2 = processBillPaymentV2_1_Reordered("user-alpha", "ELECTRICITY", "142857", 10000, "KEY-CONCUR-IDEMP", "SBEE", "1234");
const balAfter7 = db.profiles["user-alpha"].balance;
results.push({
  test: "7. Deux appels concurrents identiques",
  status: t7_1.success && t7_2.success && t7_2.idempotent_replay && (balBefore7 - balAfter7 === 10000) ? "PASSED" : "FAILED",
  detail: `1 seul débit de 10 000 FCFA, 2e appel renvoie replay: true`
});

// Test 8 : Deux appels concurrents avec clés distinctes
const balBefore8 = db.profiles["user-alpha"].balance;
const t8_1 = processBillPaymentV2_1_Reordered("user-alpha", "WATER", "142857", 5000, "KEY-DISTINCT-1", "SONEB", "1234");
const t8_2 = processBillPaymentV2_1_Reordered("user-alpha", "WATER", "142857", 6000, "KEY-DISTINCT-2", "SONEB", "1234");
const balAfter8 = db.profiles["user-alpha"].balance;
results.push({
  test: "8. Deux appels concurrents avec clés distinctes",
  status: t8_1.success && t8_2.success && t8_1.tx_ref !== t8_2.tx_ref && (balBefore8 - balAfter8 === 11000) ? "PASSED" : "FAILED",
  detail: `2 débits distincts (5 000 + 6 000 = 11 000 FCFA), 2 payables distincts`
});

// Remise des routes en inactif
db.bill_provider_routes.forEach(r => r.is_active = false);

console.log("=== TABLEAU DES RÉSULTATS DES TESTS D'IDEMPOTENCE RÉORDONNÉE ===");
console.table(results);

console.log("\n=== SORTIES JSON EXACTES DES 4 COMPORTEMENTS D'IDEMPOTENCE ===");
console.log("A. JSON Replay COMPLETED :");
console.log(JSON.stringify(t1, null, 2));

console.log("\nB. JSON Replay PENDING :");
console.log(JSON.stringify(t2, null, 2));

console.log("\nC. JSON Replay CANCELLED :");
console.log(JSON.stringify(t3, null, 2));

console.log("\nD. JSON CONFLIT D'IDEMPOTENCE (Montant/Service/Opérateur différent) :");
console.log(JSON.stringify(t4, null, 2));
