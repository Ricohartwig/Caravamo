import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, isSupabaseConfigured } from "@/utils/supabase/env";

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  request.headers.set("x-caravamo-path", pathname);
  const needsAccount =
    pathname === "/inserieren" ||
    pathname.startsWith("/inserieren/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  if (!isSupabaseConfigured()) {
    if (!needsAccount) {
      return NextResponse.next({ request });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let supabaseResponse = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        supabaseResponse = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }

        for (const [key, value] of Object.entries(headers)) {
          supabaseResponse.headers.set(key, value);
        }
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (user && needsAccount) {
    const { data: profile } = await supabase.from("users").select("blocked_at").eq("id", user.id).maybeSingle();
    if (typeof profile?.blocked_at === "string" && profile.blocked_at.length > 0) {
      const blockedUrl = request.nextUrl.clone();
      blockedUrl.pathname = "/gesperrt";
      blockedUrl.search = "";
      const blockedResponse = NextResponse.redirect(blockedUrl);
      for (const cookie of supabaseResponse.cookies.getAll()) {
        blockedResponse.cookies.set(cookie);
      }
      return blockedResponse;
    }
  }

  if (!needsAccount || user) {
    return supabaseResponse;
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  const redirectResponse = NextResponse.redirect(loginUrl);

  for (const cookie of supabaseResponse.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }

  return redirectResponse;
}
