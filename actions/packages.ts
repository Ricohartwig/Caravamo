"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { packageBySlots } from "@/lib/dealer-packages";
import { packageAllowance, subscriptionUsable } from "@/lib/dealer-subscription";
import { isVehicleId } from "@/lib/owned-listings";
import { isBusinessRole, isStripeConfigured, getStripe } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function startPackageCheckout(formData: FormData): Promise<void> {
  const slots = Number(formData.get("slots"));
  const pack = packageBySlots(slots);
  if (!pack) {
    redirect("/dashboard/pakete?abo=unbekannt");
  }

  const user = await requireDealer();
  if (!isStripeConfigured() || !isServiceRoleConfigured()) {
    redirect("/dashboard/pakete?abo=nicht-eingerichtet");
  }

  const allowance = await packageAllowance(user.id);
  const current = allowance.subscription;
  if (current?.stripeCustomerId && current.stripeSubscriptionId && ["active", "trialing", "past_due"].includes(current.status)) {
    await openPortal(current.stripeCustomerId);
  }

  const origin = await requestOrigin();
  if (!origin) {
    redirect("/dashboard/pakete?abo=fehler");
  }

  try {
    const stripe = getStripe();
    const customerId = await ensureCustomer(user.id, user.email);
    const prices = await stripe.prices.list({ lookup_keys: [pack.lookupKey], active: true, limit: 1 });
    const priceId = prices.data[0]?.id;
    if (!priceId) {
      redirect("/dashboard/pakete?abo=nicht-eingerichtet");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      locale: "de",
      customer: customerId,
      client_reference_id: user.id,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      customer_update: { address: "auto", name: "auto" },
      automatic_tax: { enabled: true },
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { user_id: user.id, kind: "paket", slots: String(pack.slots) },
      subscription_data: { metadata: { user_id: user.id, slots: String(pack.slots) } },
      success_url: `${origin}/dashboard/pakete?abo=gebucht`,
      cancel_url: `${origin}/dashboard/pakete?abo=abgebrochen`,
    });

    if (!session.url) {
      redirect("/dashboard/pakete?abo=fehler");
    }

    redirect(session.url);
  } catch (checkoutError) {
    if (isNextRedirect(checkoutError)) {
      throw checkoutError;
    }

    redirect("/dashboard/pakete?abo=fehler");
  }
}

export async function openBillingPortal(): Promise<void> {
  const user = await requireDealer();
  if (!isStripeConfigured()) {
    redirect("/dashboard/pakete?abo=nicht-eingerichtet");
  }

  const allowance = await packageAllowance(user.id);
  const customerId = allowance.subscription?.stripeCustomerId;
  if (!customerId) {
    redirect("/dashboard/pakete?abo=kein-abo");
  }

  await openPortal(customerId);
}

export async function publishWithPackage(formData: FormData): Promise<void> {
  const vehicleId = String(formData.get("id") ?? "");
  if (!isVehicleId(vehicleId) || !isSupabaseConfigured() || !isServiceRoleConfigured()) {
    redirect("/dashboard/inserate?hinweis=nicht-moeglich");
  }

  const user = await requireDealer("/dashboard/inserate");
  const allowance = await packageAllowance(user.id);
  if (!subscriptionUsable(allowance.subscription) || !allowance.subscription?.currentPeriodEnd) {
    redirect("/dashboard/pakete?abo=kein-abo");
  }

  if (allowance.free < 1) {
    redirect("/dashboard/inserate?hinweis=paket-voll");
  }

  const supabase = await createClient();
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, status, published_until")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!vehicle) {
    redirect("/dashboard/inserate?hinweis=unbekannt");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("vehicles")
    .update({
      status: "aktiv",
      billing_source: "paket",
      published_until: allowance.subscription.currentPeriodEnd,
    })
    .eq("id", vehicleId)
    .eq("user_id", user.id);

  if (error) {
    redirect("/dashboard/inserate?hinweis=nicht-moeglich");
  }

  revalidatePath("/dashboard/inserate");
  revalidatePath(`/fahrzeug/${vehicleId}`);
  redirect("/dashboard/inserate?hinweis=paket");
}

async function openPortal(customerId: string): Promise<void> {
  const origin = await requestOrigin();
  if (!origin || !isStripeConfigured()) {
    redirect("/dashboard/pakete?abo=fehler");
  }

  try {
    const stripe = getStripe();
    const configuration = await portalConfigurationId();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard/pakete`,
      ...(configuration ? { configuration } : {}),
    });
    redirect(session.url);
  } catch (portalError) {
    if (isNextRedirect(portalError)) {
      throw portalError;
    }

    redirect("/dashboard/pakete?abo=fehler");
  }
}

async function ensureCustomer(userId: string, email: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("stripe_customer_id").eq("id", userId).maybeSingle();
  if (typeof data?.stripe_customer_id === "string" && data.stripe_customer_id) {
    return data.stripe_customer_id;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });
  await admin.from("users").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}

let cachedPortalConfiguration: string | undefined;

async function portalConfigurationId(): Promise<string | undefined> {
  if (cachedPortalConfiguration) {
    return cachedPortalConfiguration;
  }

  const stripe = getStripe();
  const configs = await stripe.billingPortal.configurations.list({ active: true, limit: 10 });
  const match = configs.data.find((config) => config.metadata?.caravamo === "paket");
  cachedPortalConfiguration = match?.id;
  return cachedPortalConfiguration;
}

async function requireDealer(next = "/dashboard/pakete"): Promise<{ id: string; email: string }> {
  if (!isSupabaseConfigured()) {
    redirect(`${next}?abo=fehler`);
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const { data: profile } = await supabase.from("users").select("role, blocked_at").eq("id", user.id).maybeSingle();
  if (typeof profile?.blocked_at === "string" && profile.blocked_at.length > 0) {
    redirect("/gesperrt");
  }
  if (!isBusinessRole(typeof profile?.role === "string" ? profile.role : null)) {
    redirect("/dashboard/pakete?abo=nur-haendler");
  }

  return { id: user.id, email: user.email };
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

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}
