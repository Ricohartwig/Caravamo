import type { VehicleFilters } from "@/lib/filters";
import { isSupabaseConfigured } from "@/utils/supabase/env";
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
  sellerName: string;
  sellerKind: "Privat" | "Händler";
  values: Record<string, unknown>;
};

const emptyFilters: VehicleFilters = {
  brand: "",
  model: "",
  type: "",
  body: "",
  priceMin: null,
  priceMax: null,
};

export async function listNewestOffers(limit = 6): Promise<OfferCard[]> {
  return searchOffers(emptyFilters, limit);
}

export async function searchOffers(filters: VehicleFilters, limit = 48): Promise<OfferCard[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const details = filters.body
    ? "vehicle_camper_details!inner(body_type)"
    : "vehicle_camper_details(body_type)";
  let query = supabase
    .from("vehicles")
    .select(
      `id, brand, model, type, price, mileage, year, first_registration, vehicle_images(url, is_main), ${details}`,
    )
    .eq("status", "aktiv")
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
  if (filters.body) {
    query = query.eq("vehicle_camper_details.body_type", filters.body);
  }
  if (filters.priceMin !== null) {
    query = query.gte("price", filters.priceMin);
  }
  if (filters.priceMax !== null) {
    query = query.lte("price", filters.priceMax);
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.flatMap((row) => {
    const card = toOfferCard(row);
    return card ? [card] : [];
  });
}

function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, (char) => `\\${char}`);
}

export async function getPublishedListing(id: string): Promise<PublishedListing | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*, vehicle_camper_details(*), vehicle_images(url, is_main)")
    .eq("id", id)
    .maybeSingle();

  if (error || !isRecord(data) || data.status !== "aktiv") {
    return null;
  }

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
    sellerName: seller.name,
    sellerKind: seller.kind,
    values: { ...data, ...(details ?? {}) },
  };
}

async function readSeller(userId: string | null): Promise<{ name: string; kind: "Privat" | "Händler" }> {
  if (!userId) {
    return { name: "Privater Anbieter", kind: "Privat" };
  }

  const supabase = await createClient();
  const { data } = await supabase.from("seller_profiles").select("name, role").eq("id", userId).maybeSingle();
  if (!isRecord(data)) {
    return { name: "Privater Anbieter", kind: "Privat" };
  }

  const role = readString(data.role)?.toLowerCase();
  return {
    name: readString(data.name) ?? "Privater Anbieter",
    kind: role === "haendler" || role === "händler" ? "Händler" : "Privat",
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
