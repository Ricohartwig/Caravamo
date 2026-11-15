export const privateListingAmount = 499;
export const businessListingAmount = 699;
export const listingPeriodMs = 30 * 24 * 60 * 60 * 1000;

export type PaidCheckout = {
  id: string;
  paymentStatus: string | null;
  amountTotal: number | null;
  currency: string | null;
  priceId: string | null;
  vehicleId: string | null;
  userId: string | null;
};

export type VehiclePaymentState = {
  userId: string;
  status: string;
  stripeSessionId: string | null;
  publishedUntil: string | null;
};

export type PaymentCatalog = {
  privatePriceId: string;
  businessPriceId: string;
};

export type Activation =
  | { ok: true; kind: "ignore" }
  | { ok: true; kind: "activate"; publishedUntil: string }
  | { ok: false; reason: string };

export function decideActivation(
  checkout: PaidCheckout,
  vehicle: VehiclePaymentState,
  catalog: PaymentCatalog,
  business: boolean,
  now: Date,
): Activation {
  if (checkout.paymentStatus !== "paid") {
    return { ok: false, reason: "unpaid" };
  }

  if (!checkout.vehicleId || !checkout.userId || checkout.userId !== vehicle.userId) {
    return { ok: false, reason: "owner" };
  }

  const expectedPriceId = business ? catalog.businessPriceId : catalog.privatePriceId;
  const expectedAmount = business ? businessListingAmount : privateListingAmount;
  if (
    checkout.currency !== "eur" ||
    checkout.priceId !== expectedPriceId ||
    checkout.amountTotal !== expectedAmount
  ) {
    return { ok: false, reason: "price" };
  }

  if (vehicle.stripeSessionId === checkout.id && vehicle.status === "aktiv") {
    return { ok: true, kind: "ignore" };
  }

  return {
    ok: true,
    kind: "activate",
    publishedUntil: extendPublication(vehicle.publishedUntil, now),
  };
}

export function extendPublication(currentUntil: string | null, now: Date): string {
  const parsed = currentUntil ? Date.parse(currentUntil) : Number.NaN;
  const start = Number.isFinite(parsed) && parsed > now.getTime() ? parsed : now.getTime();
  return new Date(start + listingPeriodMs).toISOString();
}

export function isPublicListing(
  status: string,
  publishedUntil: string | null,
  now = Date.now(),
): boolean {
  if (status !== "aktiv") {
    return false;
  }

  if (!publishedUntil) {
    return true;
  }

  const until = Date.parse(publishedUntil);
  return Number.isFinite(until) && until > now;
}
