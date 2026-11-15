import {
  availabilities,
  batteryTypes,
  bedTypes,
  bodyTypes,
  brakeSystems,
  climateOptions,
  conditions,
  connectivityOptions,
  drivetrains,
  emissionStandards,
  emissionStickers,
  fuels,
  gasBottleTypes,
  gasCapacities,
  heatingSystems,
  isListingCategory,
  jackTypes,
  listingAudiences,
  listingCategories,
  priceTaxes,
  seatingGroups,
  showers,
  tentFabrics,
  toilets,
  transmissions,
  type ListingCategory,
} from "@/lib/listing-options";
import type { ListingOutput, NormalizedListing } from "@/lib/listing-schema";
import { normalizeListing } from "@/lib/listing-schema";

const { all, motorhome, trailers, living, exterior, tent } = listingAudiences;

export type ListingFieldKind =
  | "text"
  | "number"
  | "select"
  | "date"
  | "checkbox"
  | "checks"
  | "textarea"
  | "body";

export type ListingField = {
  name: keyof ListingOutput;
  label: string;
  kind: ListingFieldKind;
  categories: readonly ListingCategory[];
  always?: boolean;
  options?: readonly string[];
  unit?: string;
  section: string;
  sectionTitle: string;
};

export const listingFields = [
  { name: "category", label: "Fahrzeugart", kind: "select", categories: all, always: true, options: listingCategories, section: "allgemein", sectionTitle: "Allgemeine Angaben" },
  { name: "brand", label: "Marke", kind: "text", categories: all, always: true, section: "allgemein", sectionTitle: "Allgemeine Angaben" },
  { name: "model", label: "Modell", kind: "text", categories: all, always: true, section: "allgemein", sectionTitle: "Allgemeine Angaben" },
  { name: "condition", label: "Zustand", kind: "select", categories: all, always: true, options: conditions, section: "allgemein", sectionTitle: "Allgemeine Angaben" },
  { name: "price", label: "Verkaufspreis", kind: "number", categories: all, always: true, unit: "EUR", section: "allgemein", sectionTitle: "Allgemeine Angaben" },
  { name: "price_tax", label: "Preisangabe", kind: "select", categories: all, always: true, options: priceTaxes, section: "allgemein", sectionTitle: "Allgemeine Angaben" },
  { name: "year", label: "Baujahr", kind: "number", categories: all, always: true, section: "allgemein", sectionTitle: "Allgemeine Angaben" },
  { name: "first_registration", label: "Erstzulassung", kind: "date", categories: all, always: true, section: "allgemein", sectionTitle: "Allgemeine Angaben" },
  { name: "mileage", label: "Kilometerstand", kind: "number", categories: motorhome, unit: "km", section: "allgemein", sectionTitle: "Allgemeine Angaben" },
  { name: "availability", label: "Verfügbarkeit", kind: "select", categories: all, always: true, options: availabilities, section: "allgemein", sectionTitle: "Allgemeine Angaben" },
  { name: "previous_owners", label: "Anzahl Vorbesitzer", kind: "number", categories: all, always: true, section: "allgemein", sectionTitle: "Allgemeine Angaben" },
  { name: "service_record", label: "Scheckheftgepflegt", kind: "checkbox", categories: all, always: true, section: "allgemein", sectionTitle: "Allgemeine Angaben" },
  { name: "next_inspection", label: "Nächste HU/AU", kind: "date", categories: all, always: true, section: "allgemein", sectionTitle: "Allgemeine Angaben" },
  { name: "next_gas_inspection", label: "Nächste Gasprüfung (G 607)", kind: "date", categories: all, always: true, section: "allgemein", sectionTitle: "Allgemeine Angaben" },
  { name: "speed_100", label: "100 km/h Zulassung", kind: "checkbox", categories: trailers, section: "allgemein", sectionTitle: "Allgemeine Angaben" },
  { name: "description", label: "Beschreibung", kind: "textarea", categories: all, always: true, section: "allgemein", sectionTitle: "Allgemeine Angaben" },
  { name: "body_type", label: "Aufbauart", kind: "body", categories: all, section: "aufbau", sectionTitle: "Aufbau" },
  { name: "gross_weight_kg", label: "Zulässiges Gesamtgewicht", kind: "number", categories: all, unit: "kg", section: "masse", sectionTitle: "Maße und Gewichte" },
  { name: "curb_weight_kg", label: "Leergewicht", kind: "number", categories: all, unit: "kg", section: "masse", sectionTitle: "Maße und Gewichte" },
  { name: "length_cm", label: "Länge", kind: "number", categories: all, unit: "cm", section: "masse", sectionTitle: "Maße und Gewichte" },
  { name: "width_cm", label: "Breite", kind: "number", categories: all, unit: "cm", section: "masse", sectionTitle: "Maße und Gewichte" },
  { name: "height_cm", label: "Höhe", kind: "number", categories: all, unit: "cm", section: "masse", sectionTitle: "Maße und Gewichte" },
  { name: "weight_adjusted", label: "Aufgelastet oder abgelastet", kind: "checkbox", categories: all, section: "masse", sectionTitle: "Maße und Gewichte" },
  { name: "axle_count", label: "Achsenanzahl", kind: "number", categories: all, section: "masse", sectionTitle: "Maße und Gewichte" },
  { name: "braked_tow_kg", label: "Anhängelast gebremst", kind: "number", categories: motorhome, unit: "kg", section: "masse", sectionTitle: "Maße und Gewichte" },
  { name: "unbraked_tow_kg", label: "Anhängelast ungebremst", kind: "number", categories: motorhome, unit: "kg", section: "masse", sectionTitle: "Maße und Gewichte" },
  { name: "chassis", label: "Basisfahrzeug / Chassis", kind: "text", categories: motorhome, section: "motor", sectionTitle: "Motor und Chassis" },
  { name: "power_ps", label: "Leistung", kind: "number", categories: motorhome, unit: "PS", section: "motor", sectionTitle: "Motor und Chassis" },
  { name: "fuel", label: "Kraftstoff", kind: "select", categories: motorhome, options: fuels, section: "motor", sectionTitle: "Motor und Chassis" },
  { name: "transmission", label: "Getriebe", kind: "select", categories: motorhome, options: transmissions, section: "motor", sectionTitle: "Motor und Chassis" },
  { name: "emission_standard", label: "Abgasnorm", kind: "select", categories: motorhome, options: emissionStandards, section: "motor", sectionTitle: "Motor und Chassis" },
  { name: "emission_sticker", label: "Umweltplakette", kind: "select", categories: motorhome, options: emissionStickers, section: "motor", sectionTitle: "Motor und Chassis" },
  { name: "drivetrain", label: "Antrieb", kind: "select", categories: motorhome, options: drivetrains, section: "motor", sectionTitle: "Motor und Chassis" },
  { name: "sleeping_places", label: "Schlafplätze", kind: "number", categories: living, section: "wohnen", sectionTitle: "Schlafen und Sitzen" },
  { name: "bed_types", label: "Bettentyp", kind: "checks", categories: living, options: bedTypes, section: "wohnen", sectionTitle: "Schlafen und Sitzen" },
  { name: "belted_seats", label: "Sitzplätze mit Gurt", kind: "number", categories: motorhome, section: "wohnen", sectionTitle: "Schlafen und Sitzen" },
  { name: "seating_group", label: "Sitzgruppe", kind: "select", categories: living, options: seatingGroups, section: "wohnen", sectionTitle: "Schlafen und Sitzen" },
  { name: "battery_ah", label: "Aufbaubatterie", kind: "number", categories: all, unit: "Ah", section: "autarkie", sectionTitle: "Autarkie und Internet" },
  { name: "battery_type", label: "Batterietyp", kind: "select", categories: all, options: batteryTypes, section: "autarkie", sectionTitle: "Autarkie und Internet" },
  { name: "has_solar", label: "Solaranlage vorhanden", kind: "checkbox", categories: all, section: "autarkie", sectionTitle: "Autarkie und Internet" },
  { name: "solar_wp", label: "Solarleistung", kind: "number", categories: all, unit: "Wp", section: "autarkie", sectionTitle: "Autarkie und Internet" },
  { name: "has_inverter", label: "Wechselrichter vorhanden", kind: "checkbox", categories: all, section: "autarkie", sectionTitle: "Autarkie und Internet" },
  { name: "inverter_w", label: "Wechselrichterleistung", kind: "number", categories: all, unit: "Watt", section: "autarkie", sectionTitle: "Autarkie und Internet" },
  { name: "has_dc_charger", label: "Ladebooster (DC-DC) verbaut", kind: "checkbox", categories: all, section: "autarkie", sectionTitle: "Autarkie und Internet" },
  { name: "connectivity", label: "Internet und Empfang", kind: "checks", categories: all, options: connectivityOptions, section: "autarkie", sectionTitle: "Autarkie und Internet" },
  { name: "heating", label: "Heizung", kind: "select", categories: living, options: heatingSystems, section: "wasser", sectionTitle: "Wasser, Heizung und Sanitär" },
  { name: "fresh_water_l", label: "Frischwasser", kind: "number", categories: living, unit: "Liter", section: "wasser", sectionTitle: "Wasser, Heizung und Sanitär" },
  { name: "waste_water_l", label: "Abwasser", kind: "number", categories: living, unit: "Liter", section: "wasser", sectionTitle: "Wasser, Heizung und Sanitär" },
  { name: "waste_tank_heated", label: "Abwassertank isoliert oder beheizt", kind: "checkbox", categories: living, section: "wasser", sectionTitle: "Wasser, Heizung und Sanitär" },
  { name: "climate", label: "Klimatisierung", kind: "checks", categories: living, options: climateOptions, section: "wasser", sectionTitle: "Wasser, Heizung und Sanitär" },
  { name: "toilet", label: "Toilette", kind: "select", categories: living, options: toilets, section: "wasser", sectionTitle: "Wasser, Heizung und Sanitär" },
  { name: "shower", label: "Dusche", kind: "select", categories: living, options: showers, section: "wasser", sectionTitle: "Wasser, Heizung und Sanitär" },
  { name: "gas_capacity", label: "Gas-Kapazität", kind: "select", categories: living, options: gasCapacities, section: "gas", sectionTitle: "Gasversorgung" },
  { name: "gas_bottle_type", label: "Gasflaschenart", kind: "select", categories: living, options: gasBottleTypes, section: "gas", sectionTitle: "Gasversorgung" },
  { name: "has_crash_sensor", label: "Crash-Sensor", kind: "checkbox", categories: living, section: "gas", sectionTitle: "Gasversorgung" },
  { name: "has_awning", label: "Markise", kind: "checkbox", categories: exterior, section: "aussen", sectionTitle: "Exterieur" },
  { name: "has_bike_rack", label: "Fahrradträger", kind: "checkbox", categories: all, section: "aussen", sectionTitle: "Exterieur" },
  { name: "has_tow_hitch", label: "Anhängerkupplung", kind: "checkbox", categories: all, section: "aussen", sectionTitle: "Exterieur" },
  { name: "has_mover", label: "Mover", kind: "checkbox", categories: trailers, section: "aussen", sectionTitle: "Exterieur" },
  { name: "jack_type", label: "Hubstützen", kind: "select", categories: all, options: jackTypes, section: "aussen", sectionTitle: "Exterieur" },
  { name: "has_air_suspension", label: "Luftfederung", kind: "checkbox", categories: exterior, section: "aussen", sectionTitle: "Exterieur" },
  { name: "includes_porch", label: "Vorzelt inklusive", kind: "checkbox", categories: exterior, section: "aussen", sectionTitle: "Exterieur" },
  { name: "brake_system", label: "Bremssystem", kind: "select", categories: tent, options: brakeSystems, section: "zelt", sectionTitle: "Zeltanhänger" },
  { name: "tent_fabric", label: "Material Zeltstoff", kind: "select", categories: tent, options: tentFabrics, section: "zelt", sectionTitle: "Zeltanhänger" },
  { name: "setup_minutes", label: "Aufbauzeit", kind: "number", categories: tent, unit: "Minuten", section: "zelt", sectionTitle: "Zeltanhänger" },
  { name: "has_kitchen_module", label: "Küchenmodul integriert", kind: "checkbox", categories: tent, section: "zelt", sectionTitle: "Zeltanhänger" },
  { name: "lid_payload_kg", label: "Zuladung auf dem Deckel", kind: "number", categories: tent, unit: "kg", section: "zelt", sectionTitle: "Zeltanhänger" },
] as const satisfies readonly ListingField[];

