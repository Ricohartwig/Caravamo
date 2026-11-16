import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { decideActivation, type PaidCheckout } from "@/lib/listing-payment";
import { subscriptionIdFromInvoice, syncDealerSubscription } from "@/lib/package-billing";
import { isBusinessRole, isStripeConfigured, getStripe, paymentCatalog, webhookSecret } from "@/lib/stripe";
import { createAdminClient, isServiceRoleConfigured } from "@/utils/supabase/admin";
import { isSupabaseConfigured } from "@/utils/supabase/env";

const checkoutEvents = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);
const subscriptionEvents = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSupabaseConfigured() || !isServiceRoleConfigured() || !isStripeConfigured()) {
    return NextResponse.json({ error: "Zahlung ist nicht konfiguriert." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signatur fehlt." }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret());
  } catch {
    return NextResponse.json({ error: "Signatur ist ungültig." }, { status: 400 });
  }

  if (subscriptionEvents.has(event.type)) {
    await syncDealerSubscription(event.data.object as Stripe.Subscription);
    return NextResponse.json({ received: true });
  }

  if (event.type === "invoice.paid") {
    const subscriptionId = subscriptionIdFromInvoice(event.data.object as Stripe.Invoice);
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncDealerSubscription(subscription);
    }
    return NextResponse.json({ received: true });
  }

  if (!checkoutEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const received = event.data.object as Stripe.Checkout.Session;
  const session = await stripe.checkout.sessions.retrieve(received.id, { expand: ["line_items"] });
  if (session.mode === "subscription") {
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncDealerSubscription(subscription);
    }
    return NextResponse.json({ received: true });
  }
  const checkout = readCheckout(session);
  if (!checkout.vehicleId) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();
  const { data: vehicle, error } = await admin
    .from("vehicles")
    .select("id, user_id, status, published_until, stripe_session_id")
    .eq("id", checkout.vehicleId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Fahrzeug konnte nicht gelesen werden." }, { status: 500 });
  }

  if (!vehicle || typeof vehicle.user_id !== "string") {
    return NextResponse.json({ received: true });
  }

  const { data: profile } = await admin.from("users").select("role").eq("id", vehicle.user_id).maybeSingle();
  const decision = decideActivation(
    checkout,
    {
      userId: vehicle.user_id,
      status: typeof vehicle.status === "string" ? vehicle.status : "entwurf",
      stripeSessionId: typeof vehicle.stripe_session_id === "string" ? vehicle.stripe_session_id : null,
      publishedUntil: typeof vehicle.published_until === "string" ? vehicle.published_until : null,
    },
    paymentCatalog(),
    isBusinessRole(typeof profile?.role === "string" ? profile.role : null),
    new Date(),
  );

  if (!decision.ok || decision.kind === "ignore") {
    return NextResponse.json({ received: true });
  }

  const { error: updateError } = await admin
    .from("vehicles")
    .update({
      status: "aktiv",
      published_until: decision.publishedUntil,
      stripe_session_id: checkout.id,
    })
    .eq("id", checkout.vehicleId)
    .eq("user_id", vehicle.user_id);

  if (updateError) {
    return NextResponse.json({ error: "Inserat konnte nicht veröffentlicht werden." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function readCheckout(session: Stripe.Checkout.Session): PaidCheckout {
  const price = session.line_items?.data[0]?.price;
  const priceId = typeof price === "string" ? price : (price?.id ?? null);

  return {
    id: session.id,
    paymentStatus: session.payment_status,
    amountTotal: session.amount_total,
    currency: session.currency,
    priceId,
    vehicleId: session.metadata?.vehicle_id ?? null,
    userId: session.metadata?.user_id ?? null,
  };
}
