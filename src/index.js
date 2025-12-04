import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

const EMAIL_CONFIG = {
	sender: {
		name: "Contact Form",
		address: "contact@bobadilla.work",
	},
	allowedOrigin: "https://bobadilla.work",
	recipients: [
		"eliaz@bobadilla.work",
		//	"ale@bobadilla.work"
	],
	subject: (name) => `New Contact Form Submission from ${name}`,
	footer: "This email was sent from the contact form at bobadilla.work",
};

/**
 * Builds a formatted email message from form data
 * @param {Object} formData - The form submission data
 * @param {string} formData.name - Sender's name
 * @param {string} formData.email - Sender's email
 * @param {string} formData.company - Sender's company (optional)
 * @param {string} formData.message - The message content
 * @returns {Object} MIME message object
 */
function buildEmailMessage(formData) {
	const { name, email, company, message } = formData;

	const msg = createMimeMessage();
	msg.setSender({
		name: EMAIL_CONFIG.sender.name,
		addr: EMAIL_CONFIG.sender.address,
	});

	// Add all recipients
	EMAIL_CONFIG.recipients.forEach((recipient) => {
		msg.setRecipient(recipient);
	});

	msg.setSubject(EMAIL_CONFIG.subject(name));

	// Create email body with all form data
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
	async fetch(request, env) {
		const requestId = crypto.randomUUID();

		console.log(
			`[${requestId}] Received ${request.method} request from ${
				request.headers.get("cf-connecting-ip") || "unknown"
			}`,
		);

		// Only accept POST requests, redirect others to the main domain
		if (request.method !== "POST") {
			console.log(
				`[${requestId}] Redirecting ${request.method} request to ${EMAIL_CONFIG.allowedOrigin}`,
			);
			return Response.redirect(EMAIL_CONFIG.allowedOrigin, 302);
		}

		try {
			// Parse the incoming request data
			const data = await request.json();
			const { name, email, company, message } = data;

			console.log(
				`[${requestId}] Processing submission from: ${name} <${email}>${
					company ? ` (${company})` : ""
				}`,
			);

			// Validate required fields
			if (!name || !email || !message) {
				console.warn(
					`[${requestId}] Validation failed: Missing required fields`,
				);
				return new Response(
					JSON.stringify({
						error: "Missing required fields: name, email, or message",
					}),
					{ status: 400, headers: { "Content-Type": "application/json" } },
				);
			}

			// Build the email message
			const msg = buildEmailMessage({ name, email, company, message });

			// Create and send the email message
			const emailMessage = new EmailMessage(
				EMAIL_CONFIG.sender.address,
				EMAIL_CONFIG.recipients[0],
				msg.asRaw(),
			);

			await env.CONTACT_EMAIL.send(emailMessage);

			console.log(
				`[${requestId}] Success: Email sent to ${EMAIL_CONFIG.recipients.join(
					", ",
				)}`,
			);

			return new Response(
				JSON.stringify({ success: true, message: "Email sent successfully" }),
				{
					status: 200,
					headers: {
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": EMAIL_CONFIG.allowedOrigin,
					},
				},
			);
		} catch (e) {
			console.error(`[${requestId}] Error sending email:`, e);
			return new Response(
				JSON.stringify({ error: "Failed to send email", details: e.message }),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}
	},
};
