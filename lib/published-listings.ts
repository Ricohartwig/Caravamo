import { cache } from "react";
import { connection } from "next/server";
import { blankFilters, camperFilterActive, standHeating, type VehicleFilters } from "@/lib/filters";
import { toilets } from "@/lib/listing-options";
import { isPublicListing } from "@/lib/listing-payment";
import { isVehicleId } from "@/lib/owned-listings";
import { type OfferSort, searchPageSize, similarPriceBand } from "@/lib/search-query";
import { orderedImageUrls } from "@/lib/vehicle-images";
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

export async function countPublicOffers(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  await connection();
  const now = new Date().toISOString();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .eq("status", "aktiv")
    .or(`published_until.is.null,published_until.gt."${now}"`);

  if (error || count === null) {
    return 0;
  }

  return count;
}

export async function searchOffers(filters: VehicleFilters, limit = 48): Promise<OfferCard[]> {
  const page = await searchOfferPage(filters, 1, "neueste", limit);
  return page.offers;
}

export async function countOffers(filters: VehicleFilters): Promise<number> {
  const page = await searchOfferPage(filters, 1, "neueste", 1);
  return page.total;
}

export async function searchOfferPage(
  filters: VehicleFilters,
  page: number,
  sort: OfferSort,
  limit = searchPageSize,
): Promise<{ offers: OfferCard[]; total: number }> {
  const ready = await prepareSearch(filters);
  if (!ready || ready.sellers?.length === 0) {
    return { offers: [], total: 0 };
  }

  const from = Math.max(0, page - 1) * limit;
  let query = ready.supabase
    .from("vehicles")
    .select(offerColumns(filters), { count: "exact" })
    .eq("status", "aktiv")
    .or(`published_until.is.null,published_until.gt."${ready.now}"`);
  query = applyVehicleFilters(query, filters, ready.sellers);
  query = applyCamperFilters(query, filters);
  query = applySort(query, sort);

  const { data, error, count } = await query.range(from, from + limit - 1);
  if (error || !Array.isArray(data)) {
    return { offers: [], total: 0 };
  }

  return {
    offers: data.flatMap((row) => {
      const card = toOfferCard(row);
      return card ? [card] : [];
    }),
    total: count ?? 0,
  };
}

export async function listSimilarOffers(id: string, body: string | null, price: number): Promise<OfferCard[]> {
  if (!body || !isSupabaseConfigured() || !isVehicleId(id)) {
    return [];
  }

  await connection();
  const band = similarPriceBand(price);
  const now = new Date().toISOString();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      "id, brand, model, type, price, mileage, year, first_registration, vehicle_images(url, is_main, position), vehicle_camper_details!inner(body_type)",
    )
    .eq("status", "aktiv")
    .or(`published_until.is.null,published_until.gt."${now}"`)
    .eq("vehicle_camper_details.body_type", body)
    .gte("price", band.min)
    .lte("price", band.max)
    .neq("id", id)
    .limit(40);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data
    .flatMap((row) => {
      const card = toOfferCard(row);
      return card ? [card] : [];
    })
    .sort((left, right) => Math.abs(left.price - price) - Math.abs(right.price - price) || left.title.localeCompare(right.title, "de"))
    .slice(0, 12);
}

async function prepareSearch(filters: VehicleFilters): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  now: string;
  sellers: string[] | null;
} | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  await connection();
  const supabase = await createClient();
  const sellers = await matchingSellerIds(supabase, filters);
  return { supabase, now: new Date().toISOString(), sellers };
}

function offerColumns(filters: VehicleFilters): string {
  const details = camperFilterActive(filters)
    ? "vehicle_camper_details!inner(body_type)"
    : "vehicle_camper_details(body_type)";
  return `id, brand, model, type, price, mileage, year, first_registration, vehicle_images(url, is_main, position), ${details}`;
}

function applyVehicleFilters<T extends VehicleQuery<T>>(query: T, filters: VehicleFilters, sellers: string[] | null): T {
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
  if (filters.yearMin !== null) {
    query = query.gte("year", filters.yearMin);
  }
  if (filters.yearMax !== null) {
    query = query.lte("year", filters.yearMax);
  }
  if (filters.mileageMin !== null) {
    query = query.gte("mileage", filters.mileageMin);
  }
  if (filters.mileageMax !== null) {
    query = query.lte("mileage", filters.mileageMax);
  }
  if (filters.condition) {
    query = query.eq("condition", filters.condition);
  }
  if (sellers) {
    query = query.in("user_id", sellers);
  }

  return query;
}

