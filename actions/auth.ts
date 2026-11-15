"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth-redirect";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { createClient } from "@/utils/supabase/server";

export type AuthState = {
  error: string | null;
  message: string | null;
};

const initialMessage = "Die Anmeldung ist noch nicht mit Supabase verbunden.";

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "E-Mail oder Passwort ist falsch.";
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already been registered")
  ) {
    return "Zu dieser E-Mail gibt es schon ein Konto.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Bitte bestätige zuerst die E-Mail.";
  }

  if (
    normalized.includes("provider is not enabled") ||
    normalized.includes("unsupported provider")
  ) {
    return "Die Google-Anmeldung ist im Supabase-Projekt noch nicht aktiviert.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Bitte warte einen Moment und versuche es erneut.";
  }

  if (normalized.includes("redirect")) {
    return "Der Rücksprung nach dem Zurücksetzen ist noch nicht freigeschaltet.";
  }

  if (normalized.includes("password")) {
    return "Das Passwort erfüllt die Vorgaben nicht. Mindestens 8 Zeichen.";
  }

  return "Das hat gerade nicht geklappt. Bitte versuche es erneut.";
}

async function requestOrigin(): Promise<string> {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "https";

  return host ? `${proto}://${host}` : "";
}

export async function signInWithPassword(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: initialMessage, message: null };
  }

  const email = readField(formData, "email");
  const password = readField(formData, "password");
  const nextPath = safeNextPath(readField(formData, "next"));

  if (!email.includes("@") || password.length < 8) {
    return {
      error: "Bitte eine gültige E-Mail und mindestens 8 Zeichen als Passwort eingeben.",
      message: null,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: mapAuthError(error.message), message: null };
  }

  redirect(nextPath);
}

export async function signUp(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: initialMessage, message: null };
  }

  const name = readField(formData, "name");
  const email = readField(formData, "email");
  const password = readField(formData, "password");
  const nextPath = safeNextPath(readField(formData, "next"));

  if (name.length < 2 || !email.includes("@") || password.length < 8) {
    return {
      error: "Name, gültige E-Mail und ein Passwort mit mindestens 8 Zeichen sind nötig.",
      message: null,
    };
  }

  const origin = await requestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      data: { name, role: readField(formData, "role") === "haendler" ? "haendler" : "privat" },
    },
  });

  if (error) {
    return { error: mapAuthError(error.message), message: null };
  }

  if (!data.session) {
    return {
      error: null,
      message: "Wir haben dir eine E-Mail zum Bestätigen geschickt. Danach kannst du dich anmelden.",
    };
  }

  redirect(nextPath);
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const nextPath = safeNextPath(readField(formData, "next"));

  if (!isSupabaseConfigured()) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}&error=config`);
  }

  const origin = await requestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}&error=google`);
  }

  redirect(data.url);
}

export async function requestPasswordReset(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: initialMessage, message: null };
  }

  const email = readField(formData, "email");
  if (!email.includes("@")) {
    return { error: "Bitte eine gültige E-Mail eingeben.", message: null };
  }

  const origin = await requestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/passwort-neu")}`,
  });

  if (error) {
    return { error: mapAuthError(error.message), message: null };
  }

  return {
    error: null,
    message: "Wenn ein Konto zu dieser E-Mail existiert, ist der Link zum neuen Passwort unterwegs.",
  };
}

export async function updatePassword(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: initialMessage, message: null };
  }

  const password = readField(formData, "password");
  const confirmation = readField(formData, "confirmation");
  if (password.length < 8) {
    return { error: "Das Passwort braucht mindestens 8 Zeichen.", message: null };
  }
  if (password !== confirmation) {
    return { error: "Die beiden Passwörter stimmen nicht überein.", message: null };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return {
      error: "Der Link ist abgelaufen. Fordere einen neuen an.",
      message: null,
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: mapAuthError(error.message), message: null };
  }

  redirect("/dashboard?hinweis=passwort");
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}
