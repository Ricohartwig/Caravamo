import { cache } from "react";
import { connection } from "next/server";
import { blankFilters, camperFilterActive, type VehicleFilters } from "@/lib/filters";
import { isPublicListing } from "@/lib/listing-payment";
import { isVehicleId } from "@/lib/owned-listings";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { createPublicClient } from "@/utils/supabase/public";
import { createClient } from "@/utils/supabase/server";

export type OfferCard = {
  id: string;
  title: string;
  brand: string;
  model: string;
  price: number;
  type: string;
  firstRegistration: string;
  mileage: number | null;
  imageUrl: string | null;
};

export type PublishedListing = {
  id: string;
  title: string;
  brand: string;
  type: string;
  price: number;
  priceTax: string | null;
  description: string | null;
  imageUrls: string[];
  sellerId: string;
  sellerName: string;
  sellerKind: "Privat" | "Händler";
  sellerCity: string | null;
  sellerPlace: string | null;
  sellerAbout: string | null;
  sellerHref: string | null;
  values: Record<string, unknown>;
};

export async function listNewestOffers(limit = 6): Promise<OfferCard[]> {
  return searchOffers(blankFilters(), limit);
}

export async function searchOffers(filters: VehicleFilters, limit = 48): Promise<OfferCard[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  await connection();
  const now = new Date().toISOString();
  const supabase = await createClient();
  const details = camperFilterActive(filters)
    ? "vehicle_camper_details!inner(body_type)"
    : "vehicle_camper_details(body_type)";
  let query = supabase
    .from("vehicles")
    .select(
      `id, brand, model, type, price, mileage, year, first_registration, vehicle_images(url, is_main), ${details}`,
    )
    .eq("status", "aktiv")
    .or(`published_until.is.null,published_until.gt."${now}"`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.brand) {
    query = query.ilike("brand", escapeLike(filters.brand));
  }
  if (filters.model) {
    query = query.ilike("model", escapeLike(filters.model));
  }
  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.priceMin !== null) {
    query = query.gte("price", filters.priceMin);
  }
  if (filters.priceMax !== null) {
    query = query.lte("price", filters.priceMax);
  }
  query = applyCamperFilters(query, filters);

  const { data, error } = await query;
  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.flatMap((row) => {
    const card = toOfferCard(row);
    return card ? [card] : [];
  });
}

function applyCamperFilters<T extends CamperQuery<T>>(query: T, filters: VehicleFilters): T {
  if (filters.body) {
    query = query.eq("vehicle_camper_details.body_type", filters.body);
  }
  if (filters.weightMax !== null) {
    query = query.lte("vehicle_camper_details.gross_weight_kg", filters.weightMax);
  }
  if (filters.solar) {
    query = query.eq("vehicle_camper_details.has_solar", true);
  }
  if (filters.inverter) {
    query = query.eq("vehicle_camper_details.has_inverter", true);
  }
  if (filters.awning) {
    query = query.eq("vehicle_camper_details.has_awning", true);
  }
  if (filters.air) {
    query = query.eq("vehicle_camper_details.has_air_suspension", true);
  }
  if (filters.fuel) {
    query = query.eq("vehicle_camper_details.fuel", filters.fuel);
  }
  if (filters.transmission) {
    query = query.eq("vehicle_camper_details.transmission", filters.transmission);
  }
  if (filters.bed) {
    query = query.contains("vehicle_camper_details.bed_types", [filters.bed]);
  }
  if (filters.climate) {
    query = query.contains("vehicle_camper_details.climate", [filters.climate]);
  }
  if (filters.sleepMin !== null) {
    query = query.gte("vehicle_camper_details.sleeping_places", filters.sleepMin);
  }

  return query;
}

type CamperQuery<T> = {
  eq: (column: string, value: string | boolean) => T;
  lte: (column: string, value: number) => T;
  gte: (column: string, value: number) => T;
  contains: (column: string, value: readonly string[]) => T;
};

function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, (char) => `\\${char}`);
}

export type SitemapListing = {
  id: string;
  updatedAt: string | null;
  imageUrls: string[];
};

export async function listSitemapListings(): Promise<SitemapListing[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  await connection();
  const now = new Date().toISOString();
  const supabase = await createClient();
  const pageSize = 1000;
  const listings: SitemapListing[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, created_at, vehicle_images(url, is_main)")
      .eq("status", "aktiv")
      .or(`published_until.is.null,published_until.gt."${now}"`)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error || !Array.isArray(data)) {
      break;
    }

    for (const row of data) {
      if (!isRecord(row) || typeof row.id !== "string") {
        continue;
      }

      listings.push({
        id: row.id,
        updatedAt: readString(row.created_at),
        imageUrls: imageUrls(row.vehicle_images).filter((url) => url.startsWith("https://")),
      });
    }

    if (data.length < pageSize) {
      break;
    }
  }

  return listings;
}

