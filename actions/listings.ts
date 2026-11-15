"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isListingCategory } from "@/lib/listing-options";
import { hideIrrelevant } from "@/lib/listing-sections";
import { listingSubmitSchema, type NormalizedListing } from "@/lib/listing-schema";
import { beginCheckout } from "@/actions/checkout";
import { canMarkSold, canPause, canResume, listingNeedsPayment } from "@/lib/listing-state";
import { isVehicleId } from "@/lib/owned-listings";
import { publicImageUrl, storagePathFromPublicUrl } from "@/lib/vehicle-images";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { createClient } from "@/utils/supabase/server";

const saveError = "Das Inserat konnte nicht gespeichert werden.";

export async function createListing(input: unknown): Promise<{ error: string } | void> {
  const prepared = await prepareListing(input);
  if ("error" in prepared) {
    return prepared;
  }

  const { supabase, userId, listing, imageUrls } = prepared;
  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .insert({ user_id: userId, status: "entwurf", ...vehicleColumns(listing) })
    .select("id")
    .single();

  if (error || !vehicle) {
    return { error: saveError };
  }

  const { error: detailError } = await supabase
    .from("vehicle_camper_details")
    .insert(detailColumns(vehicle.id, listing));

  if (detailError) {
    await supabase.from("vehicles").delete().eq("id", vehicle.id);
    return { error: "Die technischen Daten konnten nicht gespeichert werden." };
  }

  if (imageUrls.length > 0) {
    const { error: imageError } = await supabase.from("vehicle_images").insert(imageRows(vehicle.id, imageUrls));
    if (imageError) {
      await supabase.from("vehicles").delete().eq("id", vehicle.id);
      return { error: "Die Bilder konnten nicht zugeordnet werden." };
    }
  }

  refreshListing(vehicle.id);
  await beginCheckout(vehicle.id);
}

export async function updateListing(id: string, input: unknown): Promise<{ error: string } | void> {
  if (!isVehicleId(id)) {
    return { error: saveError };
  }

  const prepared = await prepareListing(input);
  if ("error" in prepared) {
    return prepared;
  }

  const { supabase, userId, listing, imageUrls } = prepared;
  const { data: owned, error: ownedError } = await supabase
    .from("vehicles")
    .select("id, status, published_until, vehicle_images(url)")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (ownedError || !owned) {
    return { error: "Dieses Inserat gehört nicht zu deinem Konto." };
  }

  const { data: updated, error } = await supabase
    .from("vehicles")
    .update(vehicleColumns(listing))
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    return { error: saveError };
  }

  const { error: detailError } = await supabase
    .from("vehicle_camper_details")
    .upsert(detailColumns(id, listing), { onConflict: "vehicle_id" });

  if (detailError) {
    return { error: "Die technischen Daten konnten nicht gespeichert werden." };
  }

  const previousUrls = imageUrlsFrom(owned.vehicle_images);
  const { error: removedError } = await supabase.from("vehicle_images").delete().eq("vehicle_id", id);
  if (removedError) {
    return { error: "Die Bilder konnten nicht aktualisiert werden." };
  }

  if (imageUrls.length > 0) {
    const { error: imageError } = await supabase.from("vehicle_images").insert(imageRows(id, imageUrls));
    if (imageError) {
      if (previousUrls.length > 0) {
        await supabase.from("vehicle_images").insert(imageRows(id, previousUrls));
      }
      return { error: "Die Bilder konnten nicht aktualisiert werden." };
    }
  }

  const nextPaths = new Set(
    imageUrls.flatMap((url) => {
      const path = storagePathFromPublicUrl(url, userId);
      return path ? [path] : [];
    }),
  );
  const removedPaths = previousUrls.flatMap((url) => {
    const path = storagePathFromPublicUrl(url, userId);
    return path && !nextPaths.has(path) ? [path] : [];
  });

  if (removedPaths.length > 0) {
    await supabase.storage.from("vehicle-images").remove(removedPaths);
  }

  refreshListing(id);
  const status = typeof owned.status === "string" ? owned.status : "entwurf";
  const publishedUntil = typeof owned.published_until === "string" ? owned.published_until : null;
  if (!listingNeedsPayment(status, publishedUntil)) {
    redirect(status === "aktiv" ? `/fahrzeug/${id}` : `/vorschau/${id}`);
  }

  await beginCheckout(id);
}

export async function setListingState(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("status") ?? "");
  const backToPreview = formData.get("return") === "vorschau";
  const fail = (code: string) => redirect(listingReturn(id, backToPreview, code));

  if (!isVehicleId(id) || (next !== "aktiv" && next !== "inaktiv" && next !== "verkauft")) {
    fail("nicht-moeglich");
  }

  const owned = await ownedListing(id);
  if (!owned) {
    redirect("/dashboard/inserate?hinweis=unbekannt");
  }

  const allowed =
    (next === "inaktiv" && canPause(owned.status, owned.publishedUntil)) ||
    (next === "aktiv" && canResume(owned.status, owned.publishedUntil)) ||
    (next === "verkauft" && canMarkSold(owned.status, owned.publishedUntil));
  if (!allowed) {
    fail("nicht-moeglich");
  }

  const { error } = await owned.supabase.from("vehicles").update({ status: next }).eq("id", id).eq("user_id", owned.userId);
  refreshListing(id);
  const code = error ? "nicht-moeglich" : next === "aktiv" ? "online" : next === "inaktiv" ? "pausiert" : "verkauft";
  redirect(listingReturn(id, backToPreview, code));
}

