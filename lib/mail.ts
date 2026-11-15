const placeholderKey = "re_your-key";

export type OutboundMail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export function isMailConfigured(): boolean {
  const key = process.env.RESEND_API_KEY;
  return Boolean(key && key !== placeholderKey);
}

export async function sendMail(mail: OutboundMail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM?.trim();
  if (!key || !from || !isMailConfigured()) {
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
