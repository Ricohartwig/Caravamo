"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { accountBlocked } from "@/lib/account";
import { isVehicleId } from "@/lib/owned-listings";
import { isBusinessRole, isStripeConfigured, getStripe, paymentCatalog } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { isServiceRoleConfigured } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function payForListing(formData: FormData): Promise<void> {
  await beginCheckout(String(formData.get("id") ?? ""));
}

export async function beginCheckout(vehicleId: string): Promise<void> {
  if (!isVehicleId(vehicleId) || !isSupabaseConfigured()) {
    redirect("/dashboard?zahlung=unbekannt");
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard`)}`);
  }

  if (await accountBlocked(user.id)) {
    redirect("/gesperrt");
  }

  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !vehicle) {
    redirect("/dashboard?zahlung=unbekannt");
  }

  if (!isStripeConfigured() || !isServiceRoleConfigured()) {
    redirect("/dashboard?zahlung=nicht-eingerichtet");
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const business = isBusinessRole(readRole(profile));
  const prices = paymentCatalog();
  const origin = await requestOrigin();
  if (!origin) {
    redirect("/dashboard?zahlung=fehler");
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "de",
      customer_email: user.email,
      client_reference_id: vehicleId,
      line_items: [
        {
          price: business ? prices.businessPriceId : prices.privatePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        vehicle_id: vehicleId,
        user_id: user.id,
      },
      success_url: `${origin}/dashboard?zahlung=erfolgreich`,
      cancel_url: `${origin}/dashboard?zahlung=abgebrochen`,
    });

    if (!session.url) {
      redirect("/dashboard?zahlung=fehler");
    }

    redirect(session.url);
  } catch (checkoutError) {
    if (isNextRedirect(checkoutError)) {
      throw checkoutError;
    }

    redirect("/dashboard?zahlung=fehler");
  }
}

async function requestOrigin(): Promise<string> {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "";
}

function readRole(profile: unknown): string | null {
  if (typeof profile !== "object" || profile === null || !("role" in profile)) {
    return null;
  }

  return typeof profile.role === "string" ? profile.role : null;
}

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}
