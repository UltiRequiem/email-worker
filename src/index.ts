import { EmailMessage } from "cloudflare:email";
import type { Env, FormData } from "../lib/email-types";
import { EMAIL_CONFIG, buildEmailMessage } from "../lib/email-config";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestId = crypto.randomUUID();

    console.log(
      `[${requestId}] Received ${request.method} request from ${
        request.headers.get("cf-connecting-ip") || "unknown"
      }`
    );

    // Only accept POST requests, redirect others to the main domain
    if (request.method !== "POST") {
      console.log(
        `[${requestId}] Redirecting ${request.method} request to ${EMAIL_CONFIG.allowedOrigin}`
      );
      return Response.redirect(EMAIL_CONFIG.allowedOrigin, 302);
    }

    try {
      const data = (await request.json()) as Partial<FormData>;
      const { name, email, company, message } = data;

      console.log(
        `[${requestId}] Processing submission from: ${name} <${email}>${
          company ? ` (${company})` : ""
        }`
      );

      // Validate required fields
      if (!name || !email || !message) {
        console.warn(
          `[${requestId}] Validation failed: Missing required fields`
        );
        return new Response(
          JSON.stringify({
            error: "Missing required fields: name, email, or message",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Build the email message
      const msg = buildEmailMessage({
        name,
        email,
        company,
        message,
      });

      // Create and send the email message
      const emailMessage = new EmailMessage(
        EMAIL_CONFIG.sender.address,
        EMAIL_CONFIG.recipients[0]!,
        msg.asRaw()
      );

      await env.CONTACT_EMAIL.send(emailMessage);

      console.log(
        `[${requestId}] Success: Email sent to ${EMAIL_CONFIG.recipients.join(
          ", "
        )}`
      );

      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully" }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": EMAIL_CONFIG.allowedOrigin,
          },
        }
      );
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : "Unknown error";
      console.error(`[${requestId}] Error sending email:`, e);

      return new Response(
        JSON.stringify({ error: "Failed to send email", details: error }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
