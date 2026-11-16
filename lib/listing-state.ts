import { isPublicListing } from "@/lib/listing-payment";

export type ListingStand = "entwurf" | "aktiv" | "inaktiv" | "verkauft" | "abgelaufen" | "gesperrt";

export function listingStand(status: string, publishedUntil: string | null, now = Date.now()): ListingStand {
  if (status === "verkauft") {
    return "verkauft";
  }

  if (status === "inaktiv") {
    return paidTimeLeft(publishedUntil, now) ? "inaktiv" : "abgelaufen";
  }

  if (status === "aktiv") {
    return isPublicListing(status, publishedUntil, now) ? "aktiv" : "abgelaufen";
  }

  if (status === "gesperrt") {
    return "gesperrt";
  }

  return "entwurf";
}

export function paidTimeLeft(publishedUntil: string | null, now = Date.now()): boolean {
  if (!publishedUntil) {
    return false;
  }

  const until = Date.parse(publishedUntil);
  return Number.isFinite(until) && until > now;
}

export function canPause(status: string, publishedUntil: string | null, now = Date.now()): boolean {
  return listingStand(status, publishedUntil, now) === "aktiv";
}

export function canResume(status: string, publishedUntil: string | null, now = Date.now()): boolean {
  const stand = listingStand(status, publishedUntil, now);
  return (stand === "inaktiv" || stand === "verkauft") && paidTimeLeft(publishedUntil, now);
}

export function canMarkSold(status: string, publishedUntil: string | null, now = Date.now()): boolean {
  const stand = listingStand(status, publishedUntil, now);
  return stand === "aktiv" || stand === "inaktiv";
}

export function listingNeedsPayment(status: string, publishedUntil: string | null, now = Date.now()): boolean {
  const stand = listingStand(status, publishedUntil, now);
  return stand === "entwurf" || stand === "abgelaufen";
}
