// Supabase Edge Function: send-sms-hook
// Reçoit un POST de Supabase Auth Send SMS Hook
// Vérifie la signature webhook via standardwebhooks (format v1,whsec_...)
// Envoie le SMS OTP via l'API Bird (sender partagé Authifly)
// Retourne une réponse 200 vide `{}` à Supabase

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

interface SupabaseSmsHookPayload {
  user: {
    id: string;
    phone?: string;
    email?: string;
    [key: string]: unknown;
  };
  sms: {
    otp: string;
  };
}

serve(async (req: Request) => {
  // 1. Accepter uniquement les requêtes POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: { message: "Method Not Allowed" } }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const rawBody = await req.text();

    // 2. Vérification de la signature Webhook via standardwebhooks
    const hookSecret =
      Deno.env.get("SEND_SMS_HOOK_SECRET") ||
      Deno.env.get("AUTH_HOOK_SECRET") ||
      Deno.env.get("HOOK_SECRET");

    if (hookSecret) {
      try {
        // Nettoyer le préfixe v1, si présent (ex: v1,whsec_... -> whsec_...)
        const secretForVerification = hookSecret.startsWith("v1,")
          ? hookSecret.slice(3)
          : hookSecret;

        const wh = new Webhook(secretForVerification);
        const headersObject: Record<string, string> = {};
        req.headers.forEach((value, key) => {
          headersObject[key.toLowerCase()] = value;
        });

        wh.verify(rawBody, headersObject);
        console.log("[send-sms-hook] Signature Webhook standardwebhooks validée avec succès");
      } catch (verifyError: unknown) {
        const errorMsg = verifyError instanceof Error ? verifyError.message : String(verifyError);
        console.error("[send-sms-hook] Échec de vérification de signature Webhook :", errorMsg);
        return new Response(
          JSON.stringify({ error: { message: "Signature webhook invalide" } }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
    } else {
      console.warn("[send-sms-hook] Avertissement : Aucun secret SEND_SMS_HOOK_SECRET configuré, vérification ignorée.");
    }

    // 3. Extraction du payload Supabase Auth
    let payload: SupabaseSmsHookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ error: { message: "JSON payload invalide" } }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const phone = payload.user?.phone;
    const otp = payload.sms?.otp;

    if (!phone || !otp) {
      console.error("[send-sms-hook] Numéro de téléphone ou code OTP manquant :", payload);
      return new Response(
        JSON.stringify({ error: { message: "Le numéro de téléphone et le code OTP sont requis" } }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Nettoyage du numéro de téléphone au format E.164 (ex: +22997000000)
    const formattedPhone = phone.replace(/[\s\-\(\)]/g, "");
    const messageText = `Votre code Switch Bénin est : ${otp}`;

    // 4. Récupération des identifiants Bird
    const birdApiKey = Deno.env.get("BIRD_API_KEY");
    const originator = Deno.env.get("BIRD_ORIGINATOR") || "Authifly";
    const workspaceId = Deno.env.get("BIRD_WORKSPACE_ID");
    const channelId = Deno.env.get("BIRD_CHANNEL_ID");

    if (!birdApiKey) {
      console.error("[send-sms-hook] Variable BIRD_API_KEY manquante");
      return new Response(
        JSON.stringify({ error: { message: "Configuration API Bird manquante (BIRD_API_KEY)" } }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-sms-hook] Envoi de l'OTP SMS à ${formattedPhone} (Sender: ${originator})`);

    let birdResponse: Response;

    if (workspaceId && channelId) {
      // API Bird v2 Channels
      const birdUrl = `https://api.bird.com/workspaces/${workspaceId}/channels/${channelId}/messages`;
      birdResponse = await fetch(birdUrl, {
        method: "POST",
        headers: {
          "Authorization": `AccessKey ${birdApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver: {
            contacts: [{ identifierValue: formattedPhone }],
          },
          body: {
            type: "text",
            text: { text: messageText },
          },
        }),
      });
    } else {
      // API Bird REST / MessageBird avec sender partagé Authifly
      const birdUrl = "https://rest.messagebird.com/messages";
      birdResponse = await fetch(birdUrl, {
        method: "POST",
        headers: {
          "Authorization": `AccessKey ${birdApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originator: originator,
          recipients: [formattedPhone],
          body: messageText,
        }),
      });
    }

    const responseText = await birdResponse.text();

    if (!birdResponse.ok) {
      console.error(`[send-sms-hook] Erreur API Bird (${birdResponse.status}):`, responseText);
      return new Response(
        JSON.stringify({
          error: {
            message: `Erreur passerelle Bird (${birdResponse.status}) : ${responseText || birdResponse.statusText}`,
          },
        }),
        { status: birdResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-sms-hook] SMS OTP envoyé avec succès à ${formattedPhone}`);

    // 5. Réponse attendue par Supabase Auth (200 OK avec `{}`)
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[send-sms-hook] Erreur interne non gérée :", errorMsg);
    return new Response(
      JSON.stringify({ error: { message: `Erreur interne : ${errorMsg}` } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
