import crypto from "crypto";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(str) {
  return typeof str === "string" && UUID_REGEX.test(str.trim());
}

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
    return res.status(401).json({ success: false, error_code: "UNAUTHORIZED", error: "Session client requise." });
  }

  const { amount, idempotency_key, rotate_request_id, rotateRequestId } = req.body || {};

  if (rotate_request_id && rotateRequestId && rotate_request_id !== rotateRequestId) {
    return res.status(400).json({
      success: false,
      error_code: "AMBIGUOUS_ROTATION_TARGET",
      error: "Les champs rotate_request_id et rotateRequestId ne correspondent pas."
    });
  }

  const rawRotateId = rotate_request_id || rotateRequestId;
  if (rawRotateId !== undefined && rawRotateId !== null && rawRotateId !== "") {
    if (!isValidUUID(rawRotateId)) {
      return res.status(400).json({
        success: false,
        error_code: "INVALID_ROTATION_TARGET",
        error: "Identifiant de demande à renouveler invalide (UUID attendu)."
      });
    }
  }
  const targetRotateId = isValidUUID(rawRotateId) ? rawRotateId.trim() : null;

  const cleanKey = (idempotency_key || "").toString().trim();
  if (!cleanKey || cleanKey.length > 128) {
    return res.status(400).json({
      success: false,
      error_code: "INVALID_IDEMPOTENCY_KEY",
      error: "Clé d'idempotence invalide ou manquante."
    });
  }

  const amtVal = validateAmount(amount);
  if (!amtVal.valid) {
    return res.status(400).json({
      success: false,
      error_code: amtVal.error,
      error: "Le montant doit être un entier strict compris entre 500 et 5 000 000 FCFA."
    });
  }
  const parsedAmount = amtVal.value;

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
      return res.status(401).json({ success: false, error_code: "UNAUTHORIZED", error: "Jeton client expiré ou invalide." });
    }
    const authData = await authRes.json();
    const clientUserId = authData.id;

    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${clientUserId}&select=phone`, {
      headers: { "apikey": serviceRoleKey, "Authorization": `Bearer ${serviceRoleKey}` }
    });
    const profileRows = await profileRes.json();
    if (!profileRows || !profileRows.length || !profileRows[0].phone) {
      return res.status(400).json({ success: false, error_code: "PHONE_MISSING", error: "Profil client ou numéro introuvable." });
    }

    const canonicalPhone = toCanonicalBeninPhone(profileRows[0].phone);
    if (!canonicalPhone) {
      return res.status(400).json({ success: false, error_code: "INVALID_PHONE_FORMAT", error: "Numéro de téléphone non conforme Bénin (10 chiffres attendus)." });
    }

    const operationId = crypto.randomUUID();
    const rawOtp = String(crypto.randomInt(100000, 1000000));
    const otpHash = computeContextualOtpHash(operationId, canonicalPhone, rawOtp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const calculatedFee = Math.max(50, Math.round(parsedAmount * 0.005));

    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/reserve_client_withdrawal_code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        p_client_user_id: clientUserId,
        p_client_phone: canonicalPhone,
        p_amount: parsedAmount,
        p_idempotency_key: cleanKey,
        p_operation_id: operationId,
        p_otp_hash: otpHash,
        p_expires_at: expiresAt,
        p_fee: calculatedFee,
        p_rotate_request_id: targetRotateId
      })
    });

    const rpcData = await rpcRes.json();

    if (!rpcRes.ok || !rpcData.success) {
      const statusMap = {
        "IDEMPOTENCY_CONFLICT": 409,
        "CLIENT_HOURLY_LIMIT": 429,
        "CLIENT_COOLDOWN_ACTIVE": 429,
        "INSUFFICIENT_FUNDS": 400,
        "ROTATION_TARGET_NOT_FOUND": 404,
        "ROTATION_TARGET_MISMATCH": 404,
        "INVALID_ROTATION_STATUS": 400,
        "ROTATION_TARGET_EXPIRED": 400,
        "ROTATION_AMOUNT_MISMATCH": 400
      };
      const code = statusMap[rpcData.error_code] || 400;
      return res.status(code).json(rpcData);
    }

    if (rpcData.idempotent_replay === true) {
      return res.status(200).json({
        success: true,
        request_id: rpcData.request_id,
        amount: parsedAmount,
        client_phone: canonicalPhone,
        idempotency_key: cleanKey,
        expires_at: rpcData.expires_at,
        idempotent_replay: true,
        message: "Code de retrait express déjà actif."
      });
    }

    return res.status(200).json({
      success: true,
      request_id: rpcData.request_id,
      amount: parsedAmount,
      client_phone: canonicalPhone,
      idempotency_key: cleanKey,
      express_code: rawOtp,
      expires_at: rpcData.expires_at,
      idempotent_replay: false,
      message: rpcData.message || "Code de retrait express généré avec succès."
    });

  } catch (err) {
    return res.status(500).json({ success: false, error_code: "INTERNAL_ERROR", error: "Erreur interne lors du traitement." });
  }
}
