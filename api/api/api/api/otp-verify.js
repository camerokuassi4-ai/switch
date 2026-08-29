import crypto from "crypto";

const SUPA = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SECRET = process.env.OTP_HMAC_SECRET;
const hash = (code) => crypto.createHmac("sha256", SECRET).update(code).digest("hex");
function normPhone(input) {
  const d = (input || "").replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("01")) return "+229" + d;
  if (d.length === 13 && d.startsWith("22901")) return "+" + d;
  return null;
}
async function supa(path, opts = {}) {
  return fetch(SUPA + path, {
    ...opts,
    headers: { apikey: SR, Authorization: "Bearer " + SR, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  try {
    const phone = normPhone(req.body && req.body.phone);
    const code = String((req.body && req.body.code) || "");
    if (!phone || !code) return res.status(400).json({ error: "Données invalides" });

    const p = encodeURIComponent(phone);
    const rows = await (await supa(`/rest/v1/otp_codes?phone=eq.${p}&verified_at=is.null&order=created_at.desc&limit=1&select=*`)).json();
    const otp = rows[0];
    if (!otp || new Date(otp.expires_at).getTime() < Date.now())
      return res.status(400).json({ error: "Code expiré ou introuvable" });
    if (otp.attempts >= 5) return res.status(423).json({ error: "Trop de tentatives. Demandez un nouveau code." });

    const a = Buffer.from(hash(code)), b = Buffer.from(otp.code_hash);
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!ok) {
      await supa(`/rest/v1/otp_codes?id=eq.${otp.id}`, { method: "PATCH", body: JSON.stringify({ attempts: otp.attempts + 1 }) });
      return res.status(400).json({ error: "Code incorrect" });
    }

    await supa(`/rest/v1/otp_codes?id=eq.${otp.id}`, { method: "PATCH", body: JSON.stringify({ verified_at: new Date().toISOString() }) });

    // Créer le compte Supabase vérifié (ou retrouver l'existant)
    const newPass = crypto.randomUUID() + crypto.randomUUID();
    let userId, isNew = true;
    const create = await supa("/auth/v1/admin/users", { method: "POST", body: JSON.stringify({ phone, password: newPass, phone_confirm: true }) });
    if (create.ok) {
      userId = (await create.json()).id;
      await supa("/rest/v1/profiles", { method: "POST", body: JSON.stringify({ id: userId, phone }) });
    } else {
      isNew = false;
      const prof = await (await supa(`/rest/v1/profiles?phone=eq.${p}&select=id`)).json();
      if (!prof[0]) return res.status(500).json({ error: "Compte introuvable" });
      userId = prof[0].id;
      const upd = await supa(`/auth/v1/admin/users/${userId}`, { method: "PUT", body: JSON.stringify({ password: newPass }) });
      if (!upd.ok) return res.status(500).json({ error: "Erreur de compte" });
    }

    // Ouvrir la session
    const tok = await fetch(SUPA + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { apikey: SR, "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password: newPass }),
    });
    if (!tok.ok) return res.status(500).json({ error: "Erreur de session" });
    const session = await tok.json();
    return res.json({ ok: true, isNew, session });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
