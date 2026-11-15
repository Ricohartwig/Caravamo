import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth-redirect";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = safeNextPath(url.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, url.origin));
    }
  }

  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set("next", nextPath);
  loginUrl.searchParams.set("error", "auth");
  return NextResponse.redirect(loginUrl);
}
