import { businessListingAmount } from "@/lib/listing-payment";

export type DealerPackage = {
  slots: number;
  amount: number;
  lookupKey: string;
};

// Listenpreis ist 6,99 € je Fahrzeug. Die Pakete sind ganze Euro und der
// Rabatt steigt mit der Größe: 3 Stück kosten 20 € statt 20,97 €, 40 Stück
// 229 € statt 279,60 €.
export const dealerPackages = [
  { slots: 3, amount: 2000, lookupKey: "haendler-paket-3" },
  { slots: 5, amount: 3200, lookupKey: "haendler-paket-5" },
  { slots: 10, amount: 6200, lookupKey: "haendler-paket-10" },
  { slots: 20, amount: 12000, lookupKey: "haendler-paket-20" },
  { slots: 30, amount: 17500, lookupKey: "haendler-paket-30" },
  { slots: 40, amount: 22900, lookupKey: "haendler-paket-40" },
  { slots: 100, amount: 53900, lookupKey: "haendler-paket-100" },
  { slots: 200, amount: 102800, lookupKey: "haendler-paket-200" },
] as const satisfies readonly DealerPackage[];

export type PackageSlots = (typeof dealerPackages)[number]["slots"];

export function packageBySlots(slots: number): DealerPackage | null {
  return dealerPackages.find((entry) => entry.slots === slots) ?? null;
}

export function packageByLookupKey(lookupKey: string | null | undefined): DealerPackage | null {
  if (!lookupKey) {
    return null;
  }

  return dealerPackages.find((entry) => entry.lookupKey === lookupKey) ?? null;
}

export function listPriceCents(slots: number): number {
  return slots * businessListingAmount;
}

export function formatEuroCents(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
