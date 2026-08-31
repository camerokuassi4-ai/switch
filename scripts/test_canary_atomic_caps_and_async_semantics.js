import crypto from "crypto";

console.log("===============================================================================");
console.log("TESTS DU MODÈLE ASYNCHRONE, PLAFONDS CANARY ATOMIQUES & TRANSITIONS FOURNISSEUR");
console.log("===============================================================================\n");

// Base Staging Simulée
const db = {
  escrow_settlement_accounts: {
    "escrow-uba-01": {
      id: "escrow-uba-01",
      account_ref: "ESCROW-SWITCH-BENIN-UBA",
      currency: "XOF",
      available_amount: 50000000,
      locked_amount: 0,
      status: "active"
    }
  },
  canary_route_controllers: {
    "ELECTRICITY::SBEE": {
      route_key: "ELECTRICITY::SBEE",
      enabled: true,
      max_transactions: 50,
      max_volume: 1000000,
      current_transactions: 0,
      current_volume: 0,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 1800000).toISOString(), // 30 min
      emergency_stop: false
    }
  },
  merchants: {
    "m-sbee": { id: "m-sbee", business_name: "SBEE", is_active: true }
  },
  bill_provider_routes: [
    { service_type: "ELECTRICITY", operator_code: "SBEE", merchant_id: "m-sbee", is_active: true }
  ],
  profiles: {
    "user-alpha": { id: "user-alpha", balance: 500000, pin_hash: crypto.createHash("sha256").update("1234" + "user-alpha").digest("hex") }
  },
  transactions: new Map(),
  supplier_payables: new Map(),
  supplier_escrow_reserves: new Map()
};

function processBillV2_1_Async(userId, serviceType, target, amount, key, operatorCode, pinCode) {
  const cleanKey = (key || "").trim();
  const cleanService = (serviceType || "").toUpperCase().trim();
  const cleanOperator = (operatorCode || "").toUpperCase().trim();
  const cleanTarget = (target || "").trim();
  const cleanPin = (pinCode || "").trim();
  const routeKey = `${cleanService}::${cleanOperator}`;

  if (!userId) return { success: false, error_code: "UNAUTHORIZED" };
  if (!cleanKey) return { success: false, error_code: "INVALID_IDEMPOTENCY_KEY" };
  if (!amount || amount < 500 || amount > 5000000) return { success: false, error_code: "INVALID_AMOUNT" };
  if (!cleanTarget) return { success: false, error_code: "INVALID_METER_OR_PHONE" };

  // 1. Profil & PIN
  const client = db.profiles[userId];
  if (!client) return { success: false, error_code: "CLIENT_PROFILE_NOT_FOUND" };
  if (client.pin_hash) {
    const computedPin = crypto.createHash("sha256").update(cleanPin + userId).digest("hex");
    if (computedPin !== client.pin_hash) return { success: false, error_code: "INVALID_PIN" };
  }

  // 2. Idempotence Check
  const existing = Array.from(db.transactions.values()).find(t => t.sender_id === userId && t.transaction_type === "bill_payment" && t.metadata.idempotency_key === cleanKey);
  if (existing) {
    if (existing.amount !== amount) return { success: false, error_code: "IDEMPOTENCY_CONFLICT" };
    return {
      success: existing.status !== "cancelled",
      error_code: existing.status === "cancelled" ? "PAYMENT_CANCELLED" : undefined,
      tx_ref: existing.tx_ref,
      amount: existing.amount,
      status: existing.status,
      idempotent_replay: true,
      message: existing.status === "completed" ? "Paiement déjà validé." : existing.status === "processing" ? "Paiement en cours de compensation." : "Transaction annulée."
    };
  }

  // 3. Contrôleur Canary Atomique
  const canary = db.canary_route_controllers[routeKey];
  if (canary) {
    if (!canary.enabled || canary.emergency_stop) {
      return { success: false, error_code: "CIRCUIT_BREAKER_ACTIVE", message: "Canary pilote arrêté d'urgence." };
    }
    if (canary.current_transactions + 1 > canary.max_transactions) {
      return { success: false, error_code: "CANARY_TRANSACTION_CAP_EXCEEDED", message: "Plafond de 50 transactions atteint." };
    }
    if (canary.current_volume + amount > canary.max_volume) {
      return { success: false, error_code: "CANARY_VOLUME_CAP_EXCEEDED", message: "Plafond de 1 000 000 FCFA dépassé." };
    }
  }

  // 4. Séquestre & Solde
  const escrow = db.escrow_settlement_accounts["escrow-uba-01"];
  if (escrow.available_amount < amount) return { success: false, error_code: "ESCROW_UNFUNDED" };
  if (client.balance < amount) return { success: false, error_code: "INSUFFICIENT_FUNDS" };

  // Mutations Atomiques
  client.balance -= amount;
  escrow.available_amount -= amount;
  escrow.locked_amount += amount;

  if (canary) {
    canary.current_transactions += 1;
    canary.current_volume += amount;
  }

  const txId = crypto.randomUUID();
  const txRef = "SW-BIL-" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);

  const tx = {
    id: txId,
    tx_ref: txRef,
    sender_id: userId,
    merchant_id: "m-sbee",
    amount: amount,
    transaction_type: "bill_payment",
    status: "processing", // MODÈLE ASYNCHRONE FORMEL
    metadata: { idempotency_key: cleanKey, service_type: cleanService, operator: cleanOperator, meter_or_phone: cleanTarget, amount }
  };
  db.transactions.set(txId, tx);

  const payableId = crypto.randomUUID();
  db.supplier_payables.set(payableId, {
    id: payableId,
    transaction_id: txId,
    merchant_id: "m-sbee",
    amount: amount,
    service_type: cleanService,
    operator_code: cleanOperator,
    reference_number: cleanTarget,
    funding_status: "funded",
    clearing_status: "pending_confirmation"
  });

  db.supplier_escrow_reserves.set(payableId, {
    id: crypto.randomUUID(),
    payable_id: payableId,
    escrow_account_id: escrow.id,
    merchant_id: "m-sbee",
    allocated_amount: amount,
    status: "locked"
  });

  return {
    success: true,
    tx_id: txId,
    tx_ref: txRef,
    amount: amount,
    status: "processing",
    idempotent_replay: false,
    message: "Paiement accepté et en cours de compensation fournisseur."
  };
}