function applySort<T extends SortQuery<T>>(query: T, sort: OfferSort): T {
  if (sort === "preis-auf") {
    return query.order("price", { ascending: true }).order("created_at", { ascending: false });
  }
  if (sort === "preis-ab") {
    return query.order("price", { ascending: false }).order("created_at", { ascending: false });
  }
  if (sort === "km-auf") {
    return query.order("mileage", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
  }
  if (sort === "km-ab") {
    return query.order("mileage", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  }
  if (sort === "ez-neu") {
    return query.order("first_registration", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  }
  if (sort === "ez-alt") {
    return query.order("first_registration", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
  }

  return query.order("created_at", { ascending: false });
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
  if (filters.lengthMin !== null) {
    query = query.gte("vehicle_camper_details.length_cm", filters.lengthMin);
  }
  if (filters.lengthMax !== null) {
    query = query.lte("vehicle_camper_details.length_cm", filters.lengthMax);
  }
  if (filters.powerMin !== null) {
    query = query.gte("vehicle_camper_details.power_ps", filters.powerMin);
  }
  if (filters.heater) {
    query = query.in("vehicle_camper_details.heating", [...standHeating]);
  }
  if (filters.shower) {
    query = query.eq("vehicle_camper_details.shower", "separate Dusche");
  }
  if (filters.toilet) {
    query = query.in("vehicle_camper_details.toilet", [...toilets]);
  }
  if (filters.seating) {
    query = query.eq("vehicle_camper_details.seating_group", "Rundsitzgruppe");
  }
  if (filters.sat) {
    query = query.contains("vehicle_camper_details.connectivity", ["SAT-TV"]);
  }
  if (filters.bike) {
    query = query.eq("vehicle_camper_details.has_bike_rack", true);
  }
  if (filters.hitch) {
    query = query.eq("vehicle_camper_details.has_tow_hitch", true);
  }

  return query;
}

async function matchingSellerIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: VehicleFilters,
): Promise<string[] | null> {
  if (!filters.city && !filters.seller) {
    return null;
  }

  const { data, error } = await supabase.from("seller_profiles").select("id, role, city, postal_code");
  if (error || !Array.isArray(data)) {
    return [];
  }

  const needle = filters.city.toLocaleLowerCase("de-DE");
  return data.flatMap((row) => {
    if (!isRecord(row) || typeof row.id !== "string") {
      return [];
    }
    const role = typeof row.role === "string" ? row.role.toLocaleLowerCase("de-DE") : "";
    const dealer = role === "haendler" || role === "händler";
    if (filters.seller === "haendler" && !dealer) {
      return [];
    }
    if (filters.seller === "privat" && dealer) {
      return [];
    }
    const place = `${typeof row.postal_code === "string" ? row.postal_code : ""} ${typeof row.city === "string" ? row.city : ""}`
      .toLocaleLowerCase("de-DE");
    if (needle && !place.includes(needle)) {
      return [];
    }
    return [row.id];
  });
}

type VehicleQuery<T> = {
  ilike: (column: string, value: string) => T;
  eq: (column: string, value: string | boolean) => T;
  gte: (column: string, value: number) => T;
  lte: (column: string, value: number) => T;
  in: (column: string, value: readonly string[]) => T;
};

type SortQuery<T> = {
  order: (column: string, options: { ascending: boolean; nullsFirst?: boolean }) => T;
};

type CamperQuery<T> = {
  eq: (column: string, value: string | boolean) => T;
  lte: (column: string, value: number) => T;
  gte: (column: string, value: number) => T;
  contains: (column: string, value: readonly string[]) => T;
  in: (column: string, value: readonly string[]) => T;
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
      .select("id, created_at, vehicle_images(url, is_main, position)")
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
        imageUrls: orderedImageUrls(row.vehicle_images).filter((url) => url.startsWith("https://")),
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
    .select("*, vehicle_camper_details(*), vehicle_images(url, is_main, position)")
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
    .select("*, vehicle_camper_details(*), vehicle_images(url, is_main, position)")
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
    imageUrls: orderedImageUrls(data.vehicle_images),
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
  const urls = orderedImageUrls(row.vehicle_images);

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
