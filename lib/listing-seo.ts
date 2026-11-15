import { formatPrice } from "@/lib/format";
import type { PublishedListing } from "@/lib/published-listings";
import { absoluteUrl } from "@/lib/site";

const descriptionLimit = 160;

export function listingTitle(listing: Pick<PublishedListing, "title" | "price" | "sellerCity">): string {
  const place = listing.sellerCity ? ` in ${listing.sellerCity}` : "";
  return `${listing.title} kaufen für ${plainPrice(listing.price)}${place}`;
}

export function listingDescription(listing: PublishedListing): string {
  const place = listing.sellerCity ? ` in ${listing.sellerCity}` : "";
  const summary = `${listing.title}, ${listing.type}, für ${plainPrice(listing.price)}${place}.`;
  const detail = listing.description?.replace(/\s+/g, " ").trim();
  const text = detail ? `${summary} ${detail}` : `${summary} Angebot auf Caravamo.`;
  if (text.length <= descriptionLimit) {
    return text;
  }

  return `${text.slice(0, descriptionLimit - 1).trimEnd()}…`;
}

export function vehicleJsonLd(listing: PublishedListing): Record<string, unknown> {
  const path = `/fahrzeug/${listing.id}`;
  const model = readString(listing.values.model);
  const year = readNumber(listing.values.year);
  const registered = readString(listing.values.first_registration);
  const mileage = readNumber(listing.values.mileage);
  const seats = readNumber(listing.values.belted_seats);
  const images = listing.imageUrls.filter((url) => url.startsWith("https://"));

  return compact({
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: listing.title,
    brand: { "@type": "Brand", name: listing.brand },
    model: model ?? undefined,
    description: listing.description ?? listingDescription(listing),
    url: absoluteUrl(path),
    image: images.length > 0 ? images : undefined,
    bodyType: readString(listing.values.body_type) ?? undefined,
    vehicleModelDate: registered ?? (year !== null ? String(year) : undefined),
    fuelType: readString(listing.values.fuel) ?? undefined,
    vehicleTransmission: readString(listing.values.transmission) ?? undefined,
    vehicleSeatingCapacity: seats ?? undefined,
    mileageFromOdometer:
      mileage !== null
        ? { "@type": "QuantitativeValue", value: mileage, unitCode: "KMT" }
        : undefined,
    offers: compact({
      "@type": "Offer",
      price: listing.price.toFixed(2),
      priceCurrency: "EUR",
      availability: availabilityUrl(readString(listing.values.availability)),
      itemCondition: conditionUrl(readString(listing.values.condition)),
      url: absoluteUrl(path),
      seller: compact({
        "@type": listing.sellerKind === "Händler" ? "AutoDealer" : "Person",
        name: listing.sellerName,
        address: listing.sellerCity
          ? {
              "@type": "PostalAddress",
              addressLocality: listing.sellerCity,
              addressCountry: "DE",
            }
          : undefined,
      }),
    }),
  });
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function plainPrice(value: number): string {
  return formatPrice(value).replace(/[\u00a0\u202f]/g, " ");
}

function availabilityUrl(value: string | null): string {
  if (value === "im Vorlauf" || value === "bestellbar") {
    return "https://schema.org/PreOrder";
  }

  return "https://schema.org/InStock";
}

function conditionUrl(value: string | null): string | undefined {
  if (value === "Neu") {
    return "https://schema.org/NewCondition";
  }

  if (value === "Gebraucht" || value === "Vorführfahrzeug" || value === "Beschädigt") {
    return "https://schema.org/UsedCondition";
  }

  return undefined;
}

function compact(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== ""));
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }

  return null;
}