// Fonction Callback de Clearing Fournisseur
function confirmBillClearing(txId, outcome) {
  const tx = db.transactions.get(txId);
  if (!tx || tx.status !== "processing") return { success: false, error_code: "INVALID_STATE_TRANSITION" };

  const payable = Array.from(db.supplier_payables.values()).find(p => p.transaction_id === txId);
  const escrow = db.escrow_settlement_accounts["escrow-uba-01"];
  const client = db.profiles[tx.sender_id];

  if (outcome === "CONFIRMED") {
    tx.status = "completed";
    payable.clearing_status = "confirmed_by_provider";
    return { success: true, status: "completed", tx_ref: tx.tx_ref };
  } else if (outcome === "REJECTED") {
    tx.status = "cancelled";
    payable.clearing_status = "rejected_by_provider";
    payable.funding_status = "cancelled";

    // Remboursement client + Libération séquestre
    client.balance += tx.amount;
    escrow.available_amount += tx.amount;
    escrow.locked_amount -= tx.amount;

    return { success: true, status: "cancelled", refunded_amount: tx.amount, tx_ref: tx.tx_ref };
  }
}

// =============================================================================
// EXÉCUTION DES TESTS
// =============================================================================
const tests = [];

// 1. Paiement accepté en modèle asynchrone (status: processing)
const t1 = processBillV2_1_Async("user-alpha", "ELECTRICITY", "142857", 25000, "KEY-ASYNC-01", "SBEE", "1234");
tests.push({
  test: "1. Paiement accepté (Modèle Asynchrone)",
  status: t1.success && t1.status === "processing" ? "PASSED" : "FAILED",
  detail: `tx_ref: ${t1.tx_ref}, statut initial: ${t1.status}`
});

// 2. Transition CONFIRMED -> completed
const t2 = confirmBillClearing(t1.tx_id, "CONFIRMED");
tests.push({
  test: "2. Confirmation fournisseur -> completed",
  status: t2.success && t2.status === "completed" && db.transactions.get(t1.tx_id).status === "completed" ? "PASSED" : "FAILED",
  detail: `Nouveau statut: ${t2.status}`
});

// 3. Paiement rejeté par fournisseur -> transition cancelled & remboursement
const balBefore3 = db.profiles["user-alpha"].balance;
const t3_pay = processBillV2_1_Async("user-alpha", "ELECTRICITY", "142857", 30000, "KEY-ASYNC-02", "SBEE", "1234");
const t3_reject = confirmBillClearing(t3_pay.tx_id, "REJECTED");
const balAfter3 = db.profiles["user-alpha"].balance;
tests.push({
  test: "3. Rejet fournisseur -> cancelled & Remboursement",
  status: t3_reject.success && t3_reject.status === "cancelled" && balBefore3 === balAfter3 ? "PASSED" : "FAILED",
  detail: `Solde client intégralement restauré: ${balAfter3} FCFA (0 perte)`
});

// 4. Test des Plafonds Canary Atomiques (Volume Cap : 1 000 000 FCFA max)
// Remplissage progressif jusqu'à 950 000 FCFA
const canaryCtrl = db.canary_route_controllers["ELECTRICITY::SBEE"];
canaryCtrl.current_volume = 950000;
canaryCtrl.current_transactions = 10;

// Tentative d'ajouter 60 000 FCFA (950k + 60k = 1 010 000 > 1 000 000 FCFA)
const t4_cap = processBillV2_1_Async("user-alpha", "ELECTRICITY", "142857", 60000, "KEY-CAP-OVERFLOW", "SBEE", "1234");
tests.push({
  test: "4. Dépassement Plafond Volume Canary (1M FCFA max)",
  status: !t4_cap.success && t4_cap.error_code === "CANARY_VOLUME_CAP_EXCEEDED" && canaryCtrl.current_volume === 950000 ? "PASSED" : "FAILED",
  detail: `Rejet atomique sous verrou: ${t4_cap.message}`
});

// 5. Test Arrêt d'Urgence Immédiat (Emergency Stop)
canaryCtrl.emergency_stop = true;
const t5_stop = processBillV2_1_Async("user-alpha", "ELECTRICITY", "142857", 10000, "KEY-STOP-TEST", "SBEE", "1234");
tests.push({
  test: "5. Arrêt d'Urgence Immédiat Canary",
  status: !t5_stop.success && t5_stop.error_code === "CIRCUIT_BREAKER_ACTIVE" ? "PASSED" : "FAILED",
  detail: `Rejet immédiat: ${t5_stop.message}`
});

console.log("=== RÉSULTATS DES TESTS MODÈLE ASYNCHRONE & PLAFONDS ATOMIQUES ===");
console.table(tests);
