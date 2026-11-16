import { packageBySlots } from "@/lib/dealer-packages";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { createClient } from "@/utils/supabase/server";

export type DealerSubscription = {
  slots: number;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  priceId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export type PackageAllowance = {
  subscription: DealerSubscription | null;
  used: number;
  free: number;
  usable: boolean;
};

export function subscriptionUsable(
  subscription: Pick<DealerSubscription, "status" | "currentPeriodEnd"> | null,
  now = Date.now(),
): boolean {
  if (!subscription) {
    return false;
  }

  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return false;
  }

  if (!subscription.currentPeriodEnd) {
    return true;
  }

  const end = Date.parse(subscription.currentPeriodEnd);
  return Number.isFinite(end) && end > now;
}

export async function packageAllowance(userId: string): Promise<PackageAllowance> {
  if (!isSupabaseConfigured()) {
    return { subscription: null, used: 0, free: 0, usable: false };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("dealer_subscriptions")
    .select("slots, status, current_period_end, cancel_at_period_end, price_id, stripe_customer_id, stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  const subscription = readSubscription(data);
  const used = await usedPackageSlots(userId);
  const usable = subscriptionUsable(subscription);
  const slots = usable && subscription ? subscription.slots : 0;

  return {
    subscription,
    used,
    free: Math.max(slots - used, 0),
    usable,
  };
}

export async function usedPackageSlots(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("billing_source", "paket")
    .in("status", ["aktiv", "inaktiv"])
    .gt("published_until", new Date().toISOString());

  return count ?? 0;
}

export function subscriptionLabel(subscription: DealerSubscription | null): string | null {
  if (!subscription || subscription.slots <= 0) {
    return null;
  }

  const known = packageBySlots(subscription.slots);
  return known ? `${known.slots} Fahrzeuge` : `${subscription.slots} Fahrzeuge`;
}

function readSubscription(data: unknown): DealerSubscription | null {
  if (!isRecord(data) || typeof data.status !== "string") {
    return null;
  }

  const slots = typeof data.slots === "number" && Number.isFinite(data.slots) ? data.slots : 0;

  return {
    slots,
    status: data.status,
    currentPeriodEnd: typeof data.current_period_end === "string" ? data.current_period_end : null,
    cancelAtPeriodEnd: data.cancel_at_period_end === true,
    priceId: typeof data.price_id === "string" ? data.price_id : null,
    stripeCustomerId: typeof data.stripe_customer_id === "string" ? data.stripe_customer_id : null,
    stripeSubscriptionId: typeof data.stripe_subscription_id === "string" ? data.stripe_subscription_id : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
