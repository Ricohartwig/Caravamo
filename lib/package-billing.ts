import type Stripe from "stripe";
import { packageByLookupKey } from "@/lib/dealer-packages";
import { createAdminClient } from "@/utils/supabase/admin";

const grantingStatuses = new Set(["active", "trialing", "past_due"]);

export async function syncDealerSubscription(subscription: Stripe.Subscription): Promise<void> {
  const admin = createAdminClient();
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const userId = await resolveUserId(customerId, subscription.metadata?.user_id ?? null);
  if (!userId) {
    return;
  }

  const slots = grantingStatuses.has(subscription.status) ? slotsFromSubscription(subscription) : 0;
  const periodEnd = periodEndIso(subscription);
  const { data: previous } = await admin
    .from("dealer_subscriptions")
    .select("slots")
    .eq("user_id", userId)
    .maybeSingle();
  const previousSlots = typeof previous?.slots === "number" ? previous.slots : 0;

  await admin.from("users").update({ stripe_customer_id: customerId }).eq("id", userId);
  const { error } = await admin.from("dealer_subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    price_id: priceIdFromSubscription(subscription),
    slots,
    status: subscription.status,
    current_period_end: periodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error("Das Händler-Paket konnte nicht gespeichert werden.");
  }

  if (periodEnd && (subscription.status === "active" || subscription.status === "trialing")) {
    await admin
      .from("vehicles")
      .update({ published_until: periodEnd })
      .eq("user_id", userId)
      .eq("billing_source", "paket")
      .in("status", ["aktiv", "inaktiv"]);
  }

  if (slots < previousSlots) {
    await releaseExcessSlots(userId, slots);
  }
}

export function slotsFromSubscription(subscription: Stripe.Subscription): number {
  const item = subscription.items.data[0];
  if (!item) {
    return 0;
  }

  const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
  const lookup = item.price.lookup_key;
  const fromCatalog = packageByLookupKey(lookup)?.slots;
  const fromMetadata = Number(item.price.metadata?.slots);
  const base = fromCatalog ?? (Number.isFinite(fromMetadata) && fromMetadata > 0 ? fromMetadata : 0);
  return base * quantity;
}

async function resolveUserId(customerId: string, metadataUserId: string | null): Promise<string | null> {
  const admin = createAdminClient();
  if (metadataUserId) {
    const { data } = await admin.from("users").select("id").eq("id", metadataUserId).maybeSingle();
    if (data?.id) {
      return data.id;
    }
  }

  const { data } = await admin.from("users").select("id").eq("stripe_customer_id", customerId).maybeSingle();
  return typeof data?.id === "string" ? data.id : null;
}

async function releaseExcessSlots(userId: string, slots: number): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("vehicles")
    .select("id")
    .eq("user_id", userId)
    .eq("billing_source", "paket")
    .in("status", ["aktiv", "inaktiv"])
    .order("created_at", { ascending: false });

  const excess = (data ?? []).slice(Math.max(slots, 0)).flatMap((row) => (typeof row.id === "string" ? [row.id] : []));
  if (excess.length === 0) {
    return;
  }

  await admin
    .from("vehicles")
    .update({
      status: "inaktiv",
      billing_source: "einzeln",
      published_until: new Date().toISOString(),
    })
    .in("id", excess)
    .eq("user_id", userId);
}

function priceIdFromSubscription(subscription: Stripe.Subscription): string | null {
  const price = subscription.items.data[0]?.price;
  return price?.id ?? null;
}

function periodEndIso(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0] as { current_period_end?: number } | undefined;
  const legacy = subscription as Stripe.Subscription & { current_period_end?: number };
  const seconds = item?.current_period_end ?? legacy.current_period_end;
  if (typeof seconds !== "number") {
    return null;
  }

  return new Date(seconds * 1000).toISOString();
}

export function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent?.subscription_details?.subscription;
  if (typeof parent === "string") {
    return parent;
  }

  if (parent && typeof parent.id === "string") {
    return parent.id;
  }

  return null;
}
