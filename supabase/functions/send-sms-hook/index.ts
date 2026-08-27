// Supabase Edge Function: Send SMS Hook (Bird / MessageBird API)
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
  // Only accept POST requests
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
      console.error("[send-sms-hook] Missing phone or OTP in payload:", payload);
      return new Response(
        JSON.stringify({ error: { message: "Phone number and OTP are required" } }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Retrieve environment variables
    const birdApiKey = Deno.env.get("BIRD_API_KEY");
    const originator = Deno.env.get("BIRD_ORIGINATOR") || "Switch";
    const workspaceId = Deno.env.get("BIRD_WORKSPACE_ID");
    const channelId = Deno.env.get("BIRD_CHANNEL_ID");

    if (!birdApiKey) {
      console.error("[send-sms-hook] Missing BIRD_API_KEY environment variable");
      return new Response(
        JSON.stringify({ error: { message: "SMS Gateway configuration error" } }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Clean phone number format (ensure international format without spaces or dashes)
    const formattedPhone = phone.replace(/[\s\-\(\)]/g, "");
    const messageText = `Votre code de sécurité Switch Bénin est : ${otp}. Ne le partagez avec personne.`;

    let birdResponse: Response;

    if (workspaceId && channelId) {
      // Modern Bird Workspace Channel API
      console.log(`[send-sms-hook] Sending SMS via Bird Workspace API to ${formattedPhone}`);
      birdResponse = await fetch(
        `https://api.bird.com/workspaces/${workspaceId}/channels/${channelId}/messages`,
        {
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
        }
      );
    } else {
      // Standard Bird / MessageBird REST SMS API
      console.log(`[send-sms-hook] Sending SMS via Bird REST API to ${formattedPhone}`);
      birdResponse = await fetch("https://rest.messagebird.com/messages", {
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

    const responseBody = await birdResponse.text();

    if (!birdResponse.ok) {
      console.error(
        `[send-sms-hook] Bird API error (${birdResponse.status}):`,
        responseBody
      );
      return new Response(
        JSON.stringify({
          error: {
            message: `Bird SMS API error: ${responseBody || birdResponse.statusText}`,
          },
        }),
        { status: birdResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-sms-hook] SMS sent successfully to ${formattedPhone}`);

    // Supabase Auth expects an empty JSON object `{}` with HTTP 200 on success
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[send-sms-hook] Internal Error:", errorMsg);
    return new Response(
      JSON.stringify({ error: { message: `Internal Error: ${errorMsg}` } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
