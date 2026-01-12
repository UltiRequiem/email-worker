import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

interface EmailSender {
  name: string;
  address: string;
}

interface EmailConfig {
  sender: EmailSender;
  allowedOrigin: string;
  recipients: string[];
  subject: (name: string) => string;
  footer: string;
}

interface FormData {
  name: string;
  email: string;
  company?: string | undefined;
  message: string;
}

interface Env {
  CONTACT_EMAIL: {
    send: (message: EmailMessage) => Promise<void>;
  };
}

const EMAIL_CONFIG: EmailConfig = {
  sender: {
    name: "Contact Form",
    address: "contact@bobadilla.work",
  },
  allowedOrigin: "https://bobadilla.work",
  recipients: [
    "eliaz@bobadilla.work",
    // "ale@bobadilla.work"
  ],
  subject: (name: string) => `New Contact Form Submission from ${name}`,
  footer: "This email was sent from the contact form at bobadilla.work",
};

/**
 * Builds a formatted email message from form data
 */
function buildEmailMessage(formData: FormData) {
  const { name, email, company, message } = formData;

  const msg = createMimeMessage();
  msg.setSender({
    name: EMAIL_CONFIG.sender.name,
    addr: EMAIL_CONFIG.sender.address,
  });

  // Add all recipients
  EMAIL_CONFIG.recipients.forEach((recipient: string) => {
    msg.setRecipient(recipient);
  });

  msg.setSubject(EMAIL_CONFIG.subject(name));

  const emailBody = `
New contact form submission:

Name: ${name}
Email: ${email}
${company ? `Company: ${company}` : ""}

Message:
${message}

---
${EMAIL_CONFIG.footer}
  `.trim();

  msg.addMessage({
    contentType: "text/plain",
    data: emailBody,
  });

  return msg;
}

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
