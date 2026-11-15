"use server";

import { redirect } from "next/navigation";
import { isListingCategory } from "@/lib/listing-options";
import { hideIrrelevant } from "@/lib/listing-sections";
import { listingSubmitSchema } from "@/lib/listing-schema";
import { isSupabaseConfigured, getSupabaseEnv } from "@/utils/supabase/env";
import { createClient } from "@/utils/supabase/server";

const saveError = "Das Inserat konnte nicht gespeichert werden.";

export async function createListing(input: unknown): Promise<{ error: string }> {
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

  const year =
    listing.year ??
    (listing.first_registration ? Number(listing.first_registration.slice(0, 4)) : null);

  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .insert({
      user_id: user.id,
      brand: listing.brand,
      model: listing.model,
      type: listing.category,
      price: listing.price,
      mileage: listing.mileage,
      year,
      description: listing.description,
      status: "aktiv",
      condition: listing.condition,
      price_tax: listing.price_tax,
      availability: listing.availability,
      previous_owners: listing.previous_owners,
      service_record: listing.service_record,
      next_inspection: listing.next_inspection,
      next_gas_inspection: listing.next_gas_inspection,
      speed_100: listing.speed_100,
      first_registration: listing.first_registration,
    })
    .select("id")
    .single();

  if (error || !vehicle) {
    return { error: saveError };
  }

  const { error: detailError } = await supabase.from("vehicle_camper_details").insert({
    vehicle_id: vehicle.id,
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
  });

  if (detailError) {
    await supabase.from("vehicles").delete().eq("id", vehicle.id);
    return { error: "Die technischen Daten konnten nicht gespeichert werden." };
  }

  if (imageUrls.length > 0) {
    const { error: imageError } = await supabase.from("vehicle_images").insert(
      imageUrls.map((url, index) => ({
        vehicle_id: vehicle.id,
        url,
        is_main: index === 0,
      })),
    );

    if (imageError) {
      await supabase.from("vehicles").delete().eq("id", vehicle.id);
      return { error: "Die Bilder konnten nicht zugeordnet werden." };
    }
  }

  redirect(`/fahrzeug/${vehicle.id}`);
}

function publicImageUrl(path: string, userId: string): string | null {
  if (!path.startsWith(`${userId}/`)) {
    return null;
  }

  const { url } = getSupabaseEnv();
  return `${url}/storage/v1/object/public/vehicle-images/${path}`;
}