export async function duplicateListing(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!isVehicleId(id)) {
    redirect("/dashboard/inserate?hinweis=kopie-fehler");
  }

  const owned = await ownedListing(id);
  if (!owned) {
    redirect("/dashboard/inserate?hinweis=unbekannt");
  }

  const { data: vehicle, error: vehicleError } = await owned.supabase
    .from("vehicles")
    .select("brand, model, type, price, mileage, year, description, condition, price_tax, availability, previous_owners, service_record, next_inspection, next_gas_inspection, speed_100, first_registration")
    .eq("id", id)
    .eq("user_id", owned.userId)
    .maybeSingle();
  if (vehicleError || !vehicle) {
    redirect("/dashboard/inserate?hinweis=kopie-fehler");
  }

  const { data: copy, error: copyError } = await owned.supabase
    .from("vehicles")
    .insert({ user_id: owned.userId, status: "entwurf", ...vehicle })
    .select("id")
    .single();
  if (copyError || !copy || typeof copy.id !== "string") {
    redirect("/dashboard/inserate?hinweis=kopie-fehler");
  }

  const { data: details } = await owned.supabase.from("vehicle_camper_details").select("*").eq("vehicle_id", id).maybeSingle();
  if (details && typeof details === "object") {
    const { payload_kg: _payload, vehicle_id: _vehicleId, ...columns } = details as Record<string, unknown>;
    const { error: detailError } = await owned.supabase
      .from("vehicle_camper_details")
      .insert({ ...columns, vehicle_id: copy.id });
    if (detailError) {
      await owned.supabase.from("vehicles").delete().eq("id", copy.id);
      redirect("/dashboard/inserate?hinweis=kopie-fehler");
    }
  }

  const { data: images } = await owned.supabase.from("vehicle_images").select("url, is_main").eq("vehicle_id", id);
  if (Array.isArray(images) && images.length > 0) {
    const rows = images.flatMap((image) => {
      if (!image || typeof image.url !== "string" || image.url === "") {
        return [];
      }
      return [{ vehicle_id: copy.id, url: image.url, is_main: image.is_main === true }];
    });
    if (rows.length > 0) {
      const { error: imageError } = await owned.supabase.from("vehicle_images").insert(rows);
      if (imageError) {
        await owned.supabase.from("vehicles").delete().eq("id", copy.id);
        redirect("/dashboard/inserate?hinweis=kopie-fehler");
      }
    }
  }

  refreshListing(copy.id);
  redirect(`/inserieren/${copy.id}`);
}

export async function deleteListing(
  _state: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const id = String(formData.get("id") ?? "");
  if (!isVehicleId(id)) {
    return { error: "Das Inserat konnte nicht gelöscht werden." };
  }

  if (!isSupabaseConfigured()) {
    return { error: "Supabase ist noch nicht verbunden." };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return { error: "Bitte melde dich an, bevor du ein Inserat löschst." };
  }

  const { data: owned, error: ownedError } = await supabase
    .from("vehicles")
    .select("id, vehicle_images(url)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownedError || !owned) {
    return { error: "Dieses Inserat gehört nicht zu deinem Konto." };
  }

  const paths = imageUrlsFrom(owned.vehicle_images).flatMap((url) => {
    const path = storagePathFromPublicUrl(url, user.id);
    return path ? [path] : [];
  });

  const { error } = await supabase.from("vehicles").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    return { error: "Das Inserat konnte nicht gelöscht werden." };
  }

  const stillUsed = new Set<string>();
  if (paths.length > 0) {
    const urls = imageUrlsFrom(owned.vehicle_images);
    const { data: remaining } = await supabase.from("vehicle_images").select("url").in("url", urls);
    if (Array.isArray(remaining)) {
      for (const row of remaining) {
        if (row && typeof row.url === "string") {
          stillUsed.add(row.url);
        }
      }
    }
  }

  const removable = imageUrlsFrom(owned.vehicle_images).flatMap((url) => {
    if (stillUsed.has(url)) {
      return [];
    }
    const path = storagePathFromPublicUrl(url, user.id);
    return path ? [path] : [];
  });

  if (removable.length > 0) {
    const removed = await supabase.storage.from("vehicle-images").remove(removable);
    if (removed.error) {
      return { error: "Das Inserat ist gelöscht, ein Bild blieb im Speicher." };
    }
  }

  refreshListing(id);
  redirect("/dashboard");
}

async function prepareListing(input: unknown): Promise<
  | { error: string }
  | {
      supabase: Awaited<ReturnType<typeof createClient>>;
      userId: string;
      listing: NormalizedListing;
      imageUrls: string[];
    }
