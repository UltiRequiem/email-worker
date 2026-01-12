declare module "mimetext" {
  export function createMimeMessage(): {
    setSender(sender: { name: string; addr: string }): void;
    setRecipient(recipient: string): void;
    setSubject(subject: string): void;
    addMessage(message: { contentType: string; data: string }): void;
    asRaw(): string;
  };
}
