import { Resend } from "resend";

const placeholderKey = "re_your-key";

let client: Resend | undefined;

export function isResendConfigured(): boolean {
  const key = process.env.RESEND_API_KEY?.trim();
  return Boolean(key && key !== placeholderKey && process.env.MAIL_FROM?.trim());
}

export function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || key === placeholderKey) {
    return null;
  }

  client ??= new Resend(key);
  return client;
}

export function resendFrom(): string | null {
  const from = process.env.MAIL_FROM?.trim();
  return from || null;
}