> {
  const parsed = listingSubmitSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Bitte prüfe die markierten Angaben." };
  }

  if (!isSupabaseConfigured()) {
    return { error: "Supabase ist noch nicht verbunden." };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return { error: "Bitte melde dich an, bevor du ein Inserat speicherst." };
  }

  const listing = hideIrrelevant(parsed.data);
  if (!isListingCategory(listing.category ?? "") || listing.price === null || !listing.brand || !listing.model) {
    return { error: "Bitte prüfe die markierten Angaben." };
  }

  const imageUrls: string[] = [];
  for (const image of parsed.data.images) {
    const url = publicImageUrl(image.path, user.id);
    if (!url) {
      return { error: "Ein Bild liegt außerhalb deines Ordners." };
    }
    imageUrls.push(url);
  }

  return { supabase, userId: user.id, listing, imageUrls };
}

function vehicleColumns(listing: NormalizedListing) {
  const year =
    listing.year ??
    (listing.first_registration ? Number(listing.first_registration.slice(0, 4)) : null);

  return {
    brand: listing.brand,
    model: listing.model,
    type: listing.category,
    price: listing.price,
    mileage: listing.mileage,
    year,
    description: listing.description,
    condition: listing.condition,
    price_tax: listing.price_tax,
    availability: listing.availability,
    previous_owners: listing.previous_owners,
    service_record: listing.service_record,
    next_inspection: listing.next_inspection,
    next_gas_inspection: listing.next_gas_inspection,
    speed_100: listing.speed_100,
    first_registration: listing.first_registration,
  };
}

function detailColumns(vehicleId: string, listing: NormalizedListing) {
  return {
    vehicle_id: vehicleId,
    body_type: listing.body_type,
    gross_weight_kg: listing.gross_weight_kg,
    curb_weight_kg: listing.curb_weight_kg,
    length_cm: listing.length_cm,
    width_cm: listing.width_cm,
    height_cm: listing.height_cm,
    weight_adjusted: listing.weight_adjusted,
    axle_count: listing.axle_count,
    braked_tow_kg: listing.braked_tow_kg,
    unbraked_tow_kg: listing.unbraked_tow_kg,
    chassis: listing.chassis,
    power_ps: listing.power_ps,
    fuel: listing.fuel,
    transmission: listing.transmission,
    emission_standard: listing.emission_standard,
    emission_sticker: listing.emission_sticker,
    drivetrain: listing.drivetrain,
    sleeping_places: listing.sleeping_places,
    bed_types: listing.bed_types,
    belted_seats: listing.belted_seats,
    seating_group: listing.seating_group,
    battery_ah: listing.battery_ah,
    battery_type: listing.battery_type,
    has_solar: listing.has_solar,
    solar_wp: listing.solar_wp,
    has_inverter: listing.has_inverter,
    inverter_w: listing.inverter_w,
    has_dc_charger: listing.has_dc_charger,
    connectivity: listing.connectivity,
    heating: listing.heating,
    fresh_water_l: listing.fresh_water_l,
    waste_water_l: listing.waste_water_l,
    waste_tank_heated: listing.waste_tank_heated,
    climate: listing.climate,
    toilet: listing.toilet,
    shower: listing.shower,
    gas_capacity: listing.gas_capacity,
    gas_bottle_type: listing.gas_bottle_type,
    has_crash_sensor: listing.has_crash_sensor,
    has_awning: listing.has_awning,
    has_bike_rack: listing.has_bike_rack,
    has_tow_hitch: listing.has_tow_hitch,
    has_mover: listing.has_mover,
    jack_type: listing.jack_type,
    has_air_suspension: listing.has_air_suspension,
    includes_porch: listing.includes_porch,
    brake_system: listing.brake_system,
    tent_fabric: listing.tent_fabric,
    setup_minutes: listing.setup_minutes,
    has_kitchen_module: listing.has_kitchen_module,
    lid_payload_kg: listing.lid_payload_kg,
  };
}

function imageRows(vehicleId: string, urls: string[]) {
  return urls.map((url, index) => ({
    vehicle_id: vehicleId,
    url,
    is_main: index === 0,
  }));
}

function imageUrlsFrom(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null || !("url" in entry)) {
      return [];
    }

    return typeof entry.url === "string" && entry.url !== "" ? [entry.url] : [];
  });
}

async function ownedListing(id: string): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  status: string;
  publishedUntil: string | null;
} | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    redirect(`/login?next=/dashboard/inserate`);
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("status, published_until")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) {
    return null;
  }

  return {
    supabase,
    userId: user.id,
    status: typeof data.status === "string" ? data.status : "entwurf",
    publishedUntil: typeof data.published_until === "string" ? data.published_until : null,
  };
}

function listingReturn(id: string, preview: boolean, code: string): string {
  if (preview && isVehicleId(id)) {
    return `/vorschau/${id}?hinweis=${code}`;
  }

  return `/dashboard/inserate?hinweis=${code}`;
}

function refreshListing(id: string) {
  revalidatePath("/");
  revalidatePath("/suche");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inserate");
  revalidatePath(`/fahrzeug/${id}`);
  revalidatePath(`/vorschau/${id}`);
  revalidatePath(`/inserieren/${id}`);
}
