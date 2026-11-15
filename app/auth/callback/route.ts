import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeNextPath } from "@/lib/auth-redirect";
import { createClient } from "@/utils/supabase/server";

const otpTypes = new Set<EmailOtpType>(["signup", "invite", "magiclink", "recovery", "email_change", "email"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = readOtpType(url.searchParams.get("type"));
  const nextPath = safeNextPath(url.searchParams.get("next"));
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(nextPath, url.origin));
    }
  }

  if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({ type: otpType, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(nextPath, url.origin));
    }
  }

  const failed = nextPath === "/passwort-neu" ? "/passwort-vergessen" : "/login";
  const loginUrl = new URL(failed, url.origin);
  loginUrl.searchParams.set("error", nextPath === "/passwort-neu" ? "link" : "auth");
  if (failed === "/login") {
    loginUrl.searchParams.set("next", nextPath);
  }
  return NextResponse.redirect(loginUrl);
}

function readOtpType(value: string | null): EmailOtpType | null {
  if (value && otpTypes.has(value as EmailOtpType)) {
    return value as EmailOtpType;
  }

  return null;
}
