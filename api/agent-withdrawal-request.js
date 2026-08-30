import crypto from "crypto";

function toCanonicalBeninPhone(input) {
  if (!input) return null;
  let d = input.toString().replace(/\D/g, "");
  if (d.startsWith("229") && d.length === 13) d = d.substring(3);
  if (d.length === 8) d = "01" + d;
  if (d.length === 10 && d.startsWith("01")) return d;
  return null;
}

function computeContextualOtpHash(operationId, clientPhone, rawOtp) {
  return crypto.createHash("sha256").update(operationId + "|" + clientPhone + "|" + rawOtp.trim()).digest("hex");
}

function validateAmount(amount) {
  if (typeof amount === "string") {
    if (!/^\d+$/.test(amount.trim())) return { valid: false, error: "INVALID_AMOUNT" };
    amount = Number(amount.trim());
  }
  if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount < 500 || amount > 5000000) {
    return { valid: false, error: "AMOUNT_OUT_OF_BOUNDS" };
  }
  return { valid: true, value: amount };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ success: false, error_code: "UNAUTHORIZED", error: "Session agent requise." });
  }

  const { client_phone, amount, idempotency_key } = req.body || {};

  const cleanKey = (idempotency_key || "").toString().trim();
  if (!cleanKey || cleanKey.length > 128) {
    return res.status(400).json({ success: false, error_code: "INVALID_IDEMPOTENCY_KEY", error: "Clé d'idempotence invalide." });
  }

  const amtVal = validateAmount(amount);
  if (!amtVal.valid) {
    return res.status(400).json({ success: false, error_code: amtVal.error, error: "Montant invalide (500 à 5 000 000 FCFA)." });
  }
  const parsedAmount = amtVal.value;

  const canonicalPhone = toCanonicalBeninPhone(client_phone);
  if (!canonicalPhone) {
    return res.status(400).json({ success: false, error_code: "INVALID_PHONE_FORMAT", error: "Numéro de téléphone client non conforme Bénin (10 chiffres)." });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ success: false, error_code: "CONFIG_ERROR", error: "Configuration serveur incomplète." });
    }

    const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { "apikey": serviceRoleKey, "Authorization": `Bearer ${token}` }
    });
    if (!authRes.ok) {
      return res.status(401).json({ success: false, error_code: "UNAUTHORIZED", error: "Jeton agent expiré ou invalide." });
    }
    const authData = await authRes.json();
    const agentUserId = authData.id;

    const operationId = crypto.randomUUID();
    const claimToken = crypto.randomUUID();
    const rawOtp = String(crypto.randomInt(100000, 1000000));
    const otpHash = computeContextualOtpHash(operationId, canonicalPhone, rawOtp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const calculatedFee = Math.max(100, Math.round(parsedAmount * 0.008));

    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/reserve_withdrawal_otp_request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        p_agent_user_id: agentUserId,
        p_client_phone: canonicalPhone,
        p_amount: parsedAmount,
        p_idempotency_key: cleanKey,
        p_operation_id: operationId,
        p_otp_hash: otpHash,
        p_expires_at: expiresAt,
        p_claim_token: claimToken,
        p_fee: calculatedFee
      })
    });

    const rpcData = await rpcRes.json();

    if (!rpcRes.ok || !rpcData.success) {
      return res.status(400).json(rpcData);
    }

    return res.status(200).json({
      success: true,
      request_id: rpcData.request_id,
      amount: parsedAmount,
      client_phone: canonicalPhone,
      idempotency_key: cleanKey,
      expires_at: rpcData.expires_at,
      idempotent_replay: rpcData.idempotent_replay,
      message: "Demande de retrait initiée. SMS en cours d'envoi."
    });

  } catch (err) {
    return res.status(500).json({ success: false, error_code: "INTERNAL_ERROR", error: "Erreur interne serveur." });
  }
}
