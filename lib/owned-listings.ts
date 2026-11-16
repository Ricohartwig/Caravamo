import { listingFormValues } from "@/lib/listing-form-values";
import { paidTimeLeft } from "@/lib/listing-state";
import type { ListingFormInput } from "@/lib/listing-schema";
import { storagePathFromPublicUrl } from "@/lib/vehicle-images";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { createClient } from "@/utils/supabase/server";

export type OwnedVehicle = {
  id: string;
  title: string;
  price: number;
  type: string;
  status: string;
  publishedUntil: string | null;
  imageUrl: string | null;
  createdAt: string | null;
  viewCount: number;
  inquiryCount: number;
  saveCount: number;
  billingSource: "einzeln" | "paket";
};

export type OwnedDraft = {
  id: string;
  status: string;
  publishedUntil: string | null;
  values: ListingFormInput;
  images: { path: string; previewUrl: string }[];
};

const vehicleIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isVehicleId(value: string): boolean {
  return vehicleIdPattern.test(value);
}

export function listingsExpiringWithin(vehicles: OwnedVehicle[], days = 7): OwnedVehicle[] {
  const now = Date.now();
  const soon = now + days * 24 * 60 * 60 * 1000;
  return vehicles.filter((vehicle) => {
    if (vehicle.status !== "aktiv" && vehicle.status !== "inaktiv") {
      return false;
    }

    if (!paidTimeLeft(vehicle.publishedUntil, now)) {
      return false;
    }

    return new Date(vehicle.publishedUntil ?? "").getTime() <= soon;
  });
}

export async function listOwnedVehicles(userId: string): Promise<OwnedVehicle[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, brand, model, type, price, status, published_until, created_at, view_count, billing_source, vehicle_images(url, is_main)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) {
    return [];
  }

  const signals = await listingSignals(
    supabase,
    data.flatMap((row) => (isRecord(row) && typeof row.id === "string" ? [row.id] : [])),
  );

  return data.flatMap((row) => {
    if (!isRecord(row) || typeof row.id !== "string") {
      return [];
    }

    const price = readNumber(row.price);
    if (price === null) {
      return [];
    }

    const brand = readString(row.brand) ?? "Fahrzeug";
    const model = readString(row.model) ?? "";
    const images = imageEntries(row.vehicle_images);

    return [
      {
        id: row.id,
        title: model ? `${brand} ${model}` : brand,
        price,
        type: readString(row.type) ?? "Fahrzeug",
        status: readString(row.status) ?? "entwurf",
        publishedUntil: readString(row.published_until),
        imageUrl: images[0]?.url ?? null,
        createdAt: readString(row.created_at),
        viewCount: readNumber(row.view_count) ?? 0,
        inquiryCount: signals.get(row.id)?.inquiries ?? 0,
        saveCount: signals.get(row.id)?.saves ?? 0,
        billingSource: readString(row.billing_source) === "paket" ? "paket" : "einzeln",
      },
    ];
  });
}

export async function getOwnedDraft(userId: string, id: string): Promise<OwnedDraft | null> {
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

  const images = imageEntries(data.vehicle_images).flatMap((image) => {
    const path = storagePathFromPublicUrl(image.url, userId);
    return path ? [{ path, previewUrl: image.url }] : [];
  });

  const status = readString(data.status) ?? "entwurf";
  const publishedUntil = readString(data.published_until);

  return {
    id,
    status,
    publishedUntil,
    values: listingFormValues(data, firstRecord(data.vehicle_camper_details)),
    images,
  };
}

export async function ownerSaveCount(vehicleId: string): Promise<number> {
  if (!isSupabaseConfigured() || !isVehicleId(vehicleId)) {
    return 0;
  }

  const supabase = await createClient();
  const signals = await listingSignals(supabase, [vehicleId]);
  return signals.get(vehicleId)?.saves ?? 0;
}

async function listingSignals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
): Promise<Map<string, { inquiries: number; saves: number }>> {
  const signals = new Map<string, { inquiries: number; saves: number }>();
  if (ids.length === 0) {
    return signals;
  }

  const { data, error } = await supabase.rpc("owner_listing_signals", { listing_ids: ids });
  if (error || !Array.isArray(data)) {
    return signals;
  }

  for (const row of data) {
    if (!isRecord(row) || typeof row.vehicle_id !== "string") {
      continue;
    }

    signals.set(row.vehicle_id, {
      inquiries: readNumber(row.inquiries) ?? 0,
      saves: readNumber(row.saves) ?? 0,
    });
  }

  return signals;
}

function imageEntries(value: unknown): { url: string; main: boolean; position: number }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const images = value.flatMap((entry, index) => {
    if (!isRecord(entry)) {
      return [];
    }

    const url = readString(entry.url);
    const position = readNumber(entry.position);
    return url ? [{ url, main: entry.is_main === true, position: position ?? index }] : [];
  });

  images.sort((left, right) => left.position - right.position || Number(right.main) - Number(left.main));
  return images;
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