type Covered = (typeof listingFields)[number]["name"];
type Missing = Exclude<keyof ListingOutput, Covered>;
const listingFieldsCoverSchema: Missing extends never ? true : Missing = true;
void listingFieldsCoverSchema;

export function isFieldVisible(field: ListingField, category: string): boolean {
  if (field.always) {
    return true;
  }

  return isListingCategory(category) && field.categories.includes(category);
}

export function bodyOptions(category: string): readonly string[] {
  if (!isListingCategory(category)) {
    return [];
  }

  return bodyTypes[category];
}

export type ClearedListing = {
  [K in keyof ListingOutput]: ListingOutput[K] extends boolean
    ? boolean | null
    : ListingOutput[K] extends string
      ? string | null
      : ListingOutput[K];
};

export function hideIrrelevant(listing: ListingOutput): NormalizedListing {
  const cleared = { ...listing } as ClearedListing;

  for (const field of listingFields) {
    if (isFieldVisible(field, listing.category)) {
      continue;
    }

    blankField(cleared, field);
  }

  return normalizeListing(cleared);
}

function blankField(cleared: ClearedListing, field: ListingField): void {
  const target = cleared as Record<string, unknown>;
  target[field.name] = field.kind === "checks" ? [] : null;
}

export function listingSections(category: string): { id: string; title: string; fields: ListingField[] }[] {
  const groups = new Map<string, { id: string; title: string; fields: ListingField[] }>();

  for (const field of listingFields) {
    if (!isFieldVisible(field, category)) {
      continue;
    }

    const group = groups.get(field.section) ?? {
      id: field.section,
      title: field.sectionTitle,
      fields: [],
    };
    group.fields.push(field);
    groups.set(field.section, group);
  }

  return [...groups.values()];
}
