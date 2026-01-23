import { EmailMessage } from "cloudflare:email";

export interface EmailSender {
  name: string;
  address: string;
}

export interface EmailConfig {
  sender: EmailSender;
  allowedOrigin: string;
  recipients: string[];
  subject: (name: string) => string;
  footer: string;
}

export interface FormData {
  name: string;
  email: string;
  company?: string | undefined;
  message: string;
}

export interface Env {
  CONTACT_EMAIL: {
    send: (message: EmailMessage) => Promise<void>;
  };
}
