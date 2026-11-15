import Stripe from "stripe";

const placeholderSecret = "sk_test_your-secret-key";
const placeholderPrice = "price_your-price";

export function isStripeConfigured(): boolean {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const privatePrice = process.env.STRIPE_PRICE_PRIVAT;
  const businessPrice = process.env.STRIPE_PRICE_HAENDLER;

  if (!secret || !webhookSecret || !privatePrice || !businessPrice) {
    return false;
  }

  return (
    secret !== placeholderSecret &&
    !privatePrice.includes(placeholderPrice) &&
    !businessPrice.includes(placeholderPrice) &&
    !webhookSecret.includes("your-webhook-secret")
  );
}

export function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !isStripeConfigured()) {
    throw new Error("Stripe ist noch nicht konfiguriert.");
  }

  return new Stripe(secret, { apiVersion: "2026-10-28.endive" });
}

export function paymentCatalog(): { privatePriceId: string; businessPriceId: string } {
  const privatePriceId = process.env.STRIPE_PRICE_PRIVAT;
  const businessPriceId = process.env.STRIPE_PRICE_HAENDLER;
  if (!privatePriceId || !businessPriceId || !isStripeConfigured()) {
    throw new Error("Stripe-Preise fehlen.");
  }

  return { privatePriceId, businessPriceId };
}

export function webhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !isStripeConfigured()) {
    throw new Error("Stripe-Webhook-Geheimnis fehlt.");
  }

  return secret;
}

export function isBusinessRole(role: string | null | undefined): boolean {
  const normalized = role?.trim().toLowerCase();
  return normalized === "haendler" || normalized === "händler";
}
