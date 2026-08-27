// Supabase Edge Function: Send SMS Hook (Bird API v2 - Workspaces & Channels)
// Documentation Supabase Auth Hooks: https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook
// Documentation Bird API: https://docs.bird.com/api-reference

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
  // Accepter uniquement les requêtes POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: { message: "Method Not Allowed" } }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const payload: SupabaseSmsHookPayload = await req.json();
    const phone = payload.user?.phone;
    const otp = payload.sms?.otp;

    if (!phone || !otp) {
      console.error("[send-sms-hook] Paramètres manquants dans le payload Supabase :", payload);
      return new Response(
        JSON.stringify({ error: { message: "Le numéro de téléphone et l'OTP sont requis" } }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Récupération des 3 variables d'environnement obligatoires Bird API
    const birdApiKey = Deno.env.get("BIRD_API_KEY");
    const workspaceId = Deno.env.get("BIRD_WORKSPACE_ID");
    const channelId = Deno.env.get("BIRD_CHANNEL_ID");

    if (!birdApiKey || !workspaceId || !channelId) {
      const missingVars = [];
      if (!birdApiKey) missingVars.push("BIRD_API_KEY");
      if (!workspaceId) missingVars.push("BIRD_WORKSPACE_ID");
      if (!channelId) missingVars.push("BIRD_CHANNEL_ID");

      console.error(`[send-sms-hook] Variables d'environnement manquantes : ${missingVars.join(", ")}`);
      return new Response(
        JSON.stringify({
          error: {
            message: `Configuration de passerelle SMS incomplète. Variables manquantes : ${missingVars.join(", ")}`,
          },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Nettoyage du numéro de téléphone (format international sans espaces, ex: +22997000000)
    const formattedPhone = phone.replace(/[\s\-\(\)]/g, "");
    const messageText = `Votre code Switch Bénin est : ${otp}`;

    const birdApiUrl = `https://api.bird.com/workspaces/${workspaceId}/channels/${channelId}/messages`;

    console.log(`[send-sms-hook] Envoi du SMS Bird vers ${formattedPhone} via le canal ${channelId}`);

    const birdResponse = await fetch(birdApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `AccessKey ${birdApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiver: {
          contacts: [
            {
              identifierValue: formattedPhone,
            },
          ],
        },
        body: {
          type: "text",
          text: {
            text: messageText,
          },
        },
      }),
    });

    const responseText = await birdResponse.text();

    if (!birdResponse.ok) {
      console.error(
        `[send-sms-hook] Erreur API Bird (HTTP ${birdResponse.status}) :`,
        responseText
      );
      return new Response(
        JSON.stringify({
          error: {
            message: `Erreur API Bird (${birdResponse.status}) : ${responseText || birdResponse.statusText}`,
          },
        }),
        { status: birdResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-sms-hook] SMS envoyé avec succès à ${formattedPhone}`);

    // Supabase Auth Hook attend un objet JSON vide `{}` avec un code HTTP 200 en cas de succès
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[send-sms-hook] Erreur interne :", errorMsg);
    return new Response(
      JSON.stringify({ error: { message: `Erreur interne Hook SMS : ${errorMsg}` } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