export const getPublishedListing = cache(async (id: string): Promise<PublishedListing | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  await connection();
  const now = Date.now();
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*, vehicle_camper_details(*), vehicle_images(url, is_main)")
    .eq("id", id)
    .maybeSingle();

  if (
    error ||
    !isRecord(data) ||
    !isPublicListing(readString(data.status) ?? "", readString(data.published_until), now)
  ) {
    return null;
  }

  return toPublishedListing(id, data);
});

export async function getOwnedPreview(userId: string, id: string): Promise<PublishedListing | null> {
  if (!isSupabaseConfigured() || !isVehicleId(id)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*, vehicle_camper_details(*), vehicle_images(url, is_main)")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !isRecord(data)) {
    return null;
  }

  return toPublishedListing(id, data);
}

async function toPublishedListing(id: string, data: Record<string, unknown>): Promise<PublishedListing | null> {
  const brand = readString(data.brand) ?? "Fahrzeug";
  const model = readString(data.model) ?? "";
  const price = readNumber(data.price);
  if (price === null) {
    return null;
  }

  const details = firstRecord(data.vehicle_camper_details);
  const seller = await readSeller(readString(data.user_id));

  return {
    id,
    title: model ? `${brand} ${model}` : brand,
    brand,
    type: readString(data.type) ?? "Fahrzeug",
    price,
    priceTax: readString(data.price_tax),
    description: readString(data.description),
    imageUrls: imageUrls(data.vehicle_images),
    sellerId: readString(data.user_id) ?? "",
    sellerName: seller.name,
    sellerKind: seller.kind,
    sellerCity: seller.city,
    sellerPlace: seller.place,
    sellerAbout: seller.about,
    sellerHref: seller.href,
    values: { ...data, ...(details ?? {}) },
  };
}

async function readSeller(userId: string | null): Promise<{
  name: string;
  kind: "Privat" | "Händler";
  city: string | null;
  place: string | null;
  about: string | null;
  href: string | null;
}> {
  const fallback = { name: "Privater Anbieter", kind: "Privat" as const, city: null, place: null, about: null, href: null };
  if (!userId) {
    return fallback;
  }

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("seller_profiles")
    .select("name, role, city, postal_code, company_name, about")
    .eq("id", userId)
    .maybeSingle();
  if (!isRecord(data)) {
    return fallback;
  }

  const role = readString(data.role)?.toLowerCase();
  const business = role === "haendler" || role === "händler";
  const city = readString(data.city);
  const company = readString(data.company_name);
  const postalCode = readString(data.postal_code);
  const place = [postalCode, city].filter(Boolean).join(" ") || null;

  return {
    name: (business ? company : null) ?? readString(data.name) ?? "Privater Anbieter",
    kind: business ? "Händler" : "Privat",
    city,
    place,
    about: readString(data.about),
    href: business && company && city ? `/haendler/${userId}` : null,
  };
}

function toOfferCard(row: unknown): OfferCard | null {
  if (!isRecord(row) || typeof row.id !== "string") {
    return null;
  }

  const price = readNumber(row.price);
  if (price === null) {
    return null;
  }

  const brand = readString(row.brand) ?? "Fahrzeug";
  const model = readString(row.model) ?? "";
  const urls = imageUrls(row.vehicle_images);

  return {
    id: row.id,
    title: model ? `${brand} ${model}` : brand,
    brand,
    model,
    price,
    type: readString(row.type) ?? "Fahrzeug",
    firstRegistration: registrationLabel(readString(row.first_registration), readNumber(row.year)),
    mileage: readNumber(row.mileage),
    imageUrl: urls[0] ?? null,
  };
}

function imageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const images = value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }
    const url = readString(entry.url);
    if (!url) {
      return [];
    }
    return [{ url, main: entry.is_main === true }];
  });

  images.sort((left, right) => Number(right.main) - Number(left.main));
  return images.map((image) => image.url);
}

function registrationLabel(date: string | null, year: number | null): string {
  if (date && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [yearPart, month] = date.split("-");
    return `${month}/${yearPart}`;
  }

  if (year !== null) {
    return String(year);
  }

  return "ohne Angabe";
}

function firstRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    return isRecord(value[0]) ? value[0] : null;
  }

  return isRecord(value) ? value : null;
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
