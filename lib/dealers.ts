import { cache } from "react";
import { connection } from "next/server";
import { isVehicleId } from "@/lib/owned-listings";
import { dealerServiceOptions, serviceLabel, type DealerService } from "@/lib/profile";
import { isPublicListing } from "@/lib/listing-payment";
import type { OfferCard } from "@/lib/published-listings";
import { absoluteUrl } from "@/lib/site";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { createPublicClient } from "@/utils/supabase/public";

export type PublicDealer = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string | null;
  street: string | null;
  postalCode: string | null;
  city: string;
  website: string | null;
  about: string | null;
  openingHours: string | null;
  vatId: string | null;
  services: { id: DealerService; label: string }[];
  logoUrl: string | null;
  legalForm: string | null;
  registerCourt: string | null;
  registerNumber: string | null;
  publicEmail: string | null;
  representedBy: string | null;
  verified: boolean;
  memberSince: string | null;
  offerCount: number;
};

const knownServices = new Set<string>(dealerServiceOptions.map((option) => option.id));

export const getDealer = cache(async (id: string): Promise<PublicDealer | null> => {
  if (!isVehicleId(id) || !isSupabaseConfigured()) {
    return null;
  }

  const dealers = await loadDealers();
  return dealers.find((dealer) => dealer.id === id) ?? null;
});

export async function listDealers(): Promise<PublicDealer[]> {
  await connection();
  const dealers = await loadDealers();
  const counts = await offerCounts(dealers.map((dealer) => dealer.id));
  return dealers
    .map((dealer) => ({ ...dealer, offerCount: counts.get(dealer.id) ?? 0 }))
    .sort((left, right) => left.companyName.localeCompare(right.companyName, "de"));
}

export async function listDealerSitemap(): Promise<Array<{ id: string; updatedAt: string | null }>> {
  const dealers = await loadDealers();
  return dealers.map((dealer) => ({ id: dealer.id, updatedAt: dealer.memberSince }));
}

export async function listDealerOffers(dealerId: string): Promise<OfferCard[]> {
  if (!isVehicleId(dealerId) || !isSupabaseConfigured()) {
    return [];
  }

  await connection();
  const now = new Date().toISOString();
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, brand, model, type, price, mileage, year, first_registration, status, published_until, vehicle_images(url, is_main)")
    .eq("user_id", dealerId)
    .eq("status", "aktiv")
    .or(`published_until.is.null,published_until.gt."${now}"`)
    .order("created_at", { ascending: false })
    .limit(48);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.flatMap((row) => {
    const card = toOfferCard(row);
    return card ? [card] : [];
  });
}

export function dealerJsonLd(dealer: PublicDealer): Record<string, unknown> {
  return compact({
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: dealer.companyName,
    url: absoluteUrl(`/haendler/${dealer.id}`),
    description: dealer.about ?? undefined,
    telephone: dealer.phone ?? undefined,
    email: dealer.publicEmail ?? undefined,
    logo: dealer.logoUrl ?? undefined,
    vatID: dealer.vatId ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: dealer.street ?? undefined,
      postalCode: dealer.postalCode ?? undefined,
      addressLocality: dealer.city,
      addressCountry: "DE",
    },
  });
}

const loadDealers = cache(async (): Promise<PublicDealer[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("dealer_profiles")
    .select(
      "id, company_name, contact_name, phone, street, postal_code, city, website, about, opening_hours, vat_id, services, logo_url, legal_form, register_court, register_number, public_email, represented_by, dealer_verified, created_at",
    );

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.flatMap((row) => {
    if (!isRecord(row) || typeof row.id !== "string") {
      return [];
    }
    const companyName = readString(row.company_name);
    const city = readString(row.city);
    if (!companyName || !city) {
      return [];
    }

    return [
      {
        id: row.id,
        companyName,
        contactName: readString(row.contact_name) ?? companyName,
        phone: readString(row.phone),
        street: readString(row.street),
        postalCode: readString(row.postal_code),
        city,
        website: readString(row.website),
        about: readString(row.about),
        openingHours: readString(row.opening_hours),
        vatId: readString(row.vat_id),
        services: readServices(row.services),
        logoUrl: readString(row.logo_url),
        legalForm: readString(row.legal_form),
        registerCourt: readString(row.register_court),
        registerNumber: readString(row.register_number),
        publicEmail: readString(row.public_email),
        representedBy: readString(row.represented_by),
        verified: row.dealer_verified === true,
        memberSince: readString(row.created_at),
        offerCount: 0,
      },
    ];
  });
});

async function offerCounts(ids: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (ids.length === 0) {
    return counts;
  }

  await connection();
  const now = Date.now();
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("user_id, status, published_until")
    .in("user_id", ids)
    .eq("status", "aktiv");

  if (error || !Array.isArray(data)) {
    return counts;
  }

  for (const row of data) {
    if (!isRecord(row) || typeof row.user_id !== "string") {
      continue;
    }
    if (!isPublicListing(readString(row.status) ?? "", readString(row.published_until), now)) {
      continue;
    }
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  }

  return counts;
}

function toOfferCard(row: unknown): OfferCard | null {
  if (!isRecord(row) || typeof row.id !== "string") {
    return null;
  }
  if (!isPublicListing(readString(row.status) ?? "", readString(row.published_until))) {
    return null;
  }

  const price = readNumber(row.price);
  if (price === null) {
    return null;
  }

  const brand = readString(row.brand) ?? "Fahrzeug";
  const model = readString(row.model) ?? "";
  return {
    id: row.id,
    title: model ? `${brand} ${model}` : brand,
    brand,
    model,
    price,
    type: readString(row.type) ?? "Fahrzeug",
    firstRegistration: registrationLabel(readString(row.first_registration), readNumber(row.year)),
    mileage: readNumber(row.mileage),
    imageUrl: firstImage(row.vehicle_images),
  };
}

function firstImage(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const images = value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }
    const url = readString(entry.url);
    return url ? [{ url, main: entry.is_main === true }] : [];
  });
  images.sort((left, right) => Number(right.main) - Number(left.main));
  return images[0]?.url ?? null;
}

function registrationLabel(date: string | null, year: number | null): string {
  if (date && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [yearPart, month] = date.split("-");
    return `${month}/${yearPart}`;
  }
  return year !== null ? String(year) : "ohne Angabe";
}

function readServices(value: unknown): { id: DealerService; label: string }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (typeof entry !== "string" || !knownServices.has(entry)) {
      return [];
    }
    const id = entry as DealerService;
    return [{ id, label: serviceLabel(id) }];
  });
}

function compact(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
