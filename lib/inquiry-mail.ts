import { headers } from "next/headers";
import { escapeHtml, isMailConfigured, sendMail } from "@/lib/mail";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";

type InquiryKind = "anfrage" | "antwort";

type InquiryNotice = {
  recipientId: string;
  senderName: string;
  vehicleTitle: string;
  body: string;
  inquiryId: string;
  kind: InquiryKind;
};

export async function mailInquiry(notice: InquiryNotice): Promise<void> {
  if (!isMailConfigured() || !isServiceRoleConfigured()) {
    return;
  }

  try {
    const admin = createAdminClient();
    const recipient = await admin.auth.admin.getUserById(notice.recipientId);
    const email = recipient.data.user?.email;
    if (!email) {
      return;
    }

    const origin = await siteOrigin();
    const message = renderInquiryMail({ ...notice, email, origin });
    await sendMail({ to: email, ...message });
  } catch {
    // Die Nachricht bleibt im Konto, auch wenn der Versand fehlschlägt.
  }
}

export function renderInquiryMail(input: InquiryNotice & { email: string; origin: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const title = singleLine(input.vehicleTitle) || "ein Inserat";
  const sender = singleLine(input.senderName) || "Jemand";
  const link = `${input.origin}/dashboard/anfragen/${input.inquiryId}`;
  const lead =
    input.kind === "anfrage"
      ? `${sender} hat dir zu ${title} geschrieben.`
      : `${sender} hat auf die Anfrage zu ${title} geantwortet.`;
  const subject = input.kind === "anfrage" ? `Neue Anfrage zu ${title}` : `Neue Antwort zu ${title}`;
  const body = input.body.trim();

  return {
    subject,
    text: `${lead}\n\n${body}\n\nAnfrage öffnen: ${link}\n`,
    html: layout({
      kicker: input.kind === "anfrage" ? "Neue Anfrage" : "Neue Antwort",
      heading: lead,
      body,
      link,
      action: "Im Konto öffnen",
    }),
  };
}

function layout(input: { kicker: string; heading: string; body: string; link: string; action: string }): string {
  const body = escapeHtml(input.body).replaceAll("\n", "<br />");
  const link = escapeHtml(input.link);

  return `<!DOCTYPE html>
<html lang="de">
  <body style="margin:0;padding:0;background:#f3eee4;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.heading)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3eee4;margin:0;padding:0;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td style="padding:0 8px 20px;font-family:Georgia, 'Times New Roman', serif;font-size:20px;line-height:24px;color:#14211c;font-weight:700;">
                Caravamo
              </td>
            </tr>
            <tr>
              <td style="background:#fffdf8;border:1px solid #e4d8c4;border-radius:20px;padding:36px 32px;">
                <p style="margin:0;font-family:Georgia, 'Times New Roman', serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#9a431c;">${escapeHtml(input.kicker)}</p>
                <h1 style="margin:12px 0 0;font-family:Georgia, 'Times New Roman', serif;font-size:28px;line-height:36px;font-weight:700;color:#14211c;">${escapeHtml(input.heading)}</h1>
                <p style="margin:18px 0 0;font-family:Arial, Helvetica, sans-serif;font-size:16px;line-height:26px;color:#1c1915;">${body}</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
                  <tr>
                    <td align="center" bgcolor="#9a431c" style="background:#9a431c;border-radius:12px;">
                      <a href="${link}" style="display:inline-block;padding:14px 22px;font-family:Arial, Helvetica, sans-serif;font-size:16px;line-height:20px;font-weight:700;color:#fbf7ef;text-decoration:none;">${escapeHtml(input.action)}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 8px 0;font-family:Arial, Helvetica, sans-serif;font-size:13px;line-height:20px;color:#5c564c;">
                Diese Nachricht gehört zu deinem Caravamo-Konto. Antworte dort, nicht auf diese E-Mail.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

async function siteOrigin(): Promise<string> {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "https://caravamo.vercel.app";
}
