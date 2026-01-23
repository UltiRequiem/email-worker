import { createMimeMessage } from "mimetext";
import type { EmailConfig, FormData } from "./email-types";

export const EMAIL_CONFIG: EmailConfig = {
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
export function buildEmailMessage(formData: FormData) {
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
