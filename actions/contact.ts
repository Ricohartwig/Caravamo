"use server";

import { redirect } from "next/navigation";
import { escapeHtml } from "@/lib/mail";
import { getPublishedListing } from "@/lib/published-listings";
import { absoluteUrl } from "@/lib/site";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { isResendConfigured, resendClient, resendFrom } from "@/utils/resend";

const vehicleIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(vehicleId: string, code: string): never {
  if (vehicleIdPattern.test(vehicleId)) {
    redirect(`/fahrzeug/${vehicleId}?kontakt=${code}`);
  }
  redirect("/suche?kontakt=inserat");
}

export async function sendContactRequest(formData: FormData): Promise<void> {
  const vehicleId = String(formData.get("vehicle_id") ?? "").trim();

  if (String(formData.get("website") ?? "").trim() !== "") {
    fail(vehicleId, "gesendet");
  }

  const name = singleLine(String(formData.get("name") ?? ""));
  const email = singleLine(String(formData.get("email") ?? ""));
  const phone = singleLine(String(formData.get("phone") ?? ""));
  const message = String(formData.get("message") ?? "").replace(/\r\n/g, "\n").trim();

  if (name.length < 2 || name.length > 80) {
    fail(vehicleId, "name");
  }
  if (!isEmail(email)) {
    fail(vehicleId, "email");
  }
  if (!isPhone(phone)) {
    fail(vehicleId, "phone");
  }
  if (message.length < 10 || message.length > 2000) {
    fail(vehicleId, "message");
  }
  if (!isResendConfigured() || !isServiceRoleConfigured()) {
    fail(vehicleId, "einrichtung");
  }

  const listing = await getPublishedListing(vehicleId);
  if (!listing?.sellerId) {
    fail(vehicleId, "inserat");
  }

  const sellerEmail = await sellerAddress(listing.sellerId);
  if (!sellerEmail) {
    fail(vehicleId, "inserat");
  }

  const from = resendFrom();
  const resend = resendClient();
  if (!from || !resend) {
    fail(vehicleId, "einrichtung");
  }

  const mail = renderContactMail({
    name,
    email,
    phone,
    message,
    title: listing.title,
    url: absoluteUrl(`/fahrzeug/${listing.id}`),
  });
  const { error } = await resend.emails.send({
    from,
    to: [sellerEmail],
    replyTo: email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  if (error) {
    fail(vehicleId, "versand");
  }

  redirect(`/fahrzeug/${vehicleId}?kontakt=gesendet`);
}

async function sellerAddress(userId: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const seller = await admin.auth.admin.getUserById(userId);
    const email = seller.data.user?.email?.trim() ?? "";
    return isEmail(email) ? email : null;
  } catch {
    return null;
  }
}

function renderContactMail(input: {
  name: string;
  email: string;
  phone: string;
  message: string;
  title: string;
  url: string;
}): { subject: string; html: string; text: string } {
  const title = singleLine(input.title) || "ein Inserat";
  const subject = `Anfrage zu ${title}`;
  const text = [
    `${input.name} interessiert sich für ${title}.`,
    "",
    input.message,
    "",
    `E-Mail: ${input.email}`,
    `Telefon: ${input.phone}`,
    `Inserat: ${input.url}`,
    "",
    "Du kannst direkt auf diese E-Mail antworten.",
  ].join("\n");

  const body = escapeHtml(input.message).replaceAll("\n", "<br />");
  const html = `<!DOCTYPE html>
<html lang="de">
  <body style="margin:0;padding:0;background:#f3eee4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3eee4;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td style="padding:0 8px 20px;font-family:Georgia, 'Times New Roman', serif;font-size:20px;color:#14211c;font-weight:700;">Caravamo</td>
            </tr>
            <tr>
              <td style="background:#fffdf8;border:1px solid #e4d8c4;border-radius:20px;padding:36px 32px;">
                <p style="margin:0;font-family:Georgia, 'Times New Roman', serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#9a431c;">Neue Anfrage</p>
                <h1 style="margin:12px 0 0;font-family:Georgia, 'Times New Roman', serif;font-size:28px;line-height:36px;color:#14211c;">${escapeHtml(input.name)} interessiert sich für ${escapeHtml(title)}.</h1>
                <p style="margin:18px 0 0;font-family:Arial, Helvetica, sans-serif;font-size:16px;line-height:26px;color:#1c1915;">${body}</p>
                <p style="margin:18px 0 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:24px;color:#1c1915;">E-Mail: ${escapeHtml(input.email)}<br />Telefon: ${escapeHtml(input.phone)}</p>
                <p style="margin:18px 0 0;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:24px;"><a href="${escapeHtml(input.url)}" style="color:#1e3f36;">Inserat öffnen</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 8px 0;font-family:Arial, Helvetica, sans-serif;font-size:13px;line-height:20px;color:#5c564c;">Du kannst direkt auf diese E-Mail antworten. Die Antwort geht an den Interessenten.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}

function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value: string): boolean {
  return value.length <= 40 && /^[0-9+()/\-\s.]{6,40}$/.test(value);
}
