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
    if (!phone) return res.status(400).json({ error: "Numéro invalide (format : 01 XX XX XX XX)" });

    const now = Date.now();
    const p = encodeURIComponent(phone);

    // Cooldown 60 s
    const last = await (await supa(`/rest/v1/otp_codes?phone=eq.${p}&order=created_at.desc&limit=1&select=created_at`)).json();
    if (last[0] && now - new Date(last[0].created_at).getTime() < 60000)
      return res.status(429).json({ error: "Patientez 60 secondes avant un nouveau code" });

    // Max 3 envois / heure
    const recent = await (await supa(`/rest/v1/otp_codes?phone=eq.${p}&created_at=gte.${new Date(now - 3600000).toISOString()}&select=id&limit=3`)).json();
    if (recent.length >= 3) return res.status(429).json({ error: "Maximum 3 codes par heure" });

    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    const ins = await supa("/rest/v1/otp_codes", {
      method: "POST",
      body: JSON.stringify({ phone, code_hash: hash(code), expires_at: new Date(now + 300000).toISOString() }),
    });
    if (!ins.ok) {
      const detail = await ins.text();
      console.error("INSERT ERROR:", detail);
      return res.status(500).json({ error: "Erreur d'enregistrement du code", detail });
    }

    // Envoi SMS réel via Telerivet
    if (process.env.TELERIVET_API_KEY && process.env.TELERIVET_PROJECT_ID) {
      const tv = await fetch(`https://api.telerivet.com/v1/projects/${process.env.TELERIVET_PROJECT_ID}/messages/send`, {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(process.env.TELERIVET_API_KEY + ":").toString("base64"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to_number: phone, content: `Switch Bénin : votre code est ${code}. Valable 5 min. Ne le partagez jamais.` }),
      });
      const tvText = await tv.text();
      console.error("TELERIVET REPONSE:", tv.status, tvText);
      return res.json({ ok: true, telerivet: tv.status, detail: tvText });
    }

    // MODE TEST temporaire (sans Telerivet)
    return res.json({ ok: true, devCode: code });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
