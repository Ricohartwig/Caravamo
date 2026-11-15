import { listingFormValues } from "@/lib/listing-form-values";
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
  imageUrl: string | null;
};

export type OwnedDraft = {
  id: string;
  values: ListingFormInput;
  images: { path: string; previewUrl: string }[];
};

const vehicleIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isVehicleId(value: string): boolean {
  return vehicleIdPattern.test(value);
}

export async function listOwnedVehicles(userId: string): Promise<OwnedVehicle[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, brand, model, type, price, status, vehicle_images(url, is_main)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) {
    return [];
  }

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
        status: readString(row.status) ?? "aktiv",
        imageUrl: images[0]?.url ?? null,
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
    .select("*, vehicle_camper_details(*), vehicle_images(url, is_main)")
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

  return {
    id,
    values: listingFormValues(data, firstRecord(data.vehicle_camper_details)),
    images,
  };
}

function imageEntries(value: unknown): { url: string; main: boolean }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const images = value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const url = readString(entry.url);
    return url ? [{ url, main: entry.is_main === true }] : [];
  });

  images.sort((left, right) => Number(right.main) - Number(left.main));
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
