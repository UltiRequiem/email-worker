import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

export default {
  async fetch(request, env) {
    // Only accept POST requests
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      // Parse the incoming request data
      const data = await request.json();
      const { name, email, company, message } = data;

      // Validate required fields
      if (!name || !email || !message) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields: name, email, or message",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Create the email message
      const msg = createMimeMessage();
      msg.setSender({ name: "Contact Form", addr: "contact@bobadilla.work" });

      // Add both recipients
      msg.setRecipient("eliaz@bobadilla.work");
      msg.setRecipient("ale@bobadilla.work");

      msg.setSubject(`New Contact Form Submission from ${name}`);

      // Create email body with all form data
      const emailBody = `
New contact form submission:

Name: ${name}
Email: ${email}
${company ? `Company: ${company}` : ""}

Message:
${message}

---
This email was sent from the contact form at bobadilla.work
      `.trim();

      msg.addMessage({
        contentType: "text/plain",
        data: emailBody,
      });

      // Create and send the email message
      const emailMessage = new EmailMessage(
        "contact@bobadilla.work",
        "eliaz@bobadilla.work",
        msg.asRaw(),
      );

      await env.CONTACT_EMAIL.send(emailMessage);

      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully" }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Adjust for your domain
          },
        },
      );
    } catch (e) {
      console.error("Error sending email:", e);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: e.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
